const db = require('../config/db');

const createUsersTable = async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar VARCHAR(255),
        status ENUM('penulis', 'pembaca') NOT NULL DEFAULT 'pembaca',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log('Tabel users berhasil dibuat');
  } catch (error) {
    console.error('Gagal membuat tabel users:', error);
    throw error;
  }
};

module.exports = createUsersTable;