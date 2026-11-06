
const express = require('express');
const router = express.Router();

const {
    createCountry,
    getAllCountries
} = require('../controllers/countryController');

router.post('/', createCountry);
router.get('/', getAllCountries);

module.exports = router;
