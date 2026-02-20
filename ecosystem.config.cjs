module.exports = {
  apps: [
    {
      name: "speechcenter-bot",
      cwd: "./bot",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
      },
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
