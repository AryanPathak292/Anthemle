
const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    aliases: {
        type: [String],
        default: []
    },

    audioFile: {
        type: String,
        required: true,
        trim: true
    }

}, {
    timestamps: true
});

const Country = mongoose.model('Country', countrySchema);

module.exports = Country;
