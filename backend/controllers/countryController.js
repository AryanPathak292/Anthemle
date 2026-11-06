const Country = require('../models/country');

// CREATE COUNTRY
// CREATE COUNTRY
const createCountry = async (req, res) => {
    try {
        const { name, flag, anthem, aliases, audioFile } = req.body;

        if (!name || !flag || !anthem || !audioFile) {
            return res.status(400).json({
                success: false,
                message: 'Name, flag, anthem and audioFile are required'
            });
        }

        const country = await Country.create({
            name,
            flag,
            anthem,
            aliases,
            audioFile
        });

        return res.status(201).json({
            success: true,
            message: 'Country created successfully',
            data: country
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Country already exists'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error('Create country error:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// GET ALL COUNTRIES
const getAllCountries = async (req, res) => {
    try {
        const countries = await Country.find().sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: countries.length,
            data: countries
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE COUNTRY
const updateCountry = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ID
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid country ID'
            });
        }

        const { name, aliases, audioFile } = req.body;

        const country = await Country.findByIdAndUpdate(
            id,
            { name, aliases, audioFile },
            {
                new: true,
                runValidators: true,
                omitUndefined: true
            }
        );

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Country updated successfully',
            data: country
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Another country with this name already exists'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// DELETE COUNTRY
const deleteCountry = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid country ID'
            });
        }

        const country = await Country.findByIdAndDelete(id);

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Country deleted successfully',
            data: country
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// EXPORT CONTROLLERS
module.exports = {
    createCountry,
    getAllCountries,
    updateCountry,
    deleteCountry
}