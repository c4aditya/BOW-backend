const express = require("express");

const certificate  = require("../controllers/certifiacte");

const route = express.Router();

route.post("/certificate", certificate);

module.exports = route;

