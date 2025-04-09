const onlineAddmissionContoller = require("../model/onlneaddmission");
const sendMail = require("../email/email");
const path = require("path");

async function onlineAddmission(req, res) {
      
    try {
        const { firstName, lastName, fatherName, email, mobno, gender, course, qualification, address, pincode } = req.body;

        const response = await onlineAddmissionContoller.create({
            firstName, lastName, fatherName, email, mobno, gender, course, qualification, address, pincode
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

        // 🔥 Attach file paths using absolute path
        const attachments = [];
        if (req.files) {
            if (req.files.tenthFile) {
                attachments.push(path.join(__dirname, "..", req.files.tenthFile[0].path));
            }
            if (req.files.twelfthFile) {
                attachments.push(path.join(__dirname, "..", req.files.twelfthFile[0].path));
            }
            if (req.files.graduationFile) {
                attachments.push(path.join(__dirname, "..", req.files.graduationFile[0].path));
            }
            if (req.files.postGraduationFile) {
                attachments.push(path.join(__dirname, "..", req.files.postGraduationFile[0].path));
            }
        }

        console.log("Attachments sending in email:", attachments); // Debug

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
            console.log("Error while sending email:", emailError);

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
