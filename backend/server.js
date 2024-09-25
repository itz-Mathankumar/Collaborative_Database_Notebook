const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv').config();

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

// Wait for the connection to be established
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

// Define your User model (adjust this according to your schema)
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  age: Number,
  // Add other fields as necessary
}));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.post('/execute-query', async (req, res) => {
  const { command } = req.body;

  try {
    const collectionName = 'users'; // Define your collection name

    // Check if the command is a find operation
    if (command.startsWith(`db.${collectionName}.find`)) {
      const queryMatch = command.match(/db\.users\.find\((.*?)\)/);
      let result;

      if (queryMatch && queryMatch[1]) {
        const queryString = queryMatch[1].trim();
        let jsonQuery;

        // Convert to valid JSON for the MongoDB query
        if (queryString === "") {
          jsonQuery = {}; // No filter means return all
        } else {
          // Modify the query string to ensure it's valid JSON
          const modifiedQueryString = queryString.replace(/([a-zA-Z0-9_]+):/g, '"$1":');
          jsonQuery = JSON.parse(modifiedQueryString);
        }

        // Use the User model to query the MongoDB collection
        result = await User.find(jsonQuery);
      } else {
        result = await User.find(); // Return all documents if no query
      }

      res.json({ output: result, status: 'Pass' });
    
    // Allow raw command execution
    } else if (command.startsWith('db.command')) {
      // Remove "db.command" prefix for parsing
      const rawCommand = command.replace('db.command', '').trim();

      // Convert to an object for MongoDB command
      let commandObject;
      try {
        commandObject = JSON.parse(rawCommand); // Assuming the command is sent as JSON
      } catch (err) {
        return res.status(400).json({ output: 'Invalid command format', status: 'Fail' });
      }

      // Execute the command
      const db = mongoose.connection.db; // Get the native MongoDB driver db instance
      const result = await db.command(commandObject);
      res.json({ output: result, status: 'Pass' });

    } else {
      return res.status(400).json({ output: 'Invalid command', status: 'Fail' });
    }

  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ output: error.message, status: 'Fail' });
  }
});
