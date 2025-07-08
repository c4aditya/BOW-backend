// ==== server.js (All-in-One File) ====

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// Multer setup (file uploads will be saved to 'uploads/' folder)
const upload = multer({ dest: "uploads/" });

// ===== Mongoose Model =====
const admissionSchema = new mongoose.Schema({
    firstName: { type: String, required: true, maxlength: 50 },
    lastName: { type: String, required: true, maxlength: 50 },
    fatherName: { type: String, required: true, maxlength: 50 },
    email: { type: String, required: true, maxlength: 100 },
    mobno: { type: String, required: true, maxlength: 15 },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
    course: { type: String, required: true },
    qualification: { type: String },
    address: { type: String },
    pincode: { type: String },
    tenthFile: { type: String, default: null },
    twelfthFile: { type: String, default: null },
    graduationFile: { type: String, default: null },
    postGraduationFile: { type: String, default: null }
});

const OnlineAddmission = mongoose.model("onlineAddmissionSchema", admissionSchema);

// ===== Controller Function =====
async function onlineAddmission(req, res) {
    try {
        // Debugging: log incoming data
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

        const {
            firstName, lastName, fatherName, email,
            mobno, gender, course, qualification,
            address, pincode
        } = req.body;

        // Extract files (if any)
        const tenth = req.files?.tenthFile?.[0] || null;
        const twelfth = req.files?.twelfthFile?.[0] || null;
        const graduation = req.files?.graduationFile?.[0] || null;
        const postGraduation = req.files?.postGraduationFile?.[0] || null;

        // Save to database
        await OnlineAddmission.create({
            firstName,
            lastName,
            fatherName,
            email,
            mobno,
            gender,
            course,
            qualification,
            address,
            pincode,
            tenthFile: tenth?.path || null,
            twelfthFile: twelfth?.path || null,
            graduationFile: graduation?.path || null,
            postGraduationFile: postGraduation?.path || null,
        });

        res.status(200).json({
            success: true,
            message: "Database entry created successfully."
        });

    } catch (error) {
        console.error("Error in onlineAddmission:", error);
        res.status(500).json({
            success: false,
            message: "There was an error while saving the data to the database.",
            error: error.message
        });
    }
}

// ===== MongoDB Connection =====
mongoose.connect("mongodb://localhost:27017/udemy", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ===== Route Setup =====
app.post(
    "/onlineAddmissionDetails/",
    upload.fields([
        { name: "tenthFile" },
        { name: "twelfthFile" },
        { name: "graduationFile" },
        { name: "postGraduationFile" }
    ]),
    onlineAddmission
);

// ===== Start Server =====
const PORT = 5900;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
