const nodemailer = require('nodemailer');

const sendMail = async ({to, subject, html})=>{
    console.log("sendMail called with:", { to, subject });

    if (!to) {
     throw new Error("Receiver email (to) is missing");
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            type:"OAUTH2",
            user: process.env.MAIL_USER,
            clientId: process.env.Google_Client_ID,
            clientSecret: process.env.Google_Client_Secret,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN
        }
    });
    await transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        html
    });
}

module.exports = sendMail;