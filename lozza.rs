//
// Lozza bullet net(768 -> h1_size)x2 -> 1
//

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

fn activation_to_string(activation: &Activation) -> &'static str {
    match activation {
        Activation::ReLU     => "relu",
        Activation::CReLU    => "crelu",
        Activation::SCReLU   => "screlu",
        Activation::SqrReLU  => "sqrrelu",
        Activation::Sigmoid  => "sigmoid",
        Activation::Identity => "identity",
    }
}

fn main() {

    // start config

    let prefix: &str             = "gen5";
    let id: &str                 = "lozza";
    let output_dir_root: &str    = "/home/xyzzy/lozza/data";
    let data_files               = ["/home/xyzzy/lozza/data/gen4.bullet"];
    let h1_size: usize           = 128;
    let activation_func          = Activation::SqrReLU;
    let scale: i16               = 100;
    let lerp: f32                = 0.5;
    let qa: i16                  = 255;
    let qb: i16                  = 64;
    let batch_size: usize        = 16_384;
    let batches_per_super: usize = 6104;
    let num_supers: usize        = 200;
    let save_rate: usize         = 5;
    let lr_start: f32            = 0.001;
    let lr_gamma: f32            = 0.1;
    let lr_step: usize           = 8;
    let threads: usize           = 4;
    let batch_queue_size: usize  = 64;

    // end config

    let acti = activation_to_string(&activation_func);
    let output_dir = format!("{}/{}_h{}_{}_s{}_l{}", output_dir_root, prefix, h1_size, acti, scale, (lerp * 100.0) as i16);

    println!();
    println!("Activation             : {}", acti);

    let mut trainer = TrainerBuilder::default()
        .quantisations(&[qa, qb])
        .optimiser(optimiser::AdamW)
        .loss_fn(Loss::SigmoidMSE)
        .input(inputs::Chess768)
        .output_buckets(outputs::Single)
        .feature_transformer(h1_size)
        .activate(activation_func)
        .add_layer(1)
        .build();

    let schedule = TrainingSchedule {
        net_id: id.to_string(),
        eval_scale: scale as f32,
        steps: TrainingSteps {
            batch_size: batch_size,
            batches_per_superbatch: batches_per_super,
            start_superbatch: 1,
            end_superbatch: num_supers,
        },
        wdl_scheduler: wdl::ConstantWDL {
            value: lerp
        },
        lr_scheduler: lr::StepLR {
            start: lr_start,
            gamma: lr_gamma,
            step: lr_step,
        },
        save_rate: save_rate,
    };

    trainer.set_optimiser_params(optimiser::AdamWParams::default());

    let settings = LocalSettings {
        threads: threads,
        test_set: None,
        output_directory: &output_dir,
        batch_queue_size: batch_queue_size,
    };

    let data_loader = loader::DirectSequentialDataLoader::new(&data_files);

    trainer.run(&schedule, &settings, &data_loader);
}

