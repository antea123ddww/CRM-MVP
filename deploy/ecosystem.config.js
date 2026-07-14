module.exports = {
  apps: [
    {
      name: "crm-backend",
      cwd: "../backend",
      script: "dist/src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
    {
      name: "crm-frontend",
      cwd: "../frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
