const nodemailer = require('nodemailer');

const sendMail = async ({to, subject, html})=>{
    console.log("sendMail called with:", { to, subject });

    if (!to) {
     throw new Error("Receiver email (to) is missing");
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
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