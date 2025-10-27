const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
 const paypalRoutes = require('./paypalRoutes');

 

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`);

  // Gallery table with BLOB storage
  db.run(`CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    filename TEXT,
    imageData BLOB,
    mimeType TEXT,
    url TEXT,
    title TEXT,
    description TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);
});

// Middleware
app.use(cors());
app.use(express.json());


const usdcRoutes = require('./routes/usdc');
app.use('/api/usdc', usdcRoutes);

// Multer setup - MEMORY storage (not disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============================================
// AUTH TOKEN MIDDLEWARE
// ============================================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }
  
  // Simple token verification - in production use JWT
  // For now, we'll just check if token exists in format "user_id"
  try {
    // Decode the token (it's just the user ID encoded as base64)
    const userId = Buffer.from(token, 'base64').toString('utf-8');
    req.userId = userId;
    next();
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

// Test route
app.get('/', (req, res) => res.send('Server running with SQLite + BLOB storage'));


// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (row) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const userId = Date.now().toString();
      const createdAt = new Date().toISOString();
      const token = Buffer.from(userId).toString('base64');

      db.run('INSERT INTO users (id, name, email, password, createdAt) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, hashed, createdAt], function(err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
          }

          res.status(201).json({
            status: 'ok',
            message: 'User registered',
            token,
            user: { id: userId, name, email, createdAt }
          });
        });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const { password: _, ...userSafe } = user;
    const token = Buffer.from(user.id).toString('base64');

    res.json({
      status: 'ok',
      token,
      user: userSafe
    });
  });
});

// Verify token and get user info
app.get('/api/auth/verify', verifyToken, (req, res) => {
  db.get('SELECT id, name, email, createdAt FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    res.json({
      status: 'ok',
      user
    });
  });
});

// Logout
app.post('/api/auth/logout', verifyToken, (req, res) => {
  // Token-based auth doesn't require server-side logout, but we can still respond
  res.json({ 
    status: 'ok', 
    message: 'Logged out successfully' 
  });
});

// ============================================
// GALLERY ROUTES
// ============================================

// Upload gallery art (BLOB storage)
app.post('/api/gallery/upload', upload.single('art'), (req, res) => {
  console.log('=== UPLOAD DEBUG ===');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);

  const { email, url, title, description } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }

  // Get the user
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('User lookup error:', err);
      return res.status(500).json({ status: 'error', message: 'User lookup error' });
    }

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    console.log('Found user ID:', user.id);
    const createdAt = new Date().toISOString();

    // Handle file upload - STORE AS BLOB
    if (req.file) {
      console.log('Processing file upload as BLOB...');

      const imageData = req.file.buffer;
      const mimeType = req.file.mimetype;
      const filename = req.file.originalname;

      console.log('File data:', {
        filename: filename,
        mimeType: mimeType,
        size: imageData.length,
        title: title || 'Untitled',
        description: description || ''
      });

      db.run(
        'INSERT INTO gallery (userId, type, filename, imageData, mimeType, title, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, 'file', filename, imageData, mimeType, title || 'Untitled', description || '', createdAt],
        function(err) {
          if (err) {
            console.error('Database INSERT error:', err);
            return res.status(500).json({ status: 'error', message: 'Database insert failed', error: err.message });
          }

          console.log('BLOB insert successful, ID:', this.lastID);
          res.json({
            status: 'ok',
            message: 'File uploaded successfully',
            art: {
              id: this.lastID,
              type: 'file',
              filename: filename,
              mimeType: mimeType,
              title: title || 'Untitled',
              description: description || ''
            }
          });
        }
      );
      return;
    }

    // Handle URL upload
    if (url) {
      console.log('Processing URL upload...');

      db.run(
        'INSERT INTO gallery (userId, type, url, title, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, 'url', url, title || 'Untitled', description || '', createdAt],
        function(err) {
          if (err) {
            console.error('Database INSERT error:', err);
            return res.status(500).json({ status: 'error', message: 'Database insert failed', error: err.message });
          }

          console.log('URL insert successful, ID:', this.lastID);
          res.json({
            status: 'ok',
            message: 'URL added successfully',
            art: {
              id: this.lastID,
              type: 'url',
              url,
              title: title || 'Untitled',
              description: description || ''
            }
          });
        }
      );
      return;
    }

    console.log('No file or URL found in request');
    res.status(400).json({ status: 'error', message: 'No file or URL provided' });
  });
});

// Serve image from database BLOB
app.get('/api/gallery/image/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT imageData, mimeType, filename FROM gallery WHERE id = ? AND type = ?',
    [id, 'file'], (err, row) => {
      if (err) {
        console.error('Error fetching image:', err);
        return res.status(500).json({ status: 'error', message: 'Server error' });
      }

      if (!row || !row.imageData) {
        return res.status(404).json({ status: 'error', message: 'Image not found' });
      }

      // Send binary data with proper content type
      res.setHeader('Content-Type', row.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${row.filename}"`);
      res.send(row.imageData);
    });
});

// Get all uploads from all users
app.get('/api/gallery/all', (req, res) => {
  const query = `
    SELECT
      g.id,
      g.userId,
      g.type,
      g.filename,
      g.mimeType,
      g.url,
      g.title,
      g.description,
      g.createdAt,
      u.name as userName,
      u.email as userEmail
    FROM gallery g
    JOIN users u ON g.userId = u.id
    ORDER BY g.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }

    const uploads = rows.map(row => ({
      ...row,
      imageUrl: row.type === 'file' ? `/api/gallery/image/${row.id}` : row.url
    }));

    res.json({ status: 'ok', uploads, count: uploads.length });
  });
});

// Get user gallery
app.get('/api/gallery/:email', (req, res) => {
  const query = `
    SELECT
      g.id,
      g.type,
      g.filename,
      g.mimeType,
      g.url,
      g.title,
      g.description,
      g.createdAt
    FROM gallery g
    JOIN users u ON g.userId = u.id
    WHERE u.email = ?
    ORDER BY g.createdAt DESC
  `;

  db.all(query, [req.params.email], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }

    if (rows.length === 0) {
      db.get('SELECT email FROM users WHERE email = ?', [req.params.email], (err, user) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ status: 'error', message: 'Server error' });
        }

        if (!user) {
          return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.json({ status: 'ok', gallery: [] });
      });
      return;
    }

    const gallery = rows.map(row => ({
      ...row,
      imageUrl: row.type === 'file' ? `/api/gallery/image/${row.id}` : row.url
    }));

    res.json({ status: 'ok', gallery });
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, email, createdAt FROM users', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.json({ users: rows });
  });
});

// ============================================
// STRIPE & PAYPAL SETUP (keeping existing code)
// ============================================

require('dotenv').config();
console.log('STRIPE_SECRET_KEY loaded:', process.env.STRIPE_SECRET_KEY ? 'YES' : 'NO');
console.log('STRIPE PUBLISHED KEY??', process.env.STRIPE_PUBLISHABLE_KEY? 'YES':'NO');
console.log('Key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 20));
console.log('Key starts with:', process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 20));

const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Use PayPal routes instead of inline setup
app.use('/api/paypal', paypalRoutes);

// Create Payment Intent
// app.post('/api/stripe/create-payment-intent', async (req, res) => {
//   try {
//     const { amount, currency = 'usd', buyerWallet } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ error: 'Invalid amount' });
//     }

//     if (!buyerWallet) {
//       return res.status(400).json({ error: 'Wallet address required' });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(amount * 100),
//       currency,
//       automatic_payment_methods: {
//         enabled: true,
//       },
//       metadata: {
//         buyerWallet: buyerWallet,
//       },
//     });

//     res.json({
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id
//     });
//   } catch (error) {
//     console.error('Stripe Error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Confirm Payment
// app.post('/api/stripe/confirm-payment', async (req, res) => {
//   try {
//     const { paymentIntentId } = req.body;
//     console.log('Confirm payment called with:', paymentIntentId);

//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
//     console.log('Payment intent status:', paymentIntent.status);

//     let usdAmount = 0;
//     let tokensToSend = 0;
//     let buyerWallet = null;

//     if (paymentIntent.status === 'succeeded') {
//         console.log('Full payment intent:', JSON.stringify(paymentIntent, null, 2));
//   console.log('Metadata:', paymentIntent.metadata);



//       usdAmount = paymentIntent.amount / 100;
//       tokensToSend = Math.floor(usdAmount / 0.015);
//       buyerWallet = paymentIntent.metadata?.buyerWallet;
//         console.log('Extracted buyerWallet:', buyerWallet);


//       console.log('Transfer params:', { usdAmount, tokensToSend, buyerWallet });


//   console.log('Transfer params:', { usdAmount, tokensToSend, buyerWallet });
//   console.log('buyerWallet value:', buyerWallet);
//   console.log('buyerWallet is truthy?', !!buyerWallet);
//   console.log('tokensToSend value:', tokensToSend);
//   console.log('tokensToSend > 0?', tokensToSend > 0);

//       if (buyerWallet && tokensToSend > 0) {
//         console.log('Calling transferTokens...');
//         try {
//           await transferTokens(buyerWallet, tokensToSend);
//           console.log(`SUCCESS: Sent ${tokensToSend} tokens to ${buyerWallet}`);
//         } catch (error) {
//           console.error('FAILED: Token transfer error:', error.message);
//           throw error;
//         }
//       }
//     }

//     res.json({
//       status: paymentIntent.status,
//       amount: usdAmount,
//       currency: paymentIntent.currency
//     });
//   } catch (error) {
//     console.error('Stripe Error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Debug endpoint for testing token transfers
// app.post('/api/debug/transfer-tokens', async (req, res) => {
//   try {
//     const { wallet, amount } = req.body;
//     console.log('DEBUG: Attempting transfer to', wallet, 'amount:', amount);
//     await transferTokens(wallet, amount);
//     res.json({ success: true, message: 'Transfer attempted' });
//   } catch (error) {
//     console.error('DEBUG: Transfer failed:', error.message);
//     res.json({ success: false, error: error.message });
//   }
// });

// // Graceful shutdown
// process.on('SIGINT', () => {
//   // ...rest of shutdown code
// });

// // Webhook handler for Stripe events
// app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error('Webhook signature verification failed:', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   switch (event.type) {
//     case 'payment_intent.succeeded':
//       const paymentIntent = event.data.object;
//       console.log('PaymentIntent succeeded:', paymentIntent.id);
//       break;
//     case 'payment_intent.payment_failed':
//       const failedPayment = event.data.object;
//       console.log('Payment failed:', failedPayment.id);
//       break;
//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }

//   res.json({ received: true });
// });
 

// Add this to your server.js

// CREATE PAYMENT INTENT
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { amount, buyerWallet } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!buyerWallet) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    console.log('Creating payment intent for:', { amount, buyerWallet });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { buyerWallet: buyerWallet }
    });

    console.log('Payment intent created:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// CONFIRM PAYMENT AND TRANSFER TOKENS
app.post('/api/stripe/confirm-payment', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    console.log('Confirming payment:', paymentIntentId);

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('Payment intent retrieved. Status:', paymentIntent.status);
    console.log('Payment metadata:', paymentIntent.metadata);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not succeeded' });
    }

    // Get wallet from metadata
    const buyerWallet = paymentIntent.metadata?.buyerWallet;

    if (!buyerWallet) {
      console.error('No buyerWallet in metadata');
      return res.status(400).json({ error: 'Wallet address not found in payment' });
    }

    // Calculate tokens
    const usdAmount = paymentIntent.amount / 100;
    const tokensToSend = Math.floor(usdAmount / 0.015);

    console.log('Transferring tokens:', { buyerWallet, tokensToSend, usdAmount });

    // Transfer tokens
    try {
      await transferTokens(buyerWallet, tokensToSend);
      console.log('Tokens transferred successfully');
    } catch (transferError) {
      console.error('Token transfer failed:', transferError.message);
      throw new Error('Token transfer failed: ' + transferError.message);
    }

    res.json({
      status: 'succeeded',
      amount: usdAmount,
      tokens: tokensToSend,
      wallet: buyerWallet
    });

  } catch (error) {
    console.error('Confirm payment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));


module.exports = app;