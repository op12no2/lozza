
use bullet_lib::{
  nn::{optimiser, Activation},
  trainer::{
    default::{
      inputs, loader, outputs, Loss, TrainerBuilder,
    },
    schedule::{lr, wdl, TrainingSchedule, TrainingSteps},
    settings::LocalSettings,
  },
};

fn main() {

  let h1_size: usize = 128;
  let scale: i16     = 100;
  let lerp: f32      = 0.6;
  let supers: usize  = 100;
  let qa: i16        = 255;
  let qb: i16        = 64;
  let id: &str       = "lozza";
  let acti: &str     = "sqrrelu";  // not auto - edit below

  let dir = format!(
"/home/xyzzy/lozza/data/h{}_{}_s{}_l{}", h1_size, acti, scale, (lerp * 10.0) as i32);

  println!();
  println!("Activation             : {}", acti);

  let mut trainer = TrainerBuilder::default()
    .quantisations(&[qa, qb])
    .optimiser(optimiser::AdamW)
    .loss_fn(Loss::SigmoidMSE)
    .input(inputs::Chess768)
    .output_buckets(outputs::Single)
    .feature_transformer(h1_size)
    .activate(Activation::SqrReLU)
    .add_layer(1)
    .build();

  let schedule = TrainingSchedule {
    net_id: id.to_string(),
    eval_scale: scale as f32,
    steps: TrainingSteps {
      batch_size: 16_384,
      batches_per_superbatch: 6104,
      start_superbatch: 1,
      end_superbatch: supers,
    },
    wdl_scheduler: wdl::ConstantWDL { value: lerp },
    lr_scheduler: lr::StepLR {start: 0.001, gamma: 0.1, step: 8},
    save_rate: 5,
  };

  trainer.set_optimiser_params(optimiser::AdamWParams::default());

  let settings    = LocalSettings {threads: 4, test_set: None, output_directory: &dir, batch_queue_size: 64};
  let data_loader = loader::DirectSequentialDataLoader::new(&["/home/xyzzy/lozza/data/bullet.data"]);

  trainer.run(&schedule, &settings, &data_loader);
}

