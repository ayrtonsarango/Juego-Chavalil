const https = require('https');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '9056453513:AAGBqtx2C3B_W3A0xmw5JyFEv4Kxd2DGiO8';
const CHAT_ID = '6090029897';

function sendText(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      chat_id: CHAT_ID,
      text: text,
      parse_mode: 'HTML'
    });

    const req = https.request(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 8000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve(parsed);
        } catch (e) {
          resolve({ ok: false, raw });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Telegram request timed out after 8s'));
    });

    req.write(payload);
    req.end();
  });
}

function sendPhoto(filePath, caption = '') {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error('File not found: ' + filePath));
    }

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    let body = [];
    // chat_id field
    body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${CHAT_ID}\r\n`));
    // caption field
    if (caption) {
      body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`));
    }
    // photo file
    body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`));
    body.push(fileData);
    body.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const totalLength = body.reduce((acc, b) => acc + b.length, 0);

    const req = https.request(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalLength
      },
      timeout: 15000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          resolve({ ok: false, raw });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Photo upload timed out'));
    });

    body.forEach(b => req.write(b));
    req.end();
  });
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'text';
  const param = args.slice(1).join(' ');

  if (cmd === 'text') {
    sendText(param || 'Hola desde Juego Chavalil!')
      .then(res => { console.log('Telegram OK:', res.ok); process.exit(0); })
      .catch(err => { console.error('Telegram Error:', err.message); process.exit(1); });
  } else if (cmd === 'photo') {
    const photoPath = args[1];
    const caption = args.slice(2).join(' ') || '';
    sendPhoto(photoPath, caption)
      .then(res => { console.log('Telegram OK:', res.ok); process.exit(0); })
      .catch(err => { console.error('Telegram Error:', err.message); process.exit(1); });
  }
}

module.exports = { sendText, sendPhoto };
