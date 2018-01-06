const express = require('express')
const mongoose = require ("mongoose"); // The reason for this demo.
const path = require('path')
const routes = require('./routes/index.js')
require('dotenv').config()

const PORT = process.env.PORT || 5000
const dbURI = process.env.MONGODB_URI || undefined

let app = express()
   app.use(express.static(path.join(__dirname, 'public')))

   app.use('/api/v1', routes)

   app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

var db = mongoose.createConnection(dbURI, { useMongoClient: true })

db.on('connected', () => {
   console.log("++++ Mongoose CACHE connected to " + dbURI )
   require('./schemas/index.js')(db)
   //setup schemas
})

db.on('error', (err) => {
   console.log("XXXX Mongoose CACHE connection error " + err)
})

db.on('disconnected', () => {
   console.log("XXXX Mongoose CACHE disconnected to " + dbURI )
})

let gracefulShutdown = (msg, callback) => {
   db.close(() => {
      console.log("XXXX Mongoose CACHE disconnected through " + msg);
      callback()
   })
}

//for nodeman restarts
process.once('SIGUSR2', () => {
   gracefulShutdown('nodemon restart', () => {
      process.kill(process.pid, 'SIGUSR2')
   })
})

//for app termination
process.on('SIGINT', () => {
   gracefulShutdown('app termination', () => {
      process.exit(0)
   })
})

//for Heroku app termination
process.on('SIGTERM', () => {
   gracefulShutdown('Heroku app shutdown', () => {
      process.exit(0)
   })
})

module.exports = app
