const express = require('express');
const firebaseAdmin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-key.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

const db = firebaseAdmin.firestore();
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: 'firebase-key.json'
});
const bucketName = 'model-askbook';

// Function to download model from GCS
async function downloadModel(fileName) {
  const options = {
    destination: `./models/${fileName}`
  };

  // Download file
  await storage.bucket(bucketName).file(`model/${fileName}`).download(options);
  console.log(`Model ${fileName} downloaded to ./models/${fileName}`);
}

// User Registration
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await firebaseAdmin.auth().createUser({
      email: email,
      password: password,
    });
    res.status(201).send(userRecord);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await firebaseAdmin.auth().getUserByEmail(email);
    const customToken = await firebaseAdmin.auth().createCustomToken(userRecord.uid);
    res.status(200).send({ token: customToken });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Logout (this typically is handled client-side by simply deleting the token)
app.post('/logout', (req, res) => {
  // Since we are not managing sessions, just respond with success.
  res.status(200).send('Logged out successfully');
});

// Get Books with Filters
app.get('/books', async (req, res) => {
  const { age, rating, genre, author, title } = req.query;
  let query = db.collection('books');

  if (age) query = query.where('age', '==', age);
  if (rating) query = query.where('rating', '==', rating);
  if (genre) query = query.where('genre', '==', genre);
  if (author) query = query.where('author', '==', author);
  if (title) query = query.where('title', '==', title);

  try {
    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.status(404).send('No matching books found.');
    }

    const books = [];
    snapshot.forEach(doc => {
      books.push(doc.data());
    });

    res.status(200).send(books);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Get Book Details
app.get('/books/:id', async (req, res) => {
  const bookId = req.params.id;
  try {
    const bookRef = db.collection('books').doc(bookId);
    const doc = await bookRef.get();
    if (!doc.exists) {
      return res.status(404).send('Book not found');
    }
    res.status(200).send(doc.data());
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint to download model from Google Cloud Storage
app.get('/download-model/:modelName', async (req, res) => {
  const modelName = req.params.modelName;
  try {
    await downloadModel(modelName);
    res.status(200).send(`Model ${modelName} downloaded successfully`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Root endpoint to display welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the AskBook API!');
});

// Start Server
const PORT = process.env.PORT || 8080;  // Use the PORT environment variable
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
