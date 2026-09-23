const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const defaultDbPath = path.resolve(__dirname, '..', 'data', 'newspulse.db');
const dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

function getDb() {
  return new DatabaseSync(dbPath);
}

module.exports = {
  getDb,
  dbPath
};
