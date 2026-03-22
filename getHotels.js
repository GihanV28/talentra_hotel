import mongoose from "mongoose";
import connectDB from "./db/connection.js";
import Hotel from "./models/Hotel.js";

const getHotels = async () => {
  try {
    await connectDB();
    const hotels = await Hotel.find({});
    console.log("Hotels:", hotels.map(h => ({ id: h._id, name: h.name })));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

getHotels();