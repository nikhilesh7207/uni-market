const mongoose = require('mongoose');
const User = require('../models/User');

const ATLAS_URI = 'mongodb+srv://nikhileshalapati90_db_user:amarnikhilesh@cluster0.oij4x72.mongodb.net/?appName=Cluster0';

const ADMIN_NAME = 'Admin User';
const ADMIN_EMAIL = 'admin@unimarket.edu';
const ADMIN_PASSWORD = 'adminSecurePassword2026';

async function seedAtlasDatabase() {
    try {
        console.log('Connecting to MongoDB Atlas Production database...');
        await mongoose.connect(ATLAS_URI);
        console.log('Connected to Atlas successfully.');

        // Check if admin already exists
        let user = await User.findOne({ email: ADMIN_EMAIL });
        if (user) {
            console.log(`Admin user ${ADMIN_EMAIL} already exists in Atlas! Re-hashing password to ensure correctness...`);
            user.password = ADMIN_PASSWORD;
            await user.save();
        } else {
            console.log('Creating new Admin user in Atlas...');
            user = new User({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                role: 'admin',
                department: 'Administration',
                year: 'Staff'
            });
            await user.save();
        }

        console.log('===================================================');
        console.log('✅ Admin credentials seeded in MongoDB Atlas Production Database!');
        console.log(`Email:    ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log('===================================================');

    } catch (err) {
        console.error('Failed to connect or seed Atlas database:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedAtlasDatabase();
