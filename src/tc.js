function checkTime() {

    if (g_finishTime && now() >= g_finishTime)
      g_finished = 1;
    
    if (g_maxNodes && g_nodes >= g_maxNodes)
      g_finished = 1;
      
}

function initTimeControl(tokens) {

  // defaults

  g_nodes = 0;
  g_maxNodes = 0;
  g_maxDepth = MAX_PLY;
  g_startTime = now();
  g_finishTime = 0;
  g_finished = 0;

  // parse go params into a map

  const params = {};

  for (let i = 1; i < tokens.length; i++) {
    const key = tokens[i];
    if (key === 'infinite') {
      params.infinite = true;
    }
    else if (key === 'ponder') {
      params.ponder = true;
    }
    else if (i + 1 < tokens.length) {
      params[key] = parseInt(tokens[i + 1]);
      i++;
    }
  }

  // fixed depth

  if (params.depth) {
    g_maxDepth = params.depth;
    return;
  }
  if (params.d) {
    g_maxDepth = params.d;
    return;
  }

  // fixed nodes

  if (params.nodes) {
    g_maxNodes = params.nodes;
    return;
  }

  // fixed move time

  if (params.movetime) {
    g_finishTime = g_startTime + params.movetime;
    return;
  }

  // infinite or ponder - no limits

  if (params.infinite || params.ponder) {
    return;
  }

  // time + inc based

  const wtime = params.wtime || 0;
  const btime = params.btime || 0;
  const winc = params.winc || 0;
  const binc = params.binc || 0;
  const movestogo = Math.max(params.movestogo || 20, 2);

  const myTime = g_stm === WHITE ? wtime : btime;
  const myInc = g_stm === WHITE ? winc : binc;

  const alloc = myTime / movestogo + myInc;

  // don't use more than half the remaining time

  const limit = myTime / 2;

  const ms = Math.max(Math.min(alloc, limit), 1);

  g_finishTime = g_startTime + ms;

}
