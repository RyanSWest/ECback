const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

// Query all users
db.all('SELECT id, name, email, password, createdAt FROM users', [], (err, rows) => {
  if (err) {
    console.error('Error querying users:', err);
    return;
  }

  console.log('All users in database:');
  console.log('Total users:', rows.length);
  console.log('====================');

  rows.forEach((user, index) => {
    console.log(`${index + 1}. ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password (hashed): ${user.password}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('---');
  });

  // Close the database
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
});