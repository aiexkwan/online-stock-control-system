const fs = require('fs');
const os = require('os');

const isWin = os.platform() === 'win32';
const src = isWin ? '.mcp.windows.json' : '.mcp.mac.json';

fs.copyFileSync(src, '.mcp.json');
console.log(`✅ Loaded config from ${src}`);
