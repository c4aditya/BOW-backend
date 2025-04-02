// define routes 
// this contain the express 

const express = require("express")

// it's use controller as 

const courseDetails  = require("../controllers/courseDetail")

// gettting the router from express 

const route = express.Router();

// defing api routes with mount 

route.post("/courseDetails", courseDetails )


// export this route  

module.exports = route ;

