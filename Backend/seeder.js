const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./src/models/Admin');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected.');

        // Check if admin exists in the separate Admin credentials collection
        const adminExists = await Admin.findOne({ email: 'admin@janakisky.in' });

        if (adminExists) {
            console.log('Admin already exists in the Admin collection!');
            process.exit();
        }

        const adminUser = await Admin.create({
            email: 'admin@janakisky.in',
            mobile: '9999999999',
            password: 'AdminPassword123!', // Hashed by the pre-save middleware in the Admin model
            role: 'admin'
        });

        console.log('Admin Credentials Created Successfully (separate Admin collection)!');
        console.log('Email:', adminUser.email);
        console.log('Mobile:', adminUser.mobile);
        console.log('Password:', 'AdminPassword123!');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
