const uciContext = (function() {
  if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    return 'worker';
  }
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  if (typeof window !== 'undefined') {
    return 'browser';
  }
  return 'unknown';
})();

function uciWrite(data) {
  switch (uciContext) {
    case 'worker':
      self.postMessage(data);
      break;
    case 'node':
    case 'bun':
      process.stdout.write(data + '\n');
      break;
    case 'deno':
      Deno.stdout.writeSync(new TextEncoder().encode(data + '\n'));
      break;
    default:
      console.log(data);
  }
}

function uciQuit() {
  switch (uciContext) {
    case 'worker':
      self.close();
      break;
    case 'node':
    case 'bun':
      process.exit(0);
      break;
    case 'deno':
      Deno.exit(0);
      break;
    default:
      break;
  }
}

function uciRead(callback) {
  switch (uciContext) {
    case 'worker':
      self.onmessage = function(e) {
        callback(e.data);
      };
      break;

    case 'node':
    case 'bun':
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });
      rl.on('line', function(line) {
        callback(line);
      });
      break;

    case 'deno':
      (async function() {
        const decoder = new TextDecoder();
        const reader = Deno.stdin.readable.getReader();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            callback(line);
          }
        }
      })();
      break;

    default:
      break;
  }
}

uciRead(function(data) {
  const cmd = data.trim().toLowerCase();
  if (cmd === 'quit' || cmd === 'q') {
    uciQuit();
  }
  else {
    execString(data);
  }
});
