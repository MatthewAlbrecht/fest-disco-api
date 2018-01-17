const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const logger = require('./middleware/logger.js')
const _errorUtils = require('./utils/errorUtils.js')
const _successUtils = require('./utils/successUtils.js')
const { Artist } = require('../schemas/index.js')
const db = require('../db.js')

router.post('/', logger, async (req, res) => {
   let { festival, discover, access_token, spotify_id, name, year } = req.body
   if (!festival || !access_token || !spotify_id || !name || !year) {
      return _errorUtils.handleError(req, res, 'Did not recieve a correct data in body', req.body)
   }
   let fashionedData = fashionFestivalData(festival)

   if (discover && Object.keys(fashionedData.discover).length === 0) {
      console.log("======> WE ARE IN discover")
      return _errorUtils.handleError(req, res, 'Did not recieve any discover artists', null)
   } else if (!discover && fashionedData.likes.length === 0) {
      console.log("======> WE ARE IN !discover")
      return _errorUtils.handleError(req, res, 'Did not recieve any for you artists', null)
   } else {
      createPlaylist(req, res, fashionedData)
   }

})

router.get('/:id', logger, (req, res) => {

})

const createPlaylist = (req, res, fashionedData) => {
   let { festival, discover, access_token, spotify_id, name, year } = req.body
   let playlistName = createPlaylistName(name, discover, year)
   // console.log("playlistName ===> ", playlistName)
   let options = {
      method: 'POST',
      uri: `https://api.spotify.com/v1/users/${spotify_id}/playlists`,
      headers: {
         Authorization: 'Bearer ' + access_token,
         "Content-Type": "application/json"
      },
      body: JSON.stringify({name: playlistName})
   }


   rp(options)
      .then(createdPlaylist => {
         if (!createdPlaylist) {
            return _errorUtils.handleError(req, res, 'No playlist object returned', null)
         }
         createdPlaylist = JSON.parse(createdPlaylist)
         return createdPlaylist.id
      })
      .then(id => {
         let tracks = discover ? buildDiscoverTracks(fashionedData) : buildForYouTracks(fashionedData)
         let addTracksOptions = createAddTracksOptions(id, spotify_id, tracks, access_token)
         console.log("addTracksOptions ===> ", addTracksOptions)
         rp(addTracksOptions)
            .then(success => {
               console.log("success ===> ", success)
               return _successUtils.handleSuccess(req, res, 'Playlist Successfully Made', { playlist_id: id })
            })
            .catch(err => {
               // console.log("err ===> ", err)
               return _errorUtils.handleError(req, res, 'Error Adding songs to playlist', err)
            })
         // console.log("id ===> ", id)
      })
      .catch(err => {
         console.log("err ===> ", err)
         return _errorUtils.handleError(req, res, 'Error Creating playist', err)
      })
}



const buildDiscoverTracks = (data) => {
   let { discover, groupingCount, groupingPercentage } = data

   let resultTracks = []
   let genrePoints = {}
   let highCount = 0

   for (var group in groupingCount) {
      highCount = groupingCount[group] > highCount ? groupingCount[group] : highCount
      genrePoints[group] = groupingCount[group]
   }

   let totalPoints = 0
   for (var group in groupingPercentage) {
      genrePoints[group] += Math.floor( groupingPercentage[group] * highCount )
      totalPoints += genrePoints[group]
   }

   console.log("genrePoints ===> ", genrePoints)
   console.log("totalPoints ===> ", totalPoints)
   let songCount = 0
   for (var group in genrePoints) {
      if (discover[group]) {
         genrePoints[group] = Math.ceil((genrePoints[group] / totalPoints || 1) * 100)
         songCount += genrePoints[group]
      } else {
         genrePoints[group] = 0
      }
   }
   console.log("genrePoints ===> ", genrePoints)
   console.log("songCount ===> ", songCount)
   while (songCount > 100) {
      let startSongCount = songCount
      // console.log("startSongCount ===> ", startSongCount)
      for (var group in genrePoints) {
         if (songCount > 100 && genrePoints[group] > 0) {
            genrePoints[group] -= 1
            songCount -= 1
         }
      }
      // console.log("startSongCount ===> ", startSongCount)
      if (startSongCount === songCount) {
         break;
      }
   }
   console.log("genrePoints ===> ", genrePoints)

   while (songCount < 100) {
      let startSongCount = songCount
      // console.log("startSongCount ===> ", startSongCount)
      for (var group in genrePoints) {
         if (songCount < 100 && genrePoints[group] > 0) {
            genrePoints[group] += 1
            songCount += 1
         }
      }
      // console.log("startSongCount ===> ", startSongCount)
      if (startSongCount === songCount) {
         break;
      }
   }
   console.log("genrePoints ===> ", genrePoints)
   // console.log("discover ===> ", discover)
   for (var group in genrePoints) {
      let count = 0
      // console.log("genrePoints ===> ", genrePoints)
      while(count < genrePoints[group]) {
         let startCount = count
         if (discover[group]) {
            for (artist of discover[group]) {
               let chosenTrack = artist.top_tracks ? chooseTrack(artist.top_tracks) : null
               if (!chosenTrack) {
                  continue;
               }
               if (count < genrePoints[group]) {
                  count++
                  resultTracks.push(chosenTrack)
               } else {
                  break;
               }
            }
            if (count === startCount) {
               break;
            }
         } else {
            break;
         }
      }

   }

   return shuffle(resultTracks)
   // console.log("resultTracks ===> ", resultTracks.length)

   // console.log("genrePoints ===> ", genrePoints)
   // console.log("songCount ===> ", songCount)
}




const buildForYouTracks = (data) => {
   // console.log("data ===> ", data)
   let resultTracks = []
   let { likes } = data
   let amount = likes.length
   // console.log("amount ===> ", amount)
   while(resultTracks.length < 100) {
      let startLength = resultTracks.length
      for (artist of likes) {
         let chosenTrack = artist.top_tracks ? chooseTrack(artist.top_tracks) : null
         if (!chosenTrack) {
            continue;
         }
         if (resultTracks.length < 100) {
            resultTracks.push(chosenTrack)
         } else {
            break;
         }
      }

      if (startLength === resultTracks.length) {
         break;
      }
   }

   return shuffle(resultTracks)
}


const chooseTrack = (tracks) => {
   let newTracks = tracks.map(track => track.uri)
   // console.log("tracks ===> ", tracks)
   let amount = newTracks.length
   let weightArray = []
   // console.log("\namount ===> ", amount)
   newTracks.forEach((track, i) => {
      let count = amount - i
      let percent = ((i+1) / amount) * 100

      if (percent <= 20) {
         count *= 3
      } else if (percent <= 50) {
         count *= 2
      }
      // console.log("count ===> ", count)
      for (let j = 0; j < count; j++) {
         weightArray.push(i)
      }

   })

   let randomNumber = Math.floor(Math.random() * weightArray.length)
   let indexOfTrack = weightArray[randomNumber]
   let selectedTrack = newTracks[indexOfTrack]
   tracks.splice(indexOfTrack, 1)

   return selectedTrack
   // console.log("tracks ===> ", tracks)
}


const createAddTracksOptions = (playlist_id, user_id, tracksObject, access_token) => {
   console.log("tracksObject.length ===> ", tracksObject.length)
   let addTracksOptions = {
      method: "POST",
      uri: `https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}/tracks`,
      headers: {
         Authorization: 'Bearer ' + access_token,
         "Content-Type": "application/json"
      },
      // qs: {
      //    uris: tracksObject.join(',')
      // }
      body: JSON.stringify({uris: tracksObject})
   }
   return addTracksOptions
}

const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const createPlaylistName = (festivalName, discover, year) => {
   return discover ? `${festivalName} ${year} Discovery (Viibly)` : `${festivalName} ${year}!! (Viibly)`
}
const fashionFestivalData = (festival) => {
   let fashionedData = {
      likes: [],
      discover: {},
      groupingCount: {},
      groupingPercentage: {}
   }
   festival.forEach((group, g) => {
      let count = 0
      // console.log("\ngroup.name ===> ", group.name)
      group.artists.forEach((artist, a) => {
         // console.log("artist.name ===> ", artist.active, artist)
         let top_tracks = (artist._id && artist._id.top_tracks) ? artist._id.top_tracks : null
         if (artist.active) {
            count++
            fashionedData.likes.push(Object.assign({}, artist, {groupName: group.name, top_tracks: top_tracks}))
         } else {
            if (!fashionedData.discover.hasOwnProperty(group.name)) {
               fashionedData.discover[group.name] = []
               fashionedData.discover[group.name].push(Object.assign({}, artist, {groupName: group.name, top_tracks: top_tracks}))
            } else {
               fashionedData.discover[group.name].push(Object.assign({}, artist, {groupName: group.name, top_tracks: top_tracks}))
            }
         }
      })
      fashionedData.groupingCount[group.name] = count
      fashionedData.groupingPercentage[group.name] = count/group.artists.length
   })
   // console.log("fashionedData ===> ", fashionedData)
   return fashionedData
}

module.exports = router
