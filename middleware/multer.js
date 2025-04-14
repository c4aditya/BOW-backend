const onlineAddmissionContoller = require("../model/onlneaddmission");
const sendMail = require("../email/email");
const path = require("path");

async function onlineAddmission(req, res) {
    try {
        const {
            firstName, lastName, fatherName, email,
            mobno, gender, course, qualification,
            address, pincode
        } = req.body;

        // 🧾 Safe logging
        console.log("📂 req.files:", req.files);

        // ✅ Create database entry with file info (optional: store filenames only)
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
            tenthFile: req.files?.tenthFile?.[0]?.filename || null,
            twelfthFile: req.files?.twelfthFile?.[0]?.filename || null,
            graduationFile: req.files?.graduationFile?.[0]?.filename || null,
            postGraduationFile: req.files?.postGraduationFile?.[0]?.filename || null,
        });

        // ✉️ Email content
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

        // 📎 Email attachments (if any)
        const attachments = [];

        const addAttachment = (fileField) => {
            const file = req.files?.[fileField]?.[0];
            if (file) {
                attachments.push({
                    filename: file.originalname,
                    path: path.resolve(file.path)
                });
            }
        };

        // ✅ Add each file if present
        ["tenthFile", "twelfthFile", "graduationFile", "postGraduationFile"].forEach(addAttachment);

        console.log("📎 Attachments sending in email:", attachments);

        // ✉️ Send email
        try {
            await sendMail({
                to: "singhas1418@gmail.com",
                subject: "New Online Admission Received",
                text: emailContent,
                attachments
            });

            return res.status(200).json({
                success: true,
                message: "Database entry created successfully and email sent to admin."
            });

        } catch (emailError) {
            console.error("❌ Error while sending email:", emailError);

            return res.status(500).json({
                success: false,
                message: "Email failed: " + emailError.message
            });
        }

    } catch (error) {
        console.error("❌ Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: "There was an error while saving the data to the database",
            error: error.message
        });
    }
}

module.exports = onlineAddmission;
