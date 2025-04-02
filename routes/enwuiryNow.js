
const express = require("express");

const enquiryDetails  = require("../controllers/enquiryNow")

const route = express.Router();

route.post("/enquiryNow", enquiryDetails);


module.exports= route;