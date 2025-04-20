const express = require("express");
const router = express.Router();


const onlineAddmissionDetails = require("../controllers/onlineAddmission");

router.post("/onlineAddmissionDetails",  onlineAddmissionDetails);



module.exports = router;
