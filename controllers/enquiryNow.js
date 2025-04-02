const enquireNow = require("../model/enquiryNow");
const sendMail = require("../email/email")

const name ="Enquiry"
async function enquiryDetails(req, res) {
    try {
        const { firstName, lastName, email, number, gender, course, message } = req.body;

        const existingEmail = await enquireNow.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        const response = await enquireNow.create({ firstName, lastName, email, number, gender, course, message });

     

        const emailContent =
            `You have recive an new ${name}:
            Name:${firstName} ${lastName}
            Emial:${email}
            Phone No:${number}
            Gender :${gender}
            Course:${course}
            Message:${message}

            `

            // sending an email 

            try{
                await sendMail ({
                    to:"singhas1418@gmail.com",
                    subject:"New Enquiry Data",
                    text:emailContent
                });

                res.status(200).json({
                    success:true,
                    message:"The email is send to the admin"
                })


            }

            catch(emailerror){
                console.log("Geeting Error While sending an mail ")

                res.status(500).json({
                    success:false,
                    message:emailerror.message
                })
            }
            
       

    

   

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = enquiryDetails;
