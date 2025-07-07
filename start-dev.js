#!/usr/bin/env node

const { spawn } = require('child_process');

// Start the backend (Express server)
console.log('Starting Express server...');
const backend = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true
});

// Start the frontend (Vite dev server)
console.log('Starting Vite frontend...');
const frontend = spawn('npx', ['vite', '--port', '3000', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit();
});

// Handle child process errors
backend.on('error', (err) => {
  console.error('Backend error:', err);
});

frontend.on('error', (err) => {
  console.error('Frontend error:', err);
});

console.log('Development servers started!');
console.log('Backend: http://localhost:5000');
console.log('Frontend: http://localhost:3000');