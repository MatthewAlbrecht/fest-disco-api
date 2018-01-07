const express = require('express')
const path = require('path')
const bodyParser = require(`body-parser`);
const logger = require(`morgan`);
require('dotenv').config()
require('./db.js')
const PORT = process.env.PORT || 5000
const app = express()

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  next()
})

app.use(logger(`dev`));
app.use('/', express.static(__dirname))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const routes = require('./routes/index.js')
app.use('/api/v1', routes)

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))


module.exports = app
