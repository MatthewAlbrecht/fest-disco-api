const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const logger = require('./middleware/logger.js')
const _errorUtils = require('./utils/errorUtils.js')
const _successUtils = require('./utils/successUtils.js')
const db = require('../db.js')

router.post('/accessAndRefresh', logger, (req, res, next) => {
   let { code } = req.body
   let accessAndRefreshOptions = createOptionsForAccessAndRefreshRequest(code)

   rp(accessAndRefreshOptions)
      .then((response) => {
         response = JSON.parse(response)
         let { access_token, refresh_token } =  response
         let profileOptions = createOptionsForProfileRequest(access_token)
         rp(profileOptions)
            .then(profile => {
               profile = JSON.parse(profile)
               db.models.users.find({spotify_id: profile.id})
                  .exec((err, user) => {
                     if (err) {
                        return _errorUtils.handleError(req, res, 'MongoDB Error finding user', err)
                     }
                     let userExists = user.length > 0
                     if (userExists) {
                        user = user[0]
                        user.set({access_token, refresh_token, modified: new Date()})
                        user.save((err, updatedUser) => {
                           if (err) {
                              return _errorUtils.handleError(req, res, 'MongoDB Error updating user', err)
                           }
                           // TODO: only send pertinant information back
                           console.log("updatedUser ===> ", updatedUser)
                           return _successUtils.handleSuccess(req, res, 'Successfully updated user', updatedUser)

                        })
                     } else {
                        let userObject = buildUserObjectFromSpotifyProfile(profile, access_token, refresh_token)
                        db.models.users.create(userObject, (err, createdUser) => {
                           if (err) {
                              return _successUtils.handleSuccess(req, res, 'successfully updated user', createdUser)
                           }
                           // TODO: only send pertinant information back
                           console.log("createdUser ===> ", createdUser)
                           return _errorUtils.handleError(req, res, 'MongoDB Error updating user', err)

                        })
                     }
                  })
            })
            .catch((err) => {
               return _errorUtils.handleError(req, res, 'Request for profile failed', err)
            })

      })
      .catch((err) => {
         return _errorUtils.handleError(req, res, 'Request for refresh and access tokens failed', err)
      })

})

const createOptionsForAccessAndRefreshRequest = (code) => {
   console.log("req.Headers ===> ", req.headers.origin)
   let body = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: req.headers.origin + '/cb'
   }
   let options = {
      method: 'POST',
      uri: 'https://accounts.spotify.com/api/token',
      form: body,
      // json: true,
      headers: {
         'Authorization': 'Basic ' + (new Buffer(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')),
         'Content-Type': 'application/x-www-form-urlencoded'
      }
   }
   return options
}

const createOptionsForProfileRequest = (access_token) => {
   let options = {
      uri: 'https://api.spotify.com/v1/me',
      auth: {
         bearer: access_token
      }
   }
   return options
}

const buildUserObjectFromSpotifyProfile = (profile, access_token, refresh_token) => {
   return {
      spotify_id: (profile && profile.id) ? profile.id : null,
      email: (profile && profile.email) ? profile.email : null,
      display_name: (profile && profile.display_name) ? profile.display_name : null,
      profile_image: (profile && profile.images && profile.images[0] && profile.images[0].url) ? profile.images[0].url : null,
      country: (profile && profile.country) ? profile.country : null,
      href: (profile && profile.href) ? profile.href : null,
      product: (profile && profile.product) ? profile.product : null,
      type: (profile && profile.type) ? profile.type : null,
      uri: (profile && profile.uri) ? profile.uri : null,
      followers: (profile && profile.followers && profile.followers.total) ? profile.followers.total : null,
      access_token: access_token || null,
      refresh_token: refresh_token || null,
      created: new Date(),
      modified: new Date()
   }
}

module.exports = router
