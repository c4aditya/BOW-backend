const express = require("express");
const cors = require("cors");

const app = express();

// Serve static upload folder
app.use("/upload", express.static("upload"));

// ✅ CORRECT CORS CONFIG
app.use(
  cors({
    origin: "*", // Use ["http://localhost:5173"] in development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: "*",
    credentials: true,
  })
);

// Optional: Handle preflight requests
app.options("*", cors());

// Middleware
app.use(express.json());

// Routes
const createDetails = require("./routes/createDetails");
const enquiryNow = require("./routes/enwuiryNow");
const onlineAddmissionroute = require("./routes/onlineAddmission");
const enroloment = require("./routes/enroloment");
const contactUs = require("./routes/contactus");
const certificate = require("./routes/certifacte");

// Route bindings
app.use("/", enquiryNow);
app.use("/", onlineAddmissionroute);
app.use("/", enroloment);
app.use("/", contactUs);
app.use("/", createDetails);
app.use("/", certificate);

// Home route
app.get("/", (req, res) => {
  res.send("Your Request has been created");
});

// DB Connection
const databaseConnection = () => require("./config/database");
databaseConnection();

// Server
const PORT = 5900;
app.listen(PORT, () => {
  console.log(`Your port is running on the ${PORT}`);
});
