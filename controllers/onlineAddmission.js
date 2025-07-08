const onlineAddmissionContoller = require("../model/onlneaddmission");
// const sendMail = require("../email/email");
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

        const emailContent = `New Online Admission Details:
        Name: ${firstName} ${lastName}
        Father's Name: ${fatherName}
        Email: ${email}
        Mobile No: ${mobno}
        Gender: ${gender}
        Course: ${course}
        Qualification: ${qualification}
        Address: ${address}, Pincode: ${pincode}
        `;

        // ✅ Prepare attachments for email
        const attachments = [];

        if (tenth) {
            attachments.push({
                filename: tenth.originalname,
                path: path.resolve(tenth.path)
            });
        }
        if (twelfth) {
            attachments.push({
                filename: twelfth.originalname,
                path: path.resolve(twelfth.path)
            });
        }
        if (graduation) {
            attachments.push({
                filename: graduation.originalname,
                path: path.resolve(graduation.path)
            });
        }
        if (postGraduation) {
            attachments.push({
                filename: postGraduation.originalname,
                path: path.resolve(postGraduation.path)
            });
        }

        console.log("📎 Attachments sending in email:", attachments);

        // ✅ Send email
        try {
            await sendMail({
                to: "singhas1418@gmail.com",
                subject: "New Online Admission Received",
                text: emailContent,
                attachments
            });

            res.status(200).json({
                success: true,
                message: "Database entry created successfully and email sent to admin."
            });

        } catch (emailError) {
            console.error("Error while sending email:", emailError);
            res.status(500).json({
                success: false,
                message: "Email sending failed.",
                error: emailError.message
            });
        }

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
