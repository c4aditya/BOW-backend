const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({
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
    },
    // Optional fields already in your form:
    qualification: {
        type: String
    },
    address: {
        type: String
    },
    pincode: {
        type: String
    },
    tenthFile: {
        type: String
    },
    twelfthFile: {
        type: String
    },
    graduationFile: {
        type: String
    },
    postGraduationFile: {
        type: String
    }
});

module.exports = mongoose.model("onlineAddmissionSchema", admissionSchema);
