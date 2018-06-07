// Dependencies
const express = require('express');
const mediumSDK = require('medium-sdk');

// Import environment variables
require('dotenv').config();

// Express
const port = 3000;
const app = express();

// Set static folder
app.use(express.static('public'));

// API Endpoint
app.get('/api', (req, res) => res.send('API Endpoint'));

// Start server
app.listen(port, () => console.log(`App listening on port ${port}.`));