const mongoose = require('mongoose');

// Do not let model operations silently queue while the serverless runtime is
// still connecting (or unable) to connect to MongoDB.
mongoose.set('bufferCommands', false);

let connectionPromise = null;

const connectDB = () => {
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose.connection);
    }

    if (connectionPromise) return connectionPromise;

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        return Promise.reject(new Error('MONGO_URI is not configured'));
    }

    connectionPromise = mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
    })
        .then((connection) => {
            console.log(`MongoDB Connected: ${connection.connection.host}`);
            return connection.connection;
        })
        .catch((error) => {
            console.error(`MongoDB connection failed: ${error.message}`);
            throw error;
        })
        .finally(() => {
            connectionPromise = null;
        });

    return connectionPromise;
};

module.exports = connectDB;
