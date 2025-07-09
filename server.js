const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: ["https://www.botwaviation.com", "https://botwaviation.com"],
	credentials: true
  })
);
app.options("*", cors());
app.use(express.json());

// defining PORT
// using middleware for the passing the data from backend

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
