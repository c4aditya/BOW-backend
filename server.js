const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
<<<<<<< HEAD
    origin:"*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders:["Content-Type", "Authorization"], 
=======
    origin: ["https://www.botwaviation.com", "https://botwaviation.com"],
	credentials: true
>>>>>>> 59126f29d24eacf479775f0fd348bcfe7b872ddc
  })
);
app.options("*", cors());
app.use(express.json());
<<<<<<< HEAD
app.use("/upload", express.static("upload"));
=======

<<<<<<< HEAD
=======
// Serve uploaded files statically (✅ yeh line add ki gayi hai)
>>>>>>> 0be6184af90cc3411a7c2ff0faeaa1fa911891ad
>>>>>>> 59126f29d24eacf479775f0fd348bcfe7b872ddc


// defining PORT 
const PORT =  5900
// importing the route
const createDetails = require("./routes/createDetails");

// importing enquiry now route
const enquiryNow = require("./routes/enwuiryNow");
console.log("the enq is running ");

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
