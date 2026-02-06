initNodes();

const nodeHost = typeof process !== 'undefined' && process.versions?.node;

let feedBuf = '';

function feed(chunk) {
  if (chunk === null || chunk === undefined) {
    return;
  }

  feedBuf += String(chunk);

  while (true) {
    const nl = feedBuf.indexOf('\n');
    if (nl < 0) {
      break;
    }

    let line = feedBuf.slice(0, nl);
    feedBuf = feedBuf.slice(nl + 1);

    // strip optional CR for Windows CRLF
    if (line.length && line.charCodeAt(line.length - 1) === 13) {
      line = line.slice(0, -1);
    }

    uciExecLine(line);
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
