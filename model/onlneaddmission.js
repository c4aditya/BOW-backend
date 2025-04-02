const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
    {
    firstName: {
        type: String,
        required: true,
        maxlength: 50 // `max` is not valid, use `maxlength`
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
        unique: false,
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
        enum: ["Male", "Female", "Other"]
    },
    course: {
        type: String,
        required: true
    }
})


module.exports = mongoose.model("onlineAddmissionSchema" , admissionSchema )
