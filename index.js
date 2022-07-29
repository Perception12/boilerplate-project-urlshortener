require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const validUrl = require('valid-url');

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000});

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log('MongoDB Database connection established successfully');
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});

const URL = mongoose.model('URL', urlSchema);

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('api/shorturl/new', async (req, res) => {
  const url = req.body.url_input;
  const url_code = shortId.generate();
  
  if (!validUrl.isWebUrl(url)) {
    res.status(401).json({
      error: 'Invalid URL'
    });
  } else {
    try {
      let findOne = await URL.findOne({
        original_url: url
      });
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        });
      } else {
        findOne = new URL ({
          original_url : url,
          short_url: url_code
        });
        await findOne.save();
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        });
      }
    } catch (err){
      console.error(err);
      res.status(500).json('Server error');
    }
  }
  
});

app.get('/api/shorturl/:short_url?', async (req, res) => {
  const short_url = req.params.short_url;
  try {
    const url_params = await URL.findOne({
      short_url: short_url
    });
    if (url_params) {
      res.redirect(url_params.original_url);
    } else {
      res.status(404).json('No URL found');
    }
  } catch(err) {
    console.error(err);
    res.status(500).json('Server error')
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
