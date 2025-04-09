const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.js") // multer middleware import

const onlineAddmissionDetails = require("../controllers/onlineAddmission");

router.post("/onlineAddmissionDetails",
  upload.fields([
    { name: "tenthFile", maxCount: 1 },
    { name: "twelfthFile", maxCount: 1 },
    { name: "graduationFile", maxCount: 1 },
    { name: "postGraduationFile", maxCount: 1 },
  ]),
  onlineAddmissionDetails
);

module.exports = router;
