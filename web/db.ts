import mongoose from 'mongoose';
import logger from './logger.js';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/countdown_timer';
    await mongoose.connect(mongoURI);
    logger.info('MongoDB Connected successfully');
  } catch (error) {
    logger.error('Error connecting to MongoDB: ', error);
    process.exit(1);
  }
};
