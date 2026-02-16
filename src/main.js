if (nodeHost && process.argv.length > 2) {
  for (let i=2; i < process.argv.length; i++)
    uciExec(process.argv[i]);
  process.exit(0);
}

if (nodeHost) {

  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', function() {
    const chunk = process.stdin.read();
    process.stdin.resume();
    if (chunk !== null) {
      uciExec(chunk);
    }
  });

  process.stdin.on('end', function() {
    process.exit();
  });

}

