const { spawn } = require('child_process');
const path = require('path');

function startService(name, dir, command, args) {
  console.log(`[MONITOR] Starting service ${name}...`);
  
  const child = spawn(command, args, {
    cwd: path.resolve(__dirname, dir),
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`[${name}] ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`[${name} ERROR] ${line}`);
      }
    });
  });

  child.on('close', (code) => {
    console.warn(`[MONITOR] Service ${name} exited with code ${code}. Restarting in 3 seconds...`);
    setTimeout(() => {
      startService(name, dir, command, args);
    }, 3000);
  });

  return child;
}

// Start backend server
startService('BACKEND', 'backend', 'npm', ['run', 'dev']);

// Start frontend server
startService('FRONTEND', 'civicai', 'npm', ['run', 'dev']);
