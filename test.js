import mongoose from "mongoose";
import connectDB from "./db/connection.js";
import Hotel from "./models/Hotel.js";

const runTests = async () => {
  try {
    await connectDB();

    console.log("Running CRUD tests...");

    console.log("Creating a new hotel...");
    
    const newHotel = new Hotel({
      name: 'Beach Paradise Resort',
      city: 'Galle',
      address: '45 Beach Road, Galle Fort',
      price: 15000,
      rating: 4.5,
      amenities: ['WiFi', 'Pool', 'Beach Access', 'Restaurant'],
      rooms: 30,
      available: true,
      email: 'info@beachparadise.com',
      phone: '0912234567',
      description: 'a beautiful beach resort'
    });
    const savedHotel = await newHotel.save();
    console.log("Hotel created:", savedHotel);
    console.log("Hotel name:", savedHotel.name);
    console.log("Hotel ID:", savedHotel._id);
    
    } catch (error) {
    console.error('Error:', error.message);
    } finally {
   
        await mongoose.connection.close();
        console.log('Database connection is closed');
    }
}

runTests();