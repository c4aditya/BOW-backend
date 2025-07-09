const express = require("express");
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const onlineAddmissionDetails = require("../controllers/onlineAddmission");

router.post(
  "/onlineAddmissionDetails",
  upload.fields([
    { name: 'tenthFile', maxCount: 1 },
    { name: 'twelfthFile', maxCount: 1 },
    { name: 'graduationFile', maxCount: 1 },
    { name: 'postGraduationFile', maxCount: 1 }
  ]),
  onlineAddmissionDetails
);

module.exports = router;

