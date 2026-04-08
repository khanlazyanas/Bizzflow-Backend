import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // process.env.MONGO_URI hum .env file se lenge
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'bizflow_db' // Yahan humne database ka naam fix kar diya hai
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Agar error aaye toh server rok do
  }
};

export default connectDB;