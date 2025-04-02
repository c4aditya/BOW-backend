const express = require("express")

const onlineAddmissionDetails = require("../controllers/onlineAddmission")

const router = express.Router();

router.post("/onlineAddmissionDetails" ,onlineAddmissionDetails )

module.exports = router ;