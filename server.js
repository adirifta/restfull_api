const https = require('https');
const fs = require('fs');
const app = require('./index');
const PORT = process.env.PORT || 3000;

// // Baca file sertifikat
// const options = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem'),
// };

// // Buat server HTTPS
// https.createServer(options, app).listen(PORT, () => {
//   console.log(`Server HTTPS berjalan di https://localhost:${PORT}`);
// });

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});