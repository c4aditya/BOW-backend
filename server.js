const express = require("express")
const cors = require("cors")

const app = express();

app.use(cors());
//getting dotenv

// require("dotenv").config();

// defining PORT 

const PORT =  5600

// using middleware for the passing the data from backend 

app.use(express.json())

// importing the route 

const createDetails = require("./routes/createDetails")
// using cros for connection 

// importing enquiry now route 

const enquiryNow = require("./routes/enwuiryNow")
// for debugging that the enquiryNow is working or not
console.log("the enw is reuuig ")
// defining enquiry now route
app.use("/" ,enquiryNow )

//importing onlineaddmission route 

const onlineAddmissionroute = require("./routes/onlineAddmission")

app.use("/", onlineAddmissionroute)

// importing enroloment 

const enroloment = require("./routes/enroloment")

app.use("/" ,enroloment )


// contact us route

const contactUs =require("./routes/contactus")

app.use("/",contactUs )


// defining the routing with the mounting 

app.use("/", createDetails )

// impoting the certifiace page 

const certificate =  require("./routes/certifacte")
app.use("/",certificate)

app.listen(PORT,()=>{
    console.log(`Your port is running  on the ${PORT} `)
})

app.get("/" , (req , res)=>{
    res.send("Your Request has been created")
})

// mounting 



// database connection 
// importing the data  base

const databaseConnection =() => require("./config/database") 
databaseConnection();