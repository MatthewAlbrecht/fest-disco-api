var mongoose = require ("mongoose"); // The reason for this demo.
let Schema = mongoose.Schema

module.exports = function(db) {

   let festivalSchema = new Schema({
      name: String,
      year: Date,
      date: Date,
      artists: [Schema.Types.ObjectId]
   })

   let artistSchema = new Schema({
      name: String,
      genres: [String],
      spotifyId: String,
   })

   let festivalGroupingsSchema = new Schema({
      fesitvalId: Schema.Types.ObjectId,
      name: String,
      artists: [Schema.Types.ObjectId],
   })

   let Festival = db.model('festivals', festivalSchema)
   let Artist = db.model('artists', artistSchema)
   let FestivalGrouping = db.model('festivalgroupings', festivalGroupingsSchema)

   // Artist.create({name: "Justing", genres: ["rock", "rap"], spotifyId: "97792276"}, (err, artist) => {
   //    if (err) return console.log("err ===> ", err);
   //    console.log("artist ===> ", artist)
   // })
}
