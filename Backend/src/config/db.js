const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Options are not strictly necessary for Mongoose 6+, but good for compatibility if needed.
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Do not exit process if running locally without DB so frontend can still run,
        // but typically you would do process.exit(1) here.
        console.log('Running without DB connection for now...');
    }
};

module.exports = connectDB;
