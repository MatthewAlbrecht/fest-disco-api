const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const logger = require('./middleware/logger.js')
const _errorUtils = require('./utils/errorUtils.js')
const _successUtils = require('./utils/successUtils.js')
const { Artist } = require('../schemas/index.js')
const db = require('../db.js')

router.post('/', logger, (req, res) => {
   // console.log("req.body ===> ", req.body)
   groupings = JSON.parse(req.body.data)
   // console.log("data ===> ", groupings)
   if (groupings) {
      if (!Array.isArray(groupings)) {
         groupings = [groupings]
      }
      groupings.forEach((grouping, i) => {
         console.log("grouping ===> ", grouping.name)
         db.models.festivalgroupings.create(grouping, (err, createdGrouping) => {
            if (err) return _errorUtils.handleError(req, res, "Create new festival grouping failed", err);
            console.log("createdGrouping ===> ", createdGrouping)
         })
      })
   }

})

router.get('/:id', logger, (req, res) => {
   let { id } = req.params
   if (id) {
      db.models.festivalgroupings.find({ festivalId: id })
         .populate({path: 'artists._id', model: Artist})
         .exec((err, foundFestivalGroupings) => {
            if (err) return _errorUtils.handleError(req, res, "Find FestivalGroupings failed", err);
            return _successUtils.handleSuccess(req, res, "Successfully found groupings", foundFestivalGroupings)
         })
   }
})

module.exports = router
