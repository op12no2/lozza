//
// Lozza bullet net (768 -> 128)x2 -> 1 sqrrelu
//

const OUTPUT_DIR: &str = "/home/xyzzy/lozza/nets/bumpy";
const DATA_FILES: [&str; 2] = [
  "/home/xyzzy/lozza/data/gen4.bullet",
  "/home/xyzzy/lozza/data/gen5.bullet",
];

use bullet_lib::{
    nn::{
        optimiser,
        Activation,
    },
    trainer::{
        default::{
          inputs,
          loader,
          outputs,
          Loss,
          TrainerBuilder,
        },
        schedule::{
          lr,
          wdl,
          TrainingSchedule,
          TrainingSteps,
        },
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
        .feature_transformer(128)
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
        wdl_scheduler: wdl::ConstantWDL {
            value: 0.4
        },
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

    let data_loader = loader::DirectSequentialDataLoader::new(&DATA_FILES);

    trainer.run(&schedule, &settings, &data_loader);
}

