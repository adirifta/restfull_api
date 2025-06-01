const https = require('https');
const fs = require('fs');
const app = require('./index');

// Baca file sertifikat
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

// Buat server HTTPS
const PORT = 3000;
https.createServer(options, app).listen(PORT, () => {
  console.log(`Server HTTPS berjalan di https://localhost:${PORT}`);
});