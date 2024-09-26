const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

let db;

const connectToMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
    db = mongoose.connection.db;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Function to start the server
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Trying another port...`);
      setTimeout(() => {
        server.close();
        startServer(port + 1);
      }, 1000);
    } else {
      console.error('Server error:', error);
    }
  });
};

// Connect to MongoDB before starting the server
connectToMongoDB().then(() => {
  startServer(PORT);
});

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

// Helper function to safely parse JSON with potential ObjectId
const safeJSONParse = (str) => {
  return JSON.parse(str, (key, value) => {
    if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
      return new ObjectId(value);
    }
    return value;
  });
};

app.post('/execute-query', async (req, res) => {
  const { command } = req.body;

  if (!command) {
      return res.status(400).json({ output: 'Command is required', status: 'Fail' });
  }

  if (!db) {
      return res.status(500).json({ output: 'Database connection not established', status: 'Fail' });
  }

  try {
      const parts = command.split('.');
      const collectionName = parts[1];
      let operation = parts[2];
      const argsStringMatch = command.match(/\(([\s\S]*?)\)/);
      let args = [];

      const args1 = operation.split("(");
      operation = args1[0];
      
      // Check if the operation is valid
      const validOperations = [
          'find', 'findone', 'insertone', 'insertmany',
          'updateone', 'updatemany', 'deleteone', 'deletemany',
          'count', 'distinct', 'aggregate', 'drop',
          'createindex', 'dropindex'
      ];

      if (!validOperations.includes(operation.toLowerCase())) {
          return res.status(400).json({ output: 'Unsupported operation', status: 'Fail' });
      }

      console.log("Operation Name:", operation);
      
      // Extract the argument string if it exists
      if (argsStringMatch && argsStringMatch[1]) {
          // Get the argument string without parentheses
          const argsString = argsStringMatch[1].trim();
  
          try {
              // Use different parsing based on the operation
              switch (operation.toLowerCase()) {
                  case 'find':
                  case 'findone':
                  case 'deleteone':
                  case 'deletemany':
                  case 'updateone':
                  case 'updatemany':
                      // Expecting query object as first argument
                      const queryJson = argsString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(?=\s*:)/g, '$1"$2"')
                                                   .replace(/'/g, '"')
                                                   .replace(/(\$[a-zA-Z]+)/g, '"$1"');
                      args = [JSON.parse(queryJson)];
                      break;

                  case 'insertone':
                  case 'insertmany':
                  case 'createindex':
                  case 'dropindex':
                      // Expecting a document or documents array
                      const docsJson = argsString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(?=\s*:)/g, '$1"$2"')
                                                   .replace(/'/g, '"');
                      args = [JSON.parse(docsJson)];
                      break;

                  case 'aggregate':
                      // For aggregation, we may expect an array of stages
                      const stagesJson = argsString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(?=\s*:)/g, '$1"$2"')
                                                    .replace(/'/g, '"');
                      args = [JSON.parse(stagesJson)];
                      break;

                  case 'count':
                  case 'distinct':
                      // Might require a query object
                      const countDistinctJson = argsString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(?=\s*:)/g, '$1"$2"')
                                                           .replace(/'/g, '"')
                                                           .replace(/(\$[a-zA-Z]+)/g, '"$1"');
                      args = [JSON.parse(countDistinctJson)];
                      break;

                  case 'drop':
                      // No arguments needed for drop
                      args = [];
                      break;

                  default:
                      throw new Error('Unsupported operation');
              }

              console.log("Parsed Arguments:", args);
              
          } catch (err) {
              console.error("Parsing error:", err);
              return res.status(400).json({ output: 'Invalid arguments format: ' + err.message, status: 'Fail' });
          }
      }

      const collection = db.collection(collectionName);
      let result;

      // Execute the corresponding operation
      switch (operation.toLowerCase()) {
          case 'find':
              result = await collection.find(...args).toArray();
              break;
          case 'findone':
              result = await collection.findOne(...args);
              break;
          case 'insertone':
              result = await collection.insertOne(...args);
              break;
          case 'insertmany':
              result = await collection.insertMany(...args);
              break;
          case 'updateone':
              result = await collection.updateOne(...args);
              break;
          case 'updatemany':
              result = await collection.updateMany(...args);
              break;
          case 'deleteone':
              result = await collection.deleteOne(...args);
              break;
          case 'deletemany':
              result = await collection.deleteMany(...args);
              break;
          case 'count':
              result = await collection.countDocuments(...args);
              break;
          case 'distinct':
              result = await collection.distinct(...args);
              break;
          case 'aggregate':
              result = await collection.aggregate(...args).toArray();
              break;
          case 'drop':
              result = await collection.drop();
              break;
          case 'createindex':
              result = await collection.createIndex(...args);
              break;
          case 'dropindex':
              result = await collection.dropIndex(...args);
              break;
          default:
              return res.status(400).json({ output: 'Unsupported operation', status: 'Fail' });
      }

      res.json({ output: result, status: 'Pass' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ output: error.message, status: 'Fail' });
  }
});
