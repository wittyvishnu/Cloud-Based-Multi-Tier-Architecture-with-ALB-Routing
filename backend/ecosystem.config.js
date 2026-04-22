module.exports = {
  apps: [
    {
      name: "api-server",
      script: "./src/server.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
    },
    {
      name: "profile-worker",
      script: "./src/workers/profileWorker.js",
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: "post-worker",
      script: "./src/workers/postWorker.js",
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: "notification-worker",
      script: "./src/workers/notificationWorker.js",
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};