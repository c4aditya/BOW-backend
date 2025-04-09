const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

async function sendMail({ to, subject, text, attachments = [] }) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "singhas1418@gmail.com",
                pass: "oect pmfd mcdf oeyd"  // secure this in .env in real apps
            }
        });

        const mailOptions = {
            from: "singhas1418@gmail.com",
            to,
            subject,
            text,
            attachments: attachments.map(file => ({
                filename: path.basename(file),
                path: file
            }))
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
