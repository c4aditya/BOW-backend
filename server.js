require('dotenv').config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://botwavation.com",
    "https://www.botwavation.com",
    "https://botwavation.com/",
    "https://www.botwavation.com/",
   
];

const corsOptions = {
    origin: (origin, callback) => {
        callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Access-Control-Allow-Origin"],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Serve uploads folder statically if needed
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5900;

// Existing Landing Page Routes
const enquiryNow = require("./routes/enwuiryNow");
app.use("/", enquiryNow);

const onlineAddmissionroute = require("./routes/onlineAddmission");
app.use("/", onlineAddmissionroute);

const enroloment = require("./routes/enroloment");
app.use("/", enroloment);

const contactUs = require("./routes/contactus");
app.use("/", contactUs);

const createDetails = require("./routes/createDetails");
app.use("/", createDetails);

const certificate = require("./routes/certifacte");
app.use("/", certificate);

// Classes & Authentication Module Routes
const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const interviewClassRoutes = require("./routes/interviewClass.routes");

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api", courseRoutes);
app.use("/api/interview-classes", interviewClassRoutes);

app.get("/", (req, res) => {
    res.send("Your Request has been created");
});

// Basic Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Database connection
const databaseConnection = require("./config/database");
databaseConnection();

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server };
