/**
 * Utility script to generate a secure Admin user.
 * USAGE: node scripts/createAdmin.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Hardcode or get from env variables
const MONGO_URI = 'mongodb://127.0.0.1:27017/unimarket';

const ADMIN_NAME = 'Nikhilesh';
const ADMIN_EMAIL = 'nikhilesh@university.edu';
const ADMIN_PASSWORD = 'nikhilesh@2005';

async function createAdmin() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected Successfully.");

        // Check if admin already exists
        let user = await User.findOne({ email: ADMIN_EMAIL });
        if (user) {
            console.log(`Admin user with email ${ADMIN_EMAIL} already exists!`);
            process.exit(0);
        }

        // Create new admin
        user = new User({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,  // Note: the User model's pre-save hook handles the bcrypt hashing. 
            role: 'admin'              // Explicitly assign the powerful admin role
        });

        await user.save();
        console.log(`✅ Admin account successfully created!`);
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log(`-----------------------------------`);
        console.log(`Please login via the main port and immediately change your password in the Admin Profile.`);

    } catch (err) {
        console.error("Failed to create admin:", err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();
