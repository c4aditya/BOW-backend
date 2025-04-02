const express = require("express");
const contactUsController = require("../controllers/conatactus")

const route = express.Router();

route.post("/contactUs" , contactUsController)

module.exports = route ;