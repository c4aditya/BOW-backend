const contact = require("../model/contactus");
const sendMail = require("../email/email");

const nameC = "Contact Request";

async function contactUs(req, res) {
    try {
        const { name, email, subject, phoneno, message } = req.body;

        const responce = await contact.create({ name, email, subject, phoneno, message });
        // console.log(responce)

        const emailContent = `You have received a new ${nameC}:
            Name: ${name}
            Email: ${email}
            Phone: ${phoneno}
            Subject: ${subject}
            Message: ${message}
        `;

        try {
            await sendMail({
                to: "singhas1418@gmail.com",
                subject: `New Contact Request: ${subject}`,
                text: emailContent
            });

            res.status(200).json({
                success: true,
                message: "The email has been sent to the admin"
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

module.exports = contactUs;
