
if (!nodeHost) {
  onmessage = function(e) {
    uciQueue(e.data);
  }
}

if (nodeHost && process.argv.length > 2) {
  for (let i=2; i < process.argv.length; i++)
    uciExec(process.argv[i]);
}

// stdio

if (nodeHost) {

  process.stdin.setEncoding('utf8');

  let stdinBuf = '';  // partial line carried over between chunks

  process.stdin.on('readable', function() {
    const chunk = process.stdin.read();
    process.stdin.resume();
    if (chunk !== null) {
      stdinBuf += chunk;
      const nl = stdinBuf.lastIndexOf('\n');
      if (nl >= 0) {
        uciQueue(stdinBuf.slice(0, nl));
        stdinBuf = stdinBuf.slice(nl + 1);
      }
    }
  });

  process.stdin.on('end', function() {
    // let any queued commands (inc. a running search) finish first
    stdinEnded = 1;
    if (stdinBuf)
      uciQueue(stdinBuf);
    if (!cmdBusy)
      process.exit();
  });

}
