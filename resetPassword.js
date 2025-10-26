const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Open the database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

// Function to reset password
async function resetPassword(email, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], function(err) {
      if (err) {
        console.error('Error updating password:', err);
        return;
      }

      if (this.changes > 0) {
        console.log(`Password reset successfully for ${email}`);
        console.log(`New password: ${newPassword}`);
      } else {
        console.log(`No user found with email: ${email}`);
      }

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
  }
}

// Usage: node resetPassword.js <email> <newPassword>
// Example: node resetPassword.js test@example.com password123

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node resetPassword.js <email> <newPassword>');
  console.log('Example: node resetPassword.js test@example.com password123');
  process.exit(1);
}

const [email, newPassword] = args;
resetPassword(email, newPassword);