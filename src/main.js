initNodes();

const nodeHost = typeof process !== 'undefined' && process.versions?.node;

let feedBuf = '';

function feed(chunk) {
  feedBuf += String(chunk);

  const lines = feedBuf.split('\n');

  feedBuf = lines.pop();

  for (const raw of lines) {
    uciExecLine(raw.trimEnd());
  }
}

if (!nodeHost) {
  onmessage = function(e) {
    feed(e.data);
  };
}
else {
  if (process.argv.length > 2) {
    for (let i = 2; i < process.argv.length; i++) {
      uciExecLine(process.argv[i]);
    }
    process.exit(0);
  }

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function(chunk) {
    feed(chunk);
  });

  process.stdin.on('end', function() {
    process.exit(0);
  });
}
