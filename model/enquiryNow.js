const mongoose = require("mongoose")

const enquiryNowSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First Name is required"] // Custom error message
    },
    lastName: {
        type: String,
        required: [true, "Last Name is required"] // Custom error message
    },
    email: {
        type: String,
        required: [true, "Email is required"] // Custom error message
    },
    number: {
        type: Number,
        required: [true, "Mobile Number is required"], // Custom error message
        match: /^[0-9]{10}$/
    },
    gender: {
        type: String,
        required: [true, "Gender is required"] // Custom error message
    },
    course: {
        type: String,
        required: [true, "Course is required"] // Custom error message
    },
    message: {
        type: String
    }
});

module.exports = mongoose.model("enquiryNow", enquiryNowSchema);
