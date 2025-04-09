const express = require("express");
const router = express.Router();
const uplode = require("../middleware/uplode") // multer middleware import

const onlineAddmissionDetails = require("../controllers/onlineAddmission");

router.post(
  "/onlineAddmissionDetails",
  uplode.fields([
    { name: "tenthFile", maxCount: 1 },
    { name: "twelfthFile", maxCount: 1 },
    { name: "graduationFile", maxCount: 1 },
    { name: "postGraduationFile", maxCount: 1 },
  ]),
  onlineAddmissionDetails
);

module.exports = router;
