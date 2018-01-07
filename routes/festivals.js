const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const logger = require('./middleware/logger.js')
const _errorUtils = require('./utils/errorUtils.js')
const _successUtils = require('./utils/successUtils.js')
const db = require('../db.js')

router.post('/', logger, (req, res, next) => {
   let { artists, name, year } = req.body
   artists = JSON.parse(artists)
   if (artists && name && year) {
      db.models.festivals.create({artists, name, year}, (err, createdFestival) => {
         if (err) {
            return _errorUtils.handleError(req, res, 'MongoDB Error creating festival', err)
         }
         return _successUtils.handleSuccess(req, res, 'Successfully created festival', createdFestival)

      })
   }
})

router.put('/', logger, (req, res, next) => {
   let { id } = req.body
   db.models.festivals.findById(id, (err, festival) => {
      if (err) {
         return _errorUtils.handleError(req, res, 'MongoDB Error finding festival by id', err)
      }
      let { artists } = festival
      // console.log("artists ===> ", artists)
      if (artists) {
         artists.forEach((artist, i) => {
            console.log("artist ===> ", artist)
            let artistSearchPromise = createArtistSearchPromise(artist, access_token)
         })
      }
      // return _successUtils.handleSuccess(req, res, 'found festival', festival)
   })
})

const createArtistSearchPromise = (artist, access_token) => {
   let options = {
      uri: 'https://api.spotify.com/v1/search',
      auth: {
         bearer: access_token
      }
   }
}
module.exports = router
