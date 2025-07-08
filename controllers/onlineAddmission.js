const onlineAddmissionContoller = require("../model/onlneaddmission");
const path = require("path");

async function onlineAddmission(req, res) {
    try {
        const {
            firstName, lastName, fatherName, email,
            mobno, gender, course, qualification,
            address, pincode
        } = req.body;

        // ✅ Safely extract files
        const tenth = req.files?.tenthFile?.[0] || null;
        const twelfth = req.files?.twelfthFile?.[0] || null;
        const graduation = req.files?.graduationFile?.[0] || null;
        const postGraduation = req.files?.postGraduationFile?.[0] || null;

        // ✅ Create new admission entry
        const response = await onlineAddmissionContoller.create({
            firstName,
            lastName,
            fatherName,
            email,
            mobno,
            gender,
            course,
            qualification,
            address,
            pincode,
            tenthFile: tenth?.path || null,
            twelfthFile: twelfth?.path || null,
            graduationFile: graduation?.path || null,
            postGraduationFile: postGraduation?.path || null,
        });

        // ✅ (Optional) Attachments array bana sakte hain future use ke liye
        // const attachments = [];
        // if (tenth) attachments.push({ filename: tenth.originalname, path: path.resolve(tenth.path) });
        // if (twelfth) attachments.push({ filename: twelfth.originalname, path: path.resolve(twelfth.path) });
        // if (graduation) attachments.push({ filename: graduation.originalname, path: path.resolve(graduation.path) });
        // if (postGraduation) attachments.push({ filename: postGraduation.originalname, path: path.resolve(postGraduation.path) });

        res.status(200).json({
            success: true,
            message: "Database entry created successfully."
        });

    } catch (error) {
        console.error("Error in onlineAddmission:", error);
        res.status(500).json({
            success: false,
            message: "There was an error while saving the data to the database.",
            error: error.message
        });
    }
}

module.exports = onlineAddmission;
