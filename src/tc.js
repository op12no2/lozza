class TimeControl {

  constructor() {
    this.bestMove = 0;
    this.nodes = 0;
  }
}

const timeControl = new TimeControl();

function tcClear() {
  const tc = timeControl;
  tc.bestMove = 0;
  tc.nodes = 0;
}
