
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection failed:');
    console.error('Main error:', error.message);

    if (error.reason?.servers) {
        for (const [address, server] of error.reason.servers) {
            console.log('\nServer:', address);
            console.log('Server type:', server.type);
            console.log('Server error:', server.error?.message || 'No specific error');
        }
    }

    process.exit(1);
}
};

module.exports = connectDB;
