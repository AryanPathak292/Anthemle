const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();

const Country = require('./models/country');

const countries = [
    { name: "India", flag: "🇮🇳", anthem: "Jana Gana Mana", audioFile: "assets/audio/india.mp3" },
    { name: "France", flag: "🇫🇷", anthem: "La Marseillaise", audioFile: "assets/audio/france.mp3" },
    { name: "Japan", flag: "🇯🇵", anthem: "Kimigayo", audioFile: "assets/audio/japan.mp3" },
    { name: "Germany", flag: "🇩🇪", anthem: "Das Deutschlandlied", audioFile: "assets/audio/germany.mp3" },
    { name: "Italy", flag: "🇮🇹", anthem: "Il Canto degli Italiani", audioFile: "assets/audio/italy.mp3" },
    { name: "Brazil", flag: "🇧🇷", anthem: "Hino Nacional Brasileiro", audioFile: "assets/audio/brazil.mp3" },
    { name: "Canada", flag: "🇨🇦", anthem: "O Canada", audioFile: "assets/audio/canada.mp3" },
    { name: "Australia", flag: "🇦🇺", anthem: "Advance Australia Fair", audioFile: "assets/audio/australia.mp3" },
    { name: "Saudi Arabia", flag: "🇸🇦", anthem: "National Anthem of Saudi Arabia", audioFile: "assets/audio/saudi-arabia.mp3" },
    { name: "United Kingdom", flag: "🇬🇧", aliases: ["UK"], anthem: "God Save the King", audioFile: "assets/audio/uk.mp3" },
    { name: "Hungary", flag: "🇭🇺", anthem: "Himnusz", audioFile: "assets/audio/hungary.mp3" },
    { name: "Spain", flag: "🇪🇸", anthem: "Marcha Real", audioFile: "assets/audio/spain.mp3" },
    { name: "Portugal", flag: "🇵🇹", anthem: "A Portuguesa", audioFile: "assets/audio/portugal.mp3" },
    { name: "Mexico", flag: "🇲🇽", anthem: "Himno Nacional Mexicano", audioFile: "assets/audio/mexico.mp3" },
    { name: "Netherlands", flag: "🇳🇱", anthem: "Het Wilhelmus", audioFile: "assets/audio/netherlands.mp3" },
    { name: "Russia", flag: "🇷🇺", anthem: "Государственный гимн Российской Федерации", audioFile: "assets/audio/russia.mp3" },
    { name: "Belgium", flag: "🇧🇪", anthem: "La Brabançonne", audioFile: "assets/audio/belgium.mp3" },
    { name: "South Korea", flag: "🇰🇷", anthem: "Aegukga", audioFile: "assets/audio/south-korea.mp3" },
    { name: "Sweden", flag: "🇸🇪", anthem: "Du gamla, Du fria", audioFile: "assets/audio/sweden.mp3" },
    { name: "Norway", flag: "🇳🇴", anthem: "Ja, vi elsker dette landet", audioFile: "assets/audio/norway.mp3" },
    { name: "Turkey", flag: "🇹🇷", anthem: "İstiklâl Marşı", audioFile: "assets/audio/turkey.mp3" },
    { name: "Greece", flag: "🇬🇷", anthem: "Hymn to Liberty", audioFile: "assets/audio/greece.mp3" },
    { name: "China", flag: "🇨🇳", anthem: "March of the Volunteers", audioFile: "assets/audio/china.mp3" },
    { name: "Argentina", flag: "🇦🇷", anthem: "Himno Nacional Argentino", audioFile: "assets/audio/argentina.mp3" },
    { name: "South Africa", flag: "🇿🇦", anthem: "National Anthem of South Africa", audioFile: "assets/audio/south-africa.mp3" }
];

const seedCountries = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);

        for (const country of countries) {
            await Country.updateOne(
                { name: country.name },
                { $set: country },
                { upsert: true, runValidators: true }
            );
        }

        console.log(`Successfully seeded ${countries.length} countries!`);

    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

seedCountries();
