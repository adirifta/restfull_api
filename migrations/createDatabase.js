const mysql = require('mysql2/promise');

const createDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS db_resfullapi')
    console.log('Database resfullapi berhasil dibuat');
    await connection.end();
  } catch (error) {
    console.error('Gagal membuat database:', error);
    throw error;
  }
};

module.exports = createDatabase;