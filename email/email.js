const nodemailer = require("nodemailer");

async function sendMail({ to, subject, text }) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "singhas1418@gmail.com",
                pass: "ctlr sgfh mkae yfmd"
            }
        });

        const mailOptions = {
            from: "singhas1418@gmail.com",
            to,
            subject,
            text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
        return info;

    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

module.exports = sendMail;
