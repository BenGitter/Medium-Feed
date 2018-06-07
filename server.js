// Dependencies
const express = require('express');
const medium = require('medium-sdk');

// Import environment variables
require('dotenv').config();

// Express
const port = 3000;
const app = express();

// Set static folder
app.use(express.static('public'));

// Medium
const client = new medium.MediumClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

const redirectURL = 'http://127.0.0.1:3000/callback/medium';



// API Endpoint
app.get('/api', (req, res) => res.send('API Endpoint'));

app.get('/api/publications', (req, res) => {

});

// Authentication
app.get('/auth', (req, res) => {
  const url = client.getAuthorizationUrl('test', redirectURL, [
    medium.Scope.BASIC_PROFILE,
    medium.Scope.LIST_PUBLICATIONS
  ]);

  res.redirect(url);
});

app.get('/callback/medium', (req, res) => {
  const code = req.query.code;

  client.exchangeAuthorizationCode(code, redirectURL, (err, token) => {
    client.getUser((err, user) => {
      if(err) res.json({err});

      client.getPublicationsForUser({
        userId: user.id
      }, (err, publications) => {
        if(err) res.json({err});

        res.json({publications});
      });
    });
  });
});

// Start server
app.listen(port, () => console.log(`App listening on port ${port}.`));