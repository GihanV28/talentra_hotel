import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
  name: {
  type: String,
  required: [true, 'Hotel name is required'],
  trim: true,
  minlength: [3, 'Hotel name must be at least 3 characters'],
  maxlength: [100, 'Hotel name cannot exceed 100 characters']
},

city: {
  type: String,
  required: [true, 'City is required'],
  trim: true
},

address: {
  type: String,
  required: [true, 'Address is required'],
  trim: true
},

price: {
  type: Number,
  required: [true, 'Price is required'],
  min: [500, 'Price must be at least Rs. 500'],
  max: [1000000, 'Price cannot exceed Rs. 1,000,000']
},

rating: {
  type: Number,
  min: [0, 'Rating cannot be less than 0'],
  max: [5, 'Rating cannot exceed 5'],
  default: 0
},

amenities: {
  type: [String],
  default: []
},

rooms: {
  type: Number,
  required: [true, 'Number of rooms is required'],
  min: [1, 'At least 1 room is required']
},

available: {
  type: Boolean,
  default: true
},

description: {
  type: String,
  maxlength: [1000, 'Description cannot exceed 1000 characters']
},

email: {
  type: String,
  required: [true, 'Email is required'],
  lowercase: true,
  match: [
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    'Please enter a valid email'
  ]
},

phone: {
  type: String,
  required: [true, 'Phone number is required'],
  match: [
    /^0[0-9]{9}$/,
    'Please enter a valid Sri Lankan phone number (0XXXXXXXXX)'
  ]
}

}, {
  timestamps: true
});

hotelSchema.virtual('displayName').get(function() {
  return `${this.name} - ${this.city}`;
});

hotelSchema.methods.getFullDeatails = function() {
  return `
  Hotel: ${this.name},
  City: ${this.city},
  Address: ${this.address},
  Price: Rs. ${this.price},
  Rating: ${this.rating}/5,
  Amenities: ${this.amenities.join(', ')},
  Rooms: ${this.rooms},
  Email: ${this.email},
  Phone: ${this.phone}`;
};

hotelSchema.statics.findByCity = function(city) {
  return this.find({ 
    city: new RegExp(city, 'i'), 
    available: true 
  });
};

hotelSchema.pre('save', async function() {
  console.log(`Saving hotel: ${this.name}`);
});

hotelSchema.post('save', function(doc) {
  console.log(`${doc.name}`);
});

const Hotel = mongoose.model('Hotel', hotelSchema);

export default Hotel;