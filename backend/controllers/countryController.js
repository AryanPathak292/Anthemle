
const Country = require('../models/country');

const createCountry = async (req, res) => {
    try {
        const { name, aliases, audioFile } = req.body;

        const country = await Country.create({
            name,
            aliases,
            audioFile
        });

        res.status(201).json({
            success: true,
            message: 'Country created successfully',
            data: country
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const getAllCountries = async (req, res) => {
    try {
        const countries = await Country.find();

        res.status(200).json({
            success: true,
            count: countries.length,
            data: countries
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = { createCountry, getAllCountries };