/** @type {import('pm2').StartOptions[]} */
export default {
  apps: [
    {
      name: "discord-bot",
      script: "dist/index.js",
      cwd: "./",
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/pm2-bot-error.log",
      out_file: "logs/pm2-bot-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
