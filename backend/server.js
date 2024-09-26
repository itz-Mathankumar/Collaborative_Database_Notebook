const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI; // Your MongoDB URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  notebooks: [{ id: String, title: String }] // Array of notebooks
});

const User = mongoose.model('User', userSchema);

// Register new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create and return a token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new notebook
app.post('/create-notebook', async (req, res) => {
  const { userId, title } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notebookId = new mongoose.Types.ObjectId().toString();
    user.notebooks.push({ id: notebookId, title });
    await user.save();
    res.status(201).json({ message: 'Notebook created', notebookId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user notebooks
app.get('/notebooks/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ notebooks: user.notebooks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





app.post('/execute-query', async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ output: 'Command is required', status: 'Fail' });
  }

  try {
    const db = mongoose.connection.db; // Get the native MongoDB driver db instance

    // Ensure the command starts with "db."
    if (!command.startsWith("db.")) {
      return res.status(400).json({ output: 'Invalid command format', status: 'Fail' });
    }

    // Extract the collection name and operation
    const commandParts = command.split('.');
    const collectionName = commandParts[1]; // Get the collection name
    const operation = commandParts.slice(2).join('.'); // Get the rest of the command

    let result;

    // Handle find operation
    if (operation.startsWith('find')) {
      const queryMatch = operation.match(/find\((.*?)\)/);
      const queryString = queryMatch ? queryMatch[1].trim() : '{}';

      let jsonQuery = {};
      try {
        // Ensure valid JSON format
        if (queryString === "") {
          jsonQuery = {}; // Return all documents if no filter
        } else {
          jsonQuery = JSON.parse(queryString.replace(/([a-zA-Z0-9_]+):/g, '"$1":')); // Convert to valid JSON
        }
      } catch (err) {
        return res.status(400).json({ output: 'Invalid query format', status: 'Fail' });
      }

      result = await db.collection(collectionName).find(jsonQuery).toArray(); // Execute find and convert to array

      return res.json({ output: result, status: 'Pass' });
    }

    return res.status(400).json({ output: 'Invalid command', status: 'Fail' });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ output: error.message, status: 'Fail' });
  }
});