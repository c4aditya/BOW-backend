const courseDetails = require("../model/courseDetails");
const sendMail = require("../email/email");

const name = "Course Application";

async function createCourseDetails(req, res) {
    try {
        const { fullName, fatherName, email, mobileno, altno, dateTime, gender, qualification, aadhaarNo, course, houseNo, city, locality, state, pincode, District } = req.body;

        const response = await courseDetails.create({
            fullName, fatherName, email, mobileno, altno, dateTime, gender, qualification,
            aadhaarNo, course, houseNo, city, locality, state, pincode, District
        });

        const emailContent = `You have received a new ${name}:
            Name: ${fullName}
            Father's Name: ${fatherName}
            Email: ${email}
            Mobile No: ${mobileno}
            Alternate No: ${altno}
            Date & Time: ${dateTime}
            Gender: ${gender}
            Qualification: ${qualification}
            Aadhaar No: ${aadhaarNo}
            Course: ${course}
            Address: ${houseNo}, ${locality}, ${city}, ${District}, ${state} - ${pincode}
        `;

        try {
            await sendMail({
                to: "singhas1418@gmail.com",
                subject: "New Course Application",
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
            message: "There was an error while saving the data to the database",
            error: error.message
        });
    }
}

module.exports = createCourseDetails;
