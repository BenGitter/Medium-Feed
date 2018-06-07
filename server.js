// Dependencies
const express = require('express');
const medium = require('medium-sdk');
const moment = require('moment');
const request = require('request');

// Import environment variables
require('dotenv').config();

// Express
const port = 3000;
const app = express();

// Set view engine
app.set('view engine', 'ejs');

// Set static folder
app.use(express.static('public'));

// Medium
const client = new medium.MediumClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

const redirectURL = 'http://127.0.0.1:3000/callback/medium';

app.get('/', (req, res) => {
  res.render('index', {
    posts: []
  });
})

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

      getPosts(user, (err, posts) => {
        if(err) res.json({err});

        res.render('feed', {posts});
      });
    });
  });
});

function getPosts(user, callback){
  client.getPublicationsForUser({
    userId: user.id
  }, (err, publications) => {
    if(err) callback(err);
      let allPosts = [];
      let counter = 0;

      publications.forEach((publication) => {
        getLatestPostsFromPublication(publication.url, (err, posts) => {
          counter++;
          allPosts = allPosts.concat(posts);
          
          if(counter == publications.length){
            allPosts.sort((a, b) => b.createdAt-a.createdAt);
            callback(null, allPosts);
          }
        });
      });
    
  });
}

function getLatestPostsFromPublication(url, callback){
  const pubURL = url + '/latest';

  request({
    url: pubURL,
    headers: {
      'Accept': 'application/json'
    }
  }, (err, res, body) => {
    if(err) callback(err);

    const json = JSON.parse(body.substr(16)).payload;
    let posts = json.posts;
    let editedPosts = [];
    const domain = json.collection.domain || 'medium.com/' + json.collection.slug;
    
    posts.forEach((post, i) => {
      const date = new Date(post.createdAt);

      editedPosts[i] = {
        url: 'https://' + domain + '/' + post.uniqueSlug,
        pubName: json.collection.name,
        formattedDate: moment(date).format('MMM D'),
        author: json.references.User[post.creatorId].name,
        authorImg: 'https://cdn-images-1.medium.com/fit/c/160/160/' + json.references.User[post.creatorId].imageId,
        readingTime: Math.ceil(post.virtuals.readingTime) + ' min',
        title: post.title,
        subtitle: post.virtuals.subtitle,
        createdAt: post.createdAt
      };
    });

    callback(null, editedPosts);
  });
}

// Start server
app.listen(port, () => console.log(`App listening on port ${port}.`));