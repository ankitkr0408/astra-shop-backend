import dotenv from 'dotenv';
import User from './src/models/User';
import connectDB from './src/config/db';

dotenv.config();
connectDB();

const createAdmin = async () => {
  try {
    const userExists = await User.findOne({ email: 'admin@example.com' });

    if (userExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    const user = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // Will be hashed by pre-save hook
      isAdmin: true,
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    process.exit();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
