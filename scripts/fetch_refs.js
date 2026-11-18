const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode));
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(true); });
      stream.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Download list of public high-res party game UI screenshots
const urls = [
  {
    dest: 'design/refs/jackbox_controller_ui.png',
    url: 'https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/assets/preview.png'
  }
];

async function run() {
  for (const item of urls) {
    try {
      await download(item.url, item.dest);
      console.log('Downloaded', item.dest);
    } catch (e) {
      console.log('Skipped / fallback', item.dest, e.message);
    }
  }
}

run();
