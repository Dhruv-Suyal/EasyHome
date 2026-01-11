const booking = require('../models/booking');
const sendMail = require('../utils/sendMail');
const Home = require('../models/data');
const instance = require('../utils/razorpay');

module.exports = async function autoCancelBookings(){
    console.log("Comes to the autoCancel");
    let bookings = await booking.find({status: 'Pending'}).populate('home').populate('user');
    let now = new Date();

    for(const b of bookings){
        const hoursToCheckIn = (b.checkInDate.getTime() - now.getTime())/(1000 * 60 * 60);
        const hoursSinceBooking = (now.getTime() - b.createdAt.getTime())/(1000 * 60 * 60);
        let shouldCancel = false;
    
        if(hoursToCheckIn <= 6){
            shouldCancel = true;
        }
        else if(hoursToCheckIn > 24 && hoursSinceBooking >= 30){
            shouldCancel = true;
        }
    
        if(shouldCancel){
            b.status = 'Cancelled';
            if(b.paymentStatus === 'Paid'){
            // Process refund via Razorpay
                const refund = await instance.payments.refund(b.paymentId, {
                    amount: Math.round(b.totalPrice * 100),
                    speed: 'normal',
                });
                b.refundId = refund.id;
                b.paymentStatus = 'Refunded';
            }
            await b.save();
            if(b.home){
                b.home.cancellationCount = b.home.cancellationCount + 1;
                b.home.ratings = Math.max(0.5, b.home.ratings-0.2);
                await b.home.save();
            }
            await sendMail({
                to: b.email || b.user.email,
                subject: `Reminder: Your booking at ${b.home.houseName} is Cancelled!`,
                html: `<div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:20px;">
                            <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:24px;">
        
                                <h2 style="color:#ff5a5f; margin-top:0;">
                                    Host didn't response to your booking! Try again later
                                </h2>
    
                            <p style="color:#333; font-size:15px;">
                            Hi <b>${b.name || b.user.username}</b>,
                            </p>
    
                            <p style="color:#555; font-size:14px;">
                             Your stay at<b>${b.home.houseName}</b> is Cancelled.
                            </p>
    
                            <div style="background:#fafafa; border-radius:6px; padding:14px; margin:16px 0;">
                            <p style="margin:0; font-size:14px;">
                                <b>Check-in:</b> ${b.checkInDate}<br/>
                                <b>Check-out:</b> ${b.checkOutDate}<br/>
                                <b>Guests:</b> ${b.numberOfPeople}
                            </p>
                            </div>
    
                            <p>
                                A refund of <b>₹${b.totalPrice}</b> has been initiated to your original payment method.
                            </p>
    
                            <ul>
                                <li>Payment ID: <b>${b.paymentId}</b></li>
                                <li>Refund ID: <b>${b.refundId}</b></li>
                            </ul>
    
                            <p style="font-size:13px; color:#777;">
                                It may take 3–7 business days to reflect depending on your bank.
                            </p>
    
                            <p>
                                We sincerely apologize for the inconvenience caused.
                            </p>
    
                            <p style="font-size:12px; color:#999; margin-top:20px;">
                            — EasyHome Team
                            </p>
                        </div>
                        </div>`
            })
            console.log("AutoCancel some Bookings")
    
        }
    }
}