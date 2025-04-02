const express = require("express");

const enrollment = require("../controllers/enrollment");

const route = express.Router();

route.post("/enroloment" , enrollment)

module.exports = route;