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

let db;

// Connect to MongoDB
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

// Start server
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

// Cell schema
const cellSchema = new mongoose.Schema({
  content: { type: String, required: true },
  // Add other properties related to the cell, e.g., type (text, image, etc.)
});

const notebookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  cells: [{ type: Object }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Ensure this is present
});

const Notebook = mongoose.model('Notebook', notebookSchema);


// Register new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, notebooks: [] });
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new notebook
app.post('/create-notebook', async (req, res) => {
  const { userId, title } = req.body;

  console.log(`Received request to create a new notebook with title: "${title}" for user ID: ${userId}`);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found for ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Creating new notebook for user: ${user.username}`); // Assuming user has a username field

    const newNotebook = new Notebook({ title, cells: [], userId: user._id });
    await newNotebook.save();

    console.log(`New notebook created with ID: ${newNotebook._id} and title: "${title}"`);

    user.notebooks.push({ id: newNotebook._id, title });
    await user.save();

    console.log(`Notebook with ID: ${newNotebook._id} added to user: ${user.username}`);

    res.status(201).json({ message: 'Notebook created', notebookId: newNotebook._id });
  } catch (error) {
    console.error('Error creating notebook:', error.message); // Log the error message
    res.status(500).json({ message: error.message });
  }
});


// Add a new cell to a notebook
app.post('/notebooks/:notebookId/cells', async (req, res) => {
  const { userId, content } = req.body; // Assume you get userId from the request
  const { notebookId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notebook = await Notebook.findById(notebookId);
    if (!notebook || !notebook.userId.equals(userId)) {
      return res.status(404).json({ message: 'Notebook not found or access denied' });
    }

    const newCell = { content };
    notebook.cells.push(newCell);
    await notebook.save();

    res.status(201).json({ message: 'Cell added', cell: newCell });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a cell in a notebook
app.put('/notebooks/:notebookId/cells/:cellId', async (req, res) => {
  const { userId, content } = req.body; // Assume you get userId from the request
  const { notebookId, cellId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notebook = await Notebook.findById(notebookId);
    if (!notebook || !notebook.userId.equals(userId)) {
      return res.status(404).json({ message: 'Notebook not found or access denied' });
    }

    const cell = notebook.cells.id(cellId);
    if (!cell) return res.status(404).json({ message: 'Cell not found' });

    cell.content = content; // Update cell content
    await notebook.save();

    res.status(200).json({ message: 'Cell updated', cell });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a notebook
app.delete('/notebooks/:notebookId', async (req, res) => {
  const { userId } = req.body; // Assume you get userId from the request
  const { notebookId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notebook = await Notebook.findById(notebookId);
    if (!notebook || !notebook.userId.equals(userId)) {
      return res.status(404).json({ message: 'Notebook not found or access denied' });
    }

    await Notebook.deleteOne({ _id: notebookId });
    user.notebooks = user.notebooks.filter(notebook => !notebook.id.equals(notebookId));
    await user.save();

    res.status(200).json({ message: 'Notebook deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Share a notebook with another user by username
app.post('/notebooks/:notebookId/share', async (req, res) => {
  const { userId, username } = req.body; // Assume you get userId and username from the request
  const { notebookId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notebook = await Notebook.findById(notebookId);
    if (!notebook || !notebook.userId.equals(userId)) {
      return res.status(404).json({ message: 'Notebook not found or access denied' });
    }

    const userToShare = await User.findOne({ username });
    if (!userToShare) return res.status(404).json({ message: 'User to share not found' });

    if (notebook.sharedWith.includes(userToShare._id)) {
      return res.status(400).json({ message: 'Notebook is already shared with this user' });
    }

    notebook.sharedWith.push(userToShare._id); // Add user to sharedWith array
    await notebook.save();

    res.status(200).json({ message: 'Notebook shared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get notebooks for a specific user (owned and shared)
app.get('/notebooks/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate({
      path: 'notebooks.sharedWith',
      options: { strictPopulate: false } // This line allows overriding the strict population check
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find all notebooks owned by the user or shared with the user
    const notebooks = await Notebook.find({
      $or: [
        { userId: user._id },
        { sharedWith: user._id }
      ]
    }).populate('sharedWith');

    res.json({ notebooks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get all notebooks shared with a specific user
app.get('/notebooks/shared/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('notebooks.sharedWith');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Filter notebooks that are shared with this user
    const sharedNotebooks = await Notebook.find({ sharedWith: user._id }).populate('userId');

    res.json({ notebooks: sharedNotebooks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
