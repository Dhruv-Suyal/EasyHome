const {google} = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const OAuth2Client = new OAuth2(
    process.env.Google_Client_ID,
    process.env.Google_Client_Secret,
    "https://developers.google.com/oauthplayground"
);

OAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
})

const sendMail = async ({to, subject, html})=>{
    try{
    console.log("sendMail called with:", { to, subject });
    if (!to) {
     throw new Error("Receiver email (to) is missing");
    }
    const gmail = google.gmail({
        version:"v1",
        auth: OAuth2Client
    })
    const messageParts = [
        `From: "EasyHome" <${process.env.MAIL_USER}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "",
        html
    ]
    const message = messageParts.join("\n");
    const encodedMsg = Buffer.from(message).toString("base64url");

    await gmail.users.messages.send({
        userId: "me",
        requestBody:{
            raw:encodedMsg
        }
    });

    console.log("✅ Mail sent successfully via Gmail HTTP API");

    }catch (err) {
    console.error("Mail error:", err.message);
    throw err;
  }
}

module.exports = sendMail;