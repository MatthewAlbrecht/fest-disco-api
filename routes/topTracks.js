const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const logger = require('./middleware/logger.js')
const _errorUtils = require('./utils/errorUtils.js')
const _successUtils = require('./utils/successUtils.js')
const { Artist } = require('../schemas/index.js')
const db = require('../db.js')

router.post('/', logger, (req, res) => {

})

router.put('/', logger, (req, res) => {
   let { access_token } = req.body
   if (!access_token) {
      return _errorUtils.handleError(req, res, 'No access token provided', null)
   }
   db.models.artists.find({top_tracks: null})
      .exec((err, foundArtists) => {
         if (err) {
            return _errorUtils.handleError(req, res, 'Error searching db for artists with no top tracks', err)
         }
         if (foundArtists <= 0) {
            return _errorUtils.handleError(req, res, 'No results for artists w/ no top tracks', null)
         }
         console.log("foundArtists ===> ", foundArtists)
         foundArtists.forEach((artist, i) => {
            if (i < 100) {
               console.log("artist ===> ", artist.spotify_id)
               let options = {
                  uri: `https://api.spotify.com/v1/artists/${artist.spotify_id}/top-tracks?country=US`,
                  method: 'GET',
                  headers: {
                     Authorization: 'Bearer ' + access_token
                  }
               }


               // rp(options)
               //    .then((response) => {
               //       if (!response) {
               //          return _errorUtils.handleError(req, res, 'Error getting top tracks from Spotify', null)
               //       }
               //       response = JSON.parse(response)
               //       // console.log("response ===> ", response.tracks)
               //       // console.log("response.tracks[0] ===> ", response.tracks[0])
               //       let topTrackURIs = response.tracks.map((track, i) => {
               //          // console.log("track.uri ===> ", track.uri)
               //          return {uri: track.uri, name: track.name, id: track.id}
               //       })
               //       console.log("topTrackURIs ===> ", topTrackURIs)
               //       artist.set({top_tracks: topTrackURIs})
               //       artist.save((err, updatedArtist) => {
               //          if (err) {
               //             return _errorUtils.handleError(req, res, 'Error saving artists top tracks', err)
               //          }
               //          console.log("updatedArtist ===> ", updatedArtist)
               //       })
               //    })
               //    .catch((err) => {
               //       return _errorUtils.handleError(req, res, 'Error getting top tracks from Spotify', err)
               //    })

            }

         })
      })

})

module.exports = router
