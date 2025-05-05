const createDatabase = require('./createDatabase');
const createUsersTable = require('./createUsersTable');
const createArticlesTable = require('./createArticlesTable');
const createCommentsTable = require('./createCommentsTable');

const runMigrations = async () => {
  try {
    await createDatabase();
    await createUsersTable();
    await createArticlesTable();
    await createCommentsTable();
    
    console.log('Semua migrasi berhasil dijalankan');
    process.exit(0);
  } catch (error) {
    console.error('Error saat menjalankan migrasi:', error);
    process.exit(1);
  }
};

runMigrations();