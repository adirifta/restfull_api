# 🚀 Express.js RESTful API with Best Practices

![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql)

Sebuah RESTful API yang dibangun dengan **Express.js** menggunakan praktik terbaik untuk keamanan, struktur kode, dan manajemen data.

---

## 🔥 Fitur Utama

- **🔐 Autentikasi JWT** dengan role-based access (admin/pembaca)
- **⚡ Rate Limiting** (100 requests/15 menit)
- **🔄 Transformers** untuk format respons konsisten
- **🔒 HTTPS/SSL Support** (enkripsi komunikasi)
- **📁 File Upload** (avatar dengan validasi)
- **✅ Validasi Input** menggunakan `express-validator`
- **🚨 Error Handling** terstruktur

---

## 🏗️ Struktur Proyek

```bash
src/
├── config/          # Konfigurasi DB, rate limiter
├── controllers/     # Logika bisnis
├── middleware/      # Auth, error handler
├── models/          # Model database (Sequelize opsional)
├── public/          # File upload (avatars)
├── routes/          # Endpoint API
├── services/        # Internal API calls
├── transformers/    # Format respons
├── validators/      # Validasi request
├── app.js           # Aplikasi utama
└── server.js        # Entry point
```
---

## 🛠️ Instalasi

# 1. Clone repositori

```bash
git clone https://github.com/username/project.git
cd project
```

# 2. Instal dependencies

```bash
npm install
```


# 3. Setup environment
Buat file .env dan isi dengan:


```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=express_api
JWT_SECRET=rahasia_anda
PORT=3000
Jalankan server
```

# 4. Jalankan server

``` bash
node server.js
```








**Cara membuat Enkripsi (SSL/HTTPS) di local**

- Masukkan di CLI git bash 'openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "//CN=localhost"'
- Setelah berhasil generate, verifikasi dengan: 'openssl x509 -in cert.pem -text -noout'



**Run**

- nodemon server.js -