const OUTPUT_DIR: &str = "/home/xyzzy/lozza/nets/gen7_256";
const SB: usize = 200;
const L1: usize = 256;
const WDL: f32 = 0.4;
const SCALE: i32 = 400;
const QA: i16 = 255;
const QB: i16 = 64;

const DATA_FILES: [&str; 1] = [
    "/home/xyzzy/lozza/data/gen7.vf",
];

// (768 -> L1)x2 -> 1, squared relu, trained from viriformat data written by
// lozza's datagen. the saved net is l0w, l0b, l1w, l1b as little endian i16,
// the layout netLoad reads.

use bullet_lib::{
    game::inputs::Chess768,
    nn::optimiser::AdamW,
    trainer::{
        save::SavedFormat,
        schedule::{lr, wdl, TrainingSchedule, TrainingSteps},
        settings::LocalSettings,
    },
    value::{
        loader::viribinpack::{Filter, ViriBinpackLoader, ViriFilter},
        ValueTrainerBuilder,
    },
};

fn main() {

    // AdamW's default params clip weights to [-1.98, 1.98], so every quantised
    // weight fits in i16 with room to spare

    let mut trainer = ValueTrainerBuilder::default()
        .dual_perspective()
        .optimiser(AdamW)
        .inputs(Chess768)
        .save_format(&[
            SavedFormat::id("l0w").round().quantise::<i16>(QA),
            SavedFormat::id("l0b").round().quantise::<i16>(QA),
            SavedFormat::id("l1w").round().quantise::<i16>(QB),
            SavedFormat::id("l1b").round().quantise::<i16>(QA * QB),
        ])
        .loss_fn(|output, target| output.sigmoid().squared_error(target))
        .build(|builder, stm_inputs, ntm_inputs| {
            let l0 = builder.new_affine("l0", 768, L1);
            let l1 = builder.new_affine("l1", 2 * L1, 1);

            let stm_hidden = l0.forward(stm_inputs).sqrrelu();
            let ntm_hidden = l0.forward(ntm_inputs).sqrrelu();

            l1.forward(stm_hidden.concat(ntm_hidden))
        });

    let schedule = TrainingSchedule {
        net_id: "lozza".to_string(),
        eval_scale: SCALE as f32,
        steps: TrainingSteps {
            batch_size: 16_384,
            batches_per_superbatch: 6104,
            start_superbatch: 1,
            end_superbatch: SB,
        },
        wdl_scheduler: wdl::ConstantWDL { value: WDL },
        //wdl_scheduler: wdl::LinearWDL { start: 0.0, end: WDL },
        //lr_scheduler: lr::StepLR {
        //    start: 0.001,
        //    gamma: 0.3,
        //    step: 300,
        //},
        lr_scheduler: lr::Warmup {
            inner: lr::CosineDecayLR {
                initial_lr: 0.001,
                final_lr: 0.001 * f32::powi(0.3, 5),
                final_superbatch: SB,
            },
            warmup_batches: 200,
        },
        save_rate: SB,
    };

    let settings = LocalSettings {
        threads: 4,
        test_set: None,
        output_directory: OUTPUT_DIR,
        batch_queue_size: 64,
    };

    // the default filter skips the opening (ply < 16), positions in check,
    // tactical moves and positions with fewer than 4 pieces. max_eval is set
    // below lozza's mate scores (MINMATE 30000); the default 31339 lets them
    // through

    let filter = Filter {
        max_eval: 30000,
        ..Filter::default()
    };

    let data_loader = ViriBinpackLoader::new_concat_multiple(&DATA_FILES, 1024, 4, ViriFilter::Builtin(filter));

    trainer.run(&schedule, &settings, &data_loader);
}
