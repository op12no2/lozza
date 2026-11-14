/*
Lozza net trainer for bullet (https://github.com/jw1912/bullet), checked out at ../bullet.

Arch is (768 -> L1)x2 -> 1 x OUTPUT_BUCKETS, dual perspective, no input buckets, i.e.
the same shape as the net embedded in lozza.js. There are OUTPUT_BUCKETS output layers
and the number of pieces on the board picks which one is used (see netEval() in
lozza.js). The hidden layer activation is SCReLU, as in netEvalSum() in lozza.js and
net_eval() in lozza.c; it is not recorded in the net file.

The save format below matches netLoad() in lozza.js exactly (quantised.bin in the
checkpoint directory):

  l0w  768 x L1   i16  * QA      column-major, so weights for feature i are at i*L1
  l0b  L1         i16  * QA
  l1w  OUTPUT_BUCKETS x 2*L1   i16  * QB      one bucket after another, each an us half then a them half
  l1b  OUTPUT_BUCKETS          i16  * QA*QB

Run with bin/train.sh run (builds a tiny cargo project in junk/train against ../bullet
with the cuda feature and runs it, after copying this file into OUTPUT_DIR as a record
of how the net was trained). The data is the binpack files in DATA_FILES below.
bin/train.sh reads OUTPUT_DIR and DATA_FILES from here so keep each of them on one
line.

Positions seen = SB * BATCHES_PER_SB * BATCH_SIZE = SB * 100M, so with one monthly
Leela file (about 1.5 billion usable positions) SB = 200 is about 13 passes.

To resume from a checkpoint uncomment the load_from_checkpoint line and set
start_superbatch to the checkpoint number + 1.
*/

use bullet_lib::{
    game::{inputs::Chess768, outputs::MaterialCount},
    nn::optimiser::{AdamW, AdamWParams},
    trainer::{
        save::SavedFormat,
        schedule::{TrainingSchedule, TrainingSteps, lr, wdl},
        settings::LocalSettings,
    },
    value::{
        ValueTrainerBuilder,
        loader::{
            SfBinpackLoader,
            sfbinpack::{MoveType, PieceType, TrainingDataEntry},
        },
    },
};

const NET_ID: &str = "lozza";
const OUTPUT_DIR: &str = "/home/xyzzy/lozza/nets/new";

// Training data: Stockfish binpacks, uncompressed (zstd -d), e.g. the Leela data at
// https://huggingface.co/datasets/linrock (see bin/train.sh for how to get it). These
// hold whole games, so the positions are picked by binpack_filter() and shuffled on
// the fly in a buffer of BINPACK_BUFFER_MB.

const DATA_FILES: [&str; 1] = ["/home/xyzzy/lozza/data/leela/test80-2024-02-feb-2tb7p.min-v2.v6.binpack"];

const BINPACK_BUFFER_MB: usize = 32768; // half of this is the shuffle buffer, 32 bytes per position
const BINPACK_THREADS: usize = 8;

// Which binpack positions to train on. The score is for the side to move in centipawns
// and entry.mv is the move that was played.

fn binpack_filter(entry: &TrainingDataEntry) -> bool {
    entry.ply >= 16                                                             // not the opening
        && !entry.pos.is_checked(entry.pos.side_to_move())                      // not in check
        && entry.score.unsigned_abs() <= 10000                                  // no mate/tablebase scores, and the minimised
                                                                                // files mark positions to skip with 32002
        && entry.mv.mtype() == MoveType::Normal                                 // move is not castling, ep or a promotion
        && entry.pos.piece_at(entry.mv.to()).piece_type() == PieceType::None    // move is not a capture
}

const L1: usize = 1536;               // NET_H1_SIZE in lozza.js
const OUTPUT_BUCKETS: usize = 8;        // NET_O_SIZE in lozza.js
const SCALE: f32 = 400.0;
const QA: i16 = 255;
const QB: i16 = 64;

const SB: usize = 200;
const BATCH_SIZE: usize = 16_384;
const BATCHES_PER_SB: usize = 6104;
const WDL: f32 = 0.2;
const LR: f32 = 0.001;
const FINAL_LR: f32 = 0.001 * 0.3 * 0.3 * 0.3 * 0.3 * 0.3;
const WARMUP_BATCHES: usize = 200;
const SAVE_RATE: usize = SB;

const THREADS: usize = 8;
const BATCH_QUEUE_SIZE: usize = 64;

fn main() {
    let mut trainer = ValueTrainerBuilder::default()
        .dual_perspective()
        .optimiser(AdamW)
        .inputs(Chess768)
        .output_buckets(MaterialCount::<OUTPUT_BUCKETS>)    // bucket = (pieces on the board - 2) / 4
        .save_format(&[
            SavedFormat::id("l0w").round().quantise::<i16>(QA),
            SavedFormat::id("l0b").round().quantise::<i16>(QA),
            SavedFormat::id("l1w").round().quantise::<i16>(QB).transpose(),   // transpose: bucket by bucket
            SavedFormat::id("l1b").round().quantise::<i16>(QA * QB),
        ])
        // target = wdl * result + (1 - wdl) * sigmoid(score / SCALE)
        .loss_fn(|output, target| output.sigmoid().squared_error(target))
        .build(|builder, stm_inputs, ntm_inputs, output_buckets| {
            let l0 = builder.new_affine("l0", 768, L1);
            let l1 = builder.new_affine("l1", 2 * L1, OUTPUT_BUCKETS);

            let stm_acc = l0.forward(stm_inputs);
            let ntm_acc = l0.forward(ntm_inputs);

            // The hidden layer activation is SCReLU, clamp(x, 0, 1)^2, where x is the
            // accumulator value; 1.0 is QA when quantised, so the engine clamps to 0..QA
            // before squaring (netEvalSum() in lozza.js, net_eval() in lozza.c).

            let hidden_layer = stm_acc.screlu().concat(ntm_acc.screlu());
            l1.forward(hidden_layer).select(output_buckets)
        });

    // Defaults are decay 0.01, betas 0.9/0.999 and weight clipping to [-1.98, 1.98],
    // which keeps every weight inside i16 at QA = 255. Change them here if needed.
    trainer.optimiser.set_params(AdamWParams::default());

    let schedule = TrainingSchedule {
        net_id: NET_ID.to_string(),
        eval_scale: SCALE,
        steps: TrainingSteps {
            batch_size: BATCH_SIZE,
            batches_per_superbatch: BATCHES_PER_SB,
            start_superbatch: 1,
            end_superbatch: SB,
        },
        wdl_scheduler: wdl::ConstantWDL { value: WDL },
        lr_scheduler: lr::Warmup {
            inner: lr::CosineDecayLR { initial_lr: LR, final_lr: FINAL_LR, final_superbatch: SB },
            warmup_batches: WARMUP_BATCHES,
        },
        save_rate: SAVE_RATE,
    };

    let settings = LocalSettings {
        threads: THREADS,
        test_set: None,
        output_directory: OUTPUT_DIR,
        batch_queue_size: BATCH_QUEUE_SIZE,
    };

    // trainer.load_from_checkpoint(&format!("{OUTPUT_DIR}/{NET_ID}-100"));

    let data_loader =
        SfBinpackLoader::new_concat_multiple(&DATA_FILES, BINPACK_BUFFER_MB, BINPACK_THREADS, binpack_filter);

    trainer.run(&schedule, &settings, &data_loader);

    for fen in [
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    ] {
        // eval() wants a line of training data (fen | score | result) and returns the raw net
        // output for the side to move; * SCALE is centipawns, comparable with eval in lozza.js
        let cp = SCALE * trainer.eval(&format!("{fen} | 0 | 0.0"));
        println!("eval {fen} = {cp:.0}");
    }
}
