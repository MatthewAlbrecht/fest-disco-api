var express = require('express');
var router = express.Router();

// router.use('/', index);
console.log("======> WE ARE IN here")

router.get('/', (req, res) => res.send('WE MADE IT TO INDEX!'))

module.exports = router
