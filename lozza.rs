
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

const DIR: &str = "/home/xyzzy/lozza/data/h128_sqrrelu_s100_l5";

const HIDDEN_SIZE: usize = 128;

const SCALE: i32 = 100;

const QA: i16 = 255;
const QB: i16 = 64;

fn main() {
    let mut trainer = TrainerBuilder::default()
        .quantisations(&[QA, QB])
        .optimiser(optimiser::AdamW)
        .loss_fn(Loss::SigmoidMSE)
        .input(inputs::Chess768)
        .output_buckets(outputs::Single)
        .feature_transformer(HIDDEN_SIZE)
        .activate(Activation::SqrReLU)
        .add_layer(1)
        .build();

    let schedule = TrainingSchedule {
        net_id: "lozza".to_string(),
        eval_scale: SCALE as f32,
        steps: TrainingSteps {
            batch_size: 16_384,
            batches_per_superbatch: 6104,
            start_superbatch: 1,
            end_superbatch: 1000,
        },
        wdl_scheduler: wdl::ConstantWDL { value: 0.5 },
        lr_scheduler: lr::StepLR { start: 0.001, gamma: 0.1, step: 8 },
        save_rate: 10,
    };

    trainer.set_optimiser_params(optimiser::AdamWParams::default());

    let settings    = LocalSettings { threads: 4, test_set: None, output_directory: DIR, batch_queue_size: 64 };
    let data_loader = loader::DirectSequentialDataLoader::new(&["/home/xyzzy/lozza/data/bullet.data"]);

    trainer.run(&schedule, &settings, &data_loader);
}

