module.exports = {
  apps: [{
    name: 'fintech-api',
    script: 'server.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 4050,
    },
  }],
};
