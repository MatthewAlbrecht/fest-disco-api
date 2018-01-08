const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const logger = require('./middleware/logger.js')
const _errorUtils = require('./utils/errorUtils.js')
const _successUtils = require('./utils/successUtils.js')
const db = require('../db.js')
const { Artist } = require('../schemas/index.js')

router.get('/', logger, (req, res, next) => {
   db.models.festivals.find({})
      .exec((err, festivals) => {
         if (err) {
            return _errorUtils.handleError(req, res, 'MongoDB Error finding festivals', err)
         }
         return _successUtils.handleSuccess(req, res, 'Successfully found festivals', festivals)
      })
})

router.get('/:name/:year', logger, (req, res, next) => {
   let { name, year } = req.params
   if (name && year) {
      db.models.festivals.find({name, year})
      .populate({path: 'artists._id', model: Artist})
      .exec((err, festival) => {
         if (err) {
            return _errorUtils.handleError(req, res, 'MongoDB Error finding festival', err)
         }
         if (festival.length < 1) {
            return _errorUtils.handleError(req, res, 'No matching festival found', err)
         }
         return _successUtils.handleSuccess(req, res, 'Successfully found festival', festival[0])
      })

   } else {
      return _errorUtils.handleError(req, res, 'Missing params for search', null)
   }
})

router.post('/', logger, (req, res, next) => {
   let { artists, name, year } = req.body
   artists = JSON.parse(artists)
   artists = artists.map((artist, i) =>  {
      return {
         spotify_id: null,
         _id: null,
         name: artist
      }
   })
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
   let { id, access_token } = req.body
   db.models.festivals.findById(id, (err, festival) => {
      if (err) {
         return _errorUtils.handleError(req, res, 'MongoDB Error finding festival by id', err)
      }
      if (!festival) {
         return _errorUtils.handleError(req, res, `No festival with id: ${id}`, err)
      }
      // console.log("festival ===> ", festival)
      let { artists } = festival
      artists = artists.map((artist, i) => artist.name)
      console.log("\n\n\n\nARTISTS LENGTH BEFORE ===>", artists.LENGTH, '<===\n\n\n\n')
      let artistsToSaveArray = []
      // console.log("artists ===> ", artists)
      let artistSearchPromisesArray = []
      if (artists) {
         artists.forEach((artist, i) => {
            if (true) {
               artistSearchPromisesArray.push(createArtistSearchPromise(artist, access_token))
            }
         })
         artistSearchPromisesArray.forEach((artistSearchPromise, i) => {

            makeSearchRequest(req, res, artistSearchPromise, artists, artistsToSaveArray, i)

         })
         setTimeout(()=> {
            console.log("artistsToSaveArray ===> ", artistsToSaveArray)
            festival.set({artists: artistsToSaveArray})
            festival.save((err, updatedFestival) => {
               if (err) {
                  return _errorUtils.handleError(req, res, 'MongoDB Error updating festival lineup', err)
               }
               console.log("\n\n\n\nARTISTS LENGTH After ===>", artistsToSaveArray.length, '<===\n\n\n\n')
               return _successUtils.handleSuccess(req, res, 'Successfully updated artist info', updatedFestival)
            })
         }, 10000)
      }
   })
})

const createArtistSearchPromise = (artist, access_token) => {
   let options = {
      method: 'GET',
      uri: 'https://api.spotify.com/v1/search',
      headers: {
         Authorization: 'Bearer ' + access_token
      },
      qs: {
         q: artist,
         type: 'artist',
         limit: 3
      }
   }
   return rp(options)
}

const buildArtistObject = (artist) => {
   return {
      name: (artist.name) ? artist.name : null,
      genres: (artist.genres) ? artist.genres : null,
      spotify_id: (artist.id) ? artist.id : null,
      href: (artist.href) ? artist.href : null,
      type: (artist.type) ? artist.type : null,
      uri: (artist.uri) ? artist.uri : null,
      followers: (artist.followers && artist.followers.total) ? artist.followers.total : null,
      popularity: (artist.popularity) ? artist.popularity : null,
      images: (artist.images) ? artist.images : null
   }
}

const makeSearchRequest = (req, res, artistSearchPromise, artists, artistsToSaveArray, i) => {
   artistSearchPromise
      .then((searchResults) => {
         searchResults = JSON.parse(searchResults)
         if (searchResults.artists.items.length > 0) {
            searchResults = searchResults.artists.items[0]
            let artistObject = buildArtistObject(searchResults)

            db.models.artists.find({spotify_id: artistObject.spotify_id})
            .exec((artistCheckError, foundArtist) => {
               if (artistCheckError) {
                  return _errorUtils.handleErrorNoRes(req, res, 'MongoDB Error finding artist by id', err)
               }
               if (foundArtist.length > 0) {
                  console.log("foundArtist[0] ===> ", foundArtist[0])
                  artistsToSaveArray.push({spotify_id: foundArtist[0].spotify_id , _id: foundArtist[0]._id, name: foundArtist[0].name})
                  // TODO: push the id to
               } else {
                  db.models.artists.create(artistObject, (createArtistError, createdArtist) => {
                     if (createArtistError) {
                        return _errorUtils.handleErrorNoRes(req, res, 'MongoDB Error saving artist', err)
                     }
                     console.log("createdArtist ===> ", createdArtist)
                     artistsToSaveArray.push({spotify_id: createdArtist.spotify_id , _id: createdArtist._id, name: createdArtist.name})
                  })
               }
            })
         } else {
            console.log("-- NO SEARCH RESULTS FOR", artists[i])
            artistsToSaveArray.push({spotify_id: null, _id: null, name: artists[i]})
            return _errorUtils.handleErrorNoRes(req, res, `Spotify search returns no results ${artists[i]}`, null)
         }

      })
      .catch((searchError) => {
         console.log("searchError ===> ", searchError)
         return _errorUtils.handleErrorNoRes(req, res, 'Error searching Spotify for artist name', searchError)
      })
}
module.exports = router
