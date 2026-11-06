
const express = require('express');
const router = express.Router();

const {
    createCountry,
    getAllCountries,
    updateCountry,
    deleteCountry
} = require('../controllers/countryController');

router.post('/', createCountry);
router.get('/', getAllCountries);
router.put('/:id', updateCountry);
router.delete('/:id', deleteCountry);

module.exports = router;
