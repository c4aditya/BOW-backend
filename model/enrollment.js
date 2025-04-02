const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        maxlength: 50
    },
    fatherName: {
        type: String,
        required: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        
        maxlength: 100
    },
    mobno: {
        type: String,
        required: true,
        maxlength: 15
    },
    gender: {
        type: String,
        required: true,
      
    },
    course: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true,
    
    },
    address: {
        type: String,
        required: true,
        maxlength: 200
    },
    pincode: {
        type: String,
        required: true,
        maxlength: 10
    }
}, { timestamps: true }); // timestamps automatically createdAt & updatedAt fields add karega

module.exports = mongoose.model("Enrollment", enrollmentSchema);
