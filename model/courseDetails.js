const mongoose = require("mongoose");

const courseDetailsSchema = new mongoose.Schema({
  
  fullName: {
    type: String,
    required: true, // You can make this optional based on your requirement
  },
  fatherName: {
    type: String,
    required: true, // Optional as well
  },
  email: {
    type: String,
    required: true,
  
},
  mobileno: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/, // Match a 10 digit number
  },
  altno: {
    type: String,
    required: false, // Alternate number is optional
    match: /^[0-9]{10}$/, // Match a 10 digit number (optional)
  },
  dateTime: {
    type: Date,
    default: Date.now,
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'], // Enums restrict the value to these options
  },
  qualification: {
    type: String,
    required: true,
  },
  aadhaarNo: {
    type: String,
    required: true,
    match: /^[0-9]{12}$/, // Match a 12 digit Aadhaar number
  },
  course: {
    type: String,
    required: true,
  },
  houseNo: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  locality: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
   
  },
  District: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("CourseDetails", courseDetailsSchema);
