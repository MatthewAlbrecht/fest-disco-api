const express = require('express')
const path = require('path')
const bodyParser = require(`body-parser`);
const logger = require(`morgan`);
require('dotenv').config()
require('./db.js')
const PORT = process.env.PORT || 5000
const app = express()

app.use(function (req, res, next) {
   let allowedOrigins = ['http://localhost:3000', 'https://festdisco.herokuapp.com'];
   var origin = req.headers.origin;
   console.log("origin ===> ", origin)
   if(allowedOrigins.indexOf(origin) > -1){
      res.setHeader('Access-Control-Allow-Origin', origin);
   }
   // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
   res.setHeader('Access-Control-Allow-Credentials', true);

   next()
})

app.use(logger(`dev`));
app.use('/', express.static(__dirname))
// app.use(bodyParser({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({limit: '500kb'}));

const routes = require('./routes/index.js')
app.use('/api/v1', routes)

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))


module.exports = app
