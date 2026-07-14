import { spawn, execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT?.trim() || '4000';

function releasePort(portNum) {
  try {
    const output = execFileSync('lsof', ['-ti', `:${portNum}`], { encoding: 'utf8' }).trim();
    if (!output) {
      return;
    }

    for (const pid of output.split('\n').filter(Boolean)) {
      const numericPid = Number(pid);
      if (!numericPid || numericPid === process.pid) {
        continue;
      }

      try {
        process.kill(numericPid, 'SIGTERM');
      } catch {
        try {
          process.kill(numericPid, 'SIGKILL');
        } catch {
          // already gone
        }
      }
    }
  } catch {
    // port is free
  }
}

releasePort(port);
await new Promise((resolve) => setTimeout(resolve, 300));

const child = spawn(process.execPath, ['--watch', 'src/index.js'], {
  stdio: 'inherit',
  cwd: serverRoot,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
