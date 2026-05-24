const mongoose = require('mongoose');
const User = require('../models/User');

const NEW_DB_URI = 'mongodb://127.0.0.1:27017/unimarket_new';

const ADMIN_NAME = 'Admin User';
const ADMIN_EMAIL = 'admin@unimarket.edu';
const ADMIN_PASSWORD = 'adminSecurePassword2026';

async function seedNewDatabase() {
    try {
        console.log(`Connecting to new database at: ${NEW_DB_URI}`);
        await mongoose.connect(NEW_DB_URI);
        console.log('Connected successfully.');

        // Drop user collection to ensure a clean state
        console.log('Clearing old users in this collection if any...');
        await User.deleteMany({ email: ADMIN_EMAIL });

        console.log('Creating new Admin user...');
        const adminUser = new User({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            department: 'Administration',
            year: 'Staff'
        });

        await adminUser.save();

        console.log('\n===================================================');
        console.log('✅ New Database Created and Admin Access Seeded!');
        console.log(`Database URI: ${NEW_DB_URI}`);
        console.log('---------------------------------------------------');
        console.log('Admin Credentials:');
        console.log(`Email:    ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log('===================================================\n');

    } catch (err) {
        console.error('Failed to seed new database:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedNewDatabase();
