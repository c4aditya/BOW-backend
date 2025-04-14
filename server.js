const express = require("express");
const cors = require("cors");

const app = express();

app.use("/upload", express.static("upload"));
app.use(cors());

app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow all methods
    allowedHeaders: ["*"], // Allow all headers
  })
);

// Serve uploaded files statically (✅ yeh line add ki gayi hai)

// defining PORT
const PORT = 5800;

// using middleware for the passing the data from backend
app.use(express.json());

// importing the route
const createDetails = require("./routes/createDetails");

// importing enquiry now route
const enquiryNow = require("./routes/enwuiryNow");
console.log("the enw is reuuig ");

// defining enquiry now route
app.use("/", enquiryNow);

//importing onlineaddmission route
const onlineAddmissionroute = require("./routes/onlineAddmission");
app.use("/", onlineAddmissionroute);

// importing enroloment
const enroloment = require("./routes/enroloment");
app.use("/", enroloment);

// contact us route
const contactUs = require("./routes/contactus");
app.use("/", contactUs);

// defining the routing with the mounting
app.use("/", createDetails);

// importing the certificate page
const certificate = require("./routes/certifacte");
app.use("/", certificate);

app.listen(PORT, () => {
  console.log(`Your port is running on the ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Your Request has been created");
});

// database connection
const databaseConnection = () => require("./config/database");
databaseConnection();
