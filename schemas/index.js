var mongoose = require ("mongoose"); // The reason for this demo.
let Schema = mongoose.Schema
const db = require('../db');

let lineupArtistSchema = new Schema({
   _id: Schema.Types.ObjectId,
   spotify_id: String,
   name: String
})
let festivalSchema = new Schema({
   name: String,
   year: Number,
   artists: [lineupArtistSchema]
})

let imageSchema = new Schema({
   height: Number,
   url: String,
   width: Number
})

let trackSchema = new Schema({
   id: String,
   name: String,
   uri: String
})

let artistSchema = new Schema({
   name: String,
   genres: [String],
   spotify_id: {type: String, required: true},
   href: {type: String, required: false},
   type: {type: String, required: false},
   uri: {type: String, required: false},
   followers: {type: Number, required: false},
   popularity: {type: Number, required: false},
   images: [imageSchema],
   top_tracks: [trackSchema]
})

let festivalGroupingsSchema = new Schema({
   festivalId: Schema.Types.ObjectId,
   name: String,
   artists: [lineupArtistSchema],
})

let userSchema = new Schema({
   spotify_id: {type: String, required: true},
   email: {type: String, required: true},
   display_name: {type: String, required: false},
   profile_image: {type: String, required: false},
   country: {type: String, required: false},
   href: {type: String, required: false},
   product: {type: String, required: false},
   type: {type: String, required: false},
   uri: {type: String, required: false},
   followers: {type: Number, required: false},
   access_token: {type: String, required: true},
   refresh_token: {type: String, required: true},
   created: {type: Date, required: true},
   modified: {type: Date, required: true}
})

let Festival = db.model('festivals', festivalSchema)
let Artist = db.model('artists', artistSchema)
let FestivalGrouping = db.model('festivalgroupings', festivalGroupingsSchema)
let User = db.model('users', userSchema)

module.exports =  {
   Festival,
   Artist,
   FestivalGrouping,
   User
}
// Artist.create({name: "Justing", genres: ["rock", "rap"], spotifyId: "97792276"}, (err, artist) => {
//    if (err) return console.log("err ===> ", err);
//    console.log("artist ===> ", artist)
// })
