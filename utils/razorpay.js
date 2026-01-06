const Razorpay = require('razorpay');

const instance = new Razorpay({
    key_id: process.env.RazorPay_Key_ID,
    key_secret: process.env.RazorPay_Secret_Key ,
});

module.exports = instance;