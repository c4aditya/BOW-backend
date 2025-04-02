const certificate = require("../model/certificate");
const sendMail = require("../email/email");

async function certificatemodel(req, res) {
    try {
        const { name, fatherName, enrollmentNumber, email, contactNumber } = req.body;

        const response = await certificate.create({ name, fatherName, enrollmentNumber, email, contactNumber });

        const emailContent = `You have received a new Certificate Request:
            Name: ${name}
            Father's Name: ${fatherName}
            Enrollment Number: ${enrollmentNumber}
            Email: ${email}
            Contact Number: ${contactNumber}
        `;

        try {
            await sendMail({
                to: "singhas1418@gmail.com",
                subject: "New Certificate Request",
                text: emailContent
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
            message: error.message
        });
    }
}

module.exports = certificatemodel;
