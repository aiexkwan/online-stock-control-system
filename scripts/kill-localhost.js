// scripts/kill-localhost.js
const { exec } = require("child_process");
const os = require("os");

const PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008]; // 加你常用的 port

const isWin = os.platform() === "win32";

function killPort(port) {
  return new Promise((resolve, reject) => {
    const cmd = isWin
      ? `for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /PID %a /F`
      : `lsof -i tcp:${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.log(`⚠️  No process found on port ${port}`);
        resolve();
      } else {
        console.log(`✅ Killed process on port ${port}`);
        resolve();
      }
    });
  });
}

(async () => {
  for (const port of PORTS) {
    await killPort(port);
  }
})();
