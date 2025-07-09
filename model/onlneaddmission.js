const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({
    firstName: {
        type: String,
        // required: true,
        // maxlength: 50
    },
    lastName: {
        type: String,
        // required: true,
        // maxlength: 50
    },
    fatherName: {
        type: String,
        // required: true,
        // maxlength: 50
    },
    email: {
        type: String,
        // required: true,
        unique: false,
        maxlength: 100
    },
    mobno: {
        type: String,
        // required: true,
        maxlength: 15
graduationFile    },
    gender: {
        type: String,
        // required: true,
        enum: ["Male", "Female", "Other"]
    },
    course: {
        type: String,
        // required: true
    },

    // ✅ Add file path fields here:
    tenthFile: {
        type: String,
        default:null
    },
    twelfthFile: {
        type: String,
        default:null
    },
    graduationFile: {
        type: String,
        default:null
    },
    postGraduationFile: {
        type: String,
        default:null
    }
});

module.exports = mongoose.model("onlineAddmissionSchema", admissionSchema);
