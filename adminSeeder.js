const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User'); // Adjust path as necessary
const connectDB = require('./src/config/db');

dotenv.config();

connectDB();

const importData = async () => {
  try {
    // Check if admin already exists
    const userExists = await User.findOne({ email: 'admin@example.com' });

    if (userExists) {
        console.log('Admin user already exists');
        console.log('Email: admin@example.com');
        // We can't know the password if it's hashed, so we just say it exists.
        // But we can update it if we wanted to reset. For now, let's just exit.
        process.exit();
    } else {
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123', // password will be hashed by pre-save middleware in User model
            isAdmin: true, 
            address: {
                street: 'Admin St',
                city: 'Admin City',
                state: 'Admin State',
                postalCode: '000000',
                country: 'Admin Country'
            },
            phone: '0000000000' 
        });

        await adminUser.save();

        console.log('Admin User Created!');
        console.log('Email: admin@example.com');
        console.log('Password: password123');
        process.exit();
    }

  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
