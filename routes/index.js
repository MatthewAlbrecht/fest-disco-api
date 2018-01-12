const express = require('express');
const router = express.Router();
const login = require('./login.js')
const festivals = require('./festivals.js')
const festivalGroupings = require('./festivalGroupings.js')

router.use('/login', login);
router.use('/festivals', festivals);
router.use('/festivalgroupings', festivalGroupings);


// router.get('/', (req, res) => res.send('Didnt hit any route!'))
module.exports = router
