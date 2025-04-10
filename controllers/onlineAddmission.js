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

        // ✅ Create new admission with file paths
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
            tenthFile: req.files?.tenthFile?.[0]?.path || null,
            twelfthFile: req.files?.twelfthFile?.[0]?.path || null,
            graduationFile: req.files?.graduationFile?.[0]?.path || null,
            postGraduationFile: req.files?.postGraduationFile?.[0]?.path || null
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

        if (req.files) {
            if (req.files.tenthFile) {
                attachments.push({
                    filename: req.files.tenthFile[0].originalname,
                    path: path.resolve(req.files.tenthFile[0].path)
                });
            }
            if (req.files.twelfthFile) {
                attachments.push({
                    filename: req.files.twelfthFile[0].originalname,
                    path: path.resolve(req.files.twelfthFile[0].path)
                });
            }
            if (req.files.graduationFile) {
                attachments.push({
                    filename: req.files.graduationFile[0].originalname,
                    path: path.resolve(req.files.graduationFile[0].path)
                });
            }
            if (req.files.postGraduationFile) {
                attachments.push({
                    filename: req.files.postGraduationFile[0].originalname,
                    path: path.resolve(req.files.postGraduationFile[0].path)
                });
            }
        }

        console.log("📎 Attachments sending in email:", attachments);
        console.log("REQ.FILES:", req.files);


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
            console.log("❌ Error while sending email:", emailError);

            res.status(500).json({
                success: false,
                message: emailError.message
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "There was an error while saving the data to the database",
            error: error.message
        });
    }
}

module.exports = onlineAddmission;
