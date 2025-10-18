const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

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

// Multer setup - MEMORY storage (not disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Test route
app.get('/', (req, res) => res.send('Server running with SQLite + BLOB storage'));

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

      db.run('INSERT INTO users (id, name, email, password, createdAt) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, hashed, createdAt], function(err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
          }
          
          res.status(201).json({
            message: 'User registered',
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
    res.json({ status: 'ok', user: userSafe });
  });
});

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








// Install dependencies:
// npm install express stripe @paypal/checkout-server-sdk cors dotenv

 
require('dotenv').config();
console.log('STRIPE_SECRET_KEY loaded:', process.env.STRIPE_SECRET_KEY ? 'YES' : 'NO');
console.log('STRIPE PUBLISHED KEY??', process.env.STRIPE_PUBLISHABLE_KEY? 'YES':'NO');
console.log('Key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 20)); 


 console.log('Key starts with:', process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 20)); 

 const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');

 app.use(cors());
app.use(express.json());

// ============================================
// PayPal Configuration
// ============================================
function paypalClient() {
  const environment = process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      );
  
  return new paypal.core.PayPalHttpClient(environment);
}

// ============================================
// STRIPE ENDPOINTS
// ============================================

// Create Payment Intent
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm Payment
app.post('/api/stripe/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler for Stripe events
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      // Update your database, send confirmation email, etc.
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// ============================================
// PAYPAL ENDPOINTS
// ============================================

// Create PayPal Order
// app.post('/api/paypal/create-order', async (req, res) => {
//   try {
//     const { amount, currency = 'USD' } = req.body;

//     // Validate amount
//     if (!amount || amount <= 0) {
//       return res.status(400).json({ error: 'Invalid amount' });
//     }

//     const request = new paypal.orders.OrdersCreateRequest();
//     request.prefer('return=representation');
//     request.requestBody({
//       intent: 'CAPTURE',
//       purchase_units: [{
//         amount: {
//           currency_code: currency,
//           value: amount.toFixed(2)
//         }
//       }]
//     });

//     const order = await paypalClient().execute(request);

//     res.json({
//       orderId: order.result.id
//     });
//   } catch (error) {
//     console.error('PayPal Error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Capture PayPal Payment
// app.post('/api/paypal/capture-order', async (req, res) => {
//   try {
//     const { orderId } = req.body;

//     const request = new paypal.orders.OrdersCaptureRequest(orderId);
//     request.requestBody({});

//     const capture = await paypalClient().execute(request);

//     res.json({
//       status: capture.result.status,
//       orderId: capture.result.id,
//       payerId: capture.result.payer.payer_id,
//       amount: capture.result.purchase_units[0].payments.captures[0].amount
//     });
//   } catch (error) {
//     console.error('PayPal Capture Error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get PayPal Order Details
// app.get('/api/paypal/order/:orderId', async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const request = new paypal.orders.OrdersGetRequest(orderId);
//     const order = await paypalClient().execute(request);

//     res.json(order.result);
//   } catch (error) {
//     console.error('PayPal Error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// ============================================
// SERVER
// ============================================

 app.listen(PORT, () => {
  console.log(`Payment API server running on port ${PORT}`);
});

 
 

// Export for Railway
module.exports = app;

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));