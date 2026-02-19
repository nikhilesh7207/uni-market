const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust if needed
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/university-marketplace');
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const resetPassword = async () => {
    const knownHash = '$2b$10$ZoXHDCabfByEKR.RWwoULusQI55LA0YFK5oID39ps3gagrNWwz37K';
    const updatedPassword = 'password123';

    try {
        await connectDB();

        // 1. Find user by the provided hash
        const user = await User.findOne({ password: knownHash });

        if (!user) {
            console.log('No user found with that exact password hash.');
            process.exit(0);
        }

        console.log(`Found user: ${user.name} (${user.email})`);

        // 2. Hash new password
        // Use User model middleware or hash manually
        // Since we are accessing directly, manual is safer here
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(updatedPassword, salt);
        // Note: The User model pre-save hook might re-hash if we just update the field and call save.
        // But since we are modifying the password field, "isModified('password')" will be true.
        // Wait, if I manually hash here, the model middleware will re-hash it! Double hashing is bad.
        // So I should set the PLAIN text password on the object, and call save(), letting middleware handle it.

        user.password = updatedPassword;
        await user.save();

        console.log(`Success! Password for ${user.email} reset to: '${updatedPassword}'`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
