
const OUTPUT_DIR: &str = "/home/xyzzy/lozza/nets/teddy";

const DATA_FILES: [&str; 2] = [
    "/home/xyzzy/lozza/data/gen5.bullet",
    "/home/xyzzy/lozza/data/gen4.bullet",
];

use bullet_lib::{
    nn::{optimiser, Activation},
    trainer::{
        default::{
            formats::sfbinpack::{
                chess::{piecetype::PieceType, r#move::MoveType},
                TrainingDataEntry,
            },
            inputs, loader, outputs, Loss, TrainerBuilder,
        },
        schedule::{lr, wdl, TrainingSchedule, TrainingSteps},
        settings::LocalSettings,
    },
};

fn main() {

    let mut trainer = TrainerBuilder::default()
        .quantisations(&[255, 64])
        .optimiser(optimiser::RAdam)
        .loss_fn(Loss::SigmoidMSE)
        .input(inputs::Chess768)
        .output_buckets(outputs::Single)
        .feature_transformer(160)
        .activate(Activation::SqrReLU)
        .add_layer(1)
        .build();

    let schedule = TrainingSchedule {
        net_id: "lozza".to_string(),
        eval_scale: 400.0,
        steps: TrainingSteps {
            batch_size: 16_384,
            batches_per_superbatch: 6104,
            start_superbatch: 1,
            end_superbatch: 1000,
        },
        wdl_scheduler: wdl::ConstantWDL { value: 0.4 },
        lr_scheduler: lr::StepLR {
            start: 0.001,
            gamma: 0.3,
            step: 300,
        },
        save_rate: 1,
    };

    //trainer.set_optimiser_params(optimiser::AdamWParams::default());

    let settings = LocalSettings {
        threads: 4,
        test_set: None,
        output_directory: &OUTPUT_DIR,
        batch_queue_size: 64,
    };

    let _data_loader = {
        let file_path = "/home/xyzzy/lozza/data/leela.binpack";
        let buffer_size_mb = 1024;
        let threads = 4;
        fn filter(entry: &TrainingDataEntry) -> bool {
            entry.ply >= 16
                && !entry.pos.is_checked(entry.pos.side_to_move())
                && entry.score.unsigned_abs() <= 10000
                && entry.mv.mtype() == MoveType::Normal
                && entry.pos.piece_at(entry.mv.to()).piece_type() == PieceType::None
        }

        loader::SfBinpackLoader::new(file_path, buffer_size_mb, threads, filter)
    };

    let data_loader = loader::DirectSequentialDataLoader::new(&DATA_FILES);

    trainer.run(&schedule, &settings, &data_loader);
}
