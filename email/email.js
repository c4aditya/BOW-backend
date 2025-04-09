const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

async function sendMail({ to, subject, text, attachments = [] }) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "singhas1418@gmail.com",
                pass: "oect pmfd mcdf oeyd"
            }
        });

        const preparedAttachments = attachments
            .filter(file => fs.existsSync(file)) // ✅ Check file exists
            .map(file => ({
                filename: path.basename(file),
                path: file,
                contentType: getMimeType(file) // ✅ Add contentType
            }));

        const mailOptions = {
            from: "singhas1418@gmail.com",
            to,
            subject,
            text,
            attachments: preparedAttachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
        return info;

    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

// Utility: Guess mime type
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".pdf":
            return "application/pdf";
        default:
            return "application/octet-stream";
    }
}

module.exports = sendMail;
