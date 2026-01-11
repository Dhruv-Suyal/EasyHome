const booking = require('../models/booking');
const sendMail = require('../utils/sendMail');
const Home = require('../models/data');
const instance = require('../utils/razorpay');


module.exports = async function sendBookingReminder(){
    console.log("sendBookingReminder function run...")

const sameDay = (date1, date2)=>{
    return(
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

const sameOrAfterDay = (a, b) => {
  const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return d1 >= d2;
};


const today = new Date();
const tommorrow = new Date(today);
tommorrow.setDate(tommorrow.getDate() +1);
const twoDayLater = new Date(today);
twoDayLater.setDate(twoDayLater.getDate() +2);

const bookings = await booking.find({status: {$in: ['Confirmed', 'checkedIn']} }).populate({path: 'home', populate: {path: 'host'}}).populate('user');

    for( const b of bookings){
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);

        // 2 day reminder
        if(sameDay(checkIn, twoDayLater) && !b.twoDayReminderSent){
            await sendMail({
                to: b.email || b.user.email,
                subject: `Reminder: Your booking at ${b.home.houseName} is in 2 days!`,
                html: `<div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:20px;">
                         <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:24px;">
    
                            <h2 style="color:#ff5a5f; margin-top:0;">
                                Upcoming Stay Reminder
                            </h2>

                        <p style="color:#333; font-size:15px;">
                        Hi <b>${b.name || b.user.username}</b>,
                        </p>

                        <p style="color:#555; font-size:14px;">
                        Just a reminder that your stay at <b>${b.home.houseName}</b> begins in <b>2 days</b>.
                        </p>

                        <div style="background:#fafafa; border-radius:6px; padding:14px; margin:16px 0;">
                        <p style="margin:0; font-size:14px;">
                            <b>Check-in:</b> ${b.checkInDate}<br/>
                            <b>Check-out:</b> ${b.checkOutDate}<br/>
                            <b>Guests:</b> ${b.numberOfPeople}
                        </p>
                        </div>

                        <p style="font-size:12px; color:#999; margin-top:20px;">
                        — EasyHome Team
                        </p>
                    </div>
                    </div>`
            })

            if(b.home.host.email){
                await sendMail({
                to: b.home.host.email,
                subject: `Reminder: Guest ${b.name || b.user.username} is arriving in 2 days!`,
                html: `<div style="font-family: Arial, sans-serif; padding:20px;">
                        <h2 style="color:#ff5a5f;">Upcoming Guest Arrival</h2>

                        <p style="font-size:14px;">
                            Hello <b>${b.home.host.username ? b.home.host.username : 'Sir'}</b>,
                        </p>

                        <p style="font-size:14px;">
                            A guest will be checking in at your property <b>${b.home.houseName ? b.home.houseName : ''}</b> in 2 days.
                        </p>

                        <p style="font-size:14px;">
                            <b>Guest:</b> ${b.name || b.user.username}<br/>
                            <b>Check-in:</b> ${b.checkInDate}<br/>
                            <b>Check-out:</b> ${b.checkOutDate}<br/>
                        </p>

                        <p style="font-size:12px; color:#888;">
                            Please ensure the property is ready for arrival.
                        </p>
                        </div>`
                })
            }
        b.twoDayReminderSent = true;
        await b.save();
        console.log("Two days reminder send successfully");
        }
        
        // 1 day reminder
        if(sameDay(checkIn, tommorrow) && !b.oneDayReminderSent){
            await sendMail({
                to: b.email || b.user.email,
                subject: `Reminder: Your booking at ${b.home.houseName ? b.home.houseName : ''} is tomorrow!`,
                html: `<div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:20px;">
                        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:24px;">
                            
                            <h2 style="color:#28a745;">
                            Your Check-in Is Tomorrow
                            </h2>

                            <p style="font-size:15px;">
                            Hi <b>${b.name || b.user.username}</b>,
                            </p>

                            <p style="font-size:14px; color:#555;">
                            Your stay at <b>${b.home.houseName ? b.home.houseName : ''}</b> begins tomorrow. We hope you’re excited!
                            </p>

                            <div style="background:#fafafa; padding:14px; border-radius:6px; margin:16px 0;">
                            <p style="margin:0; font-size:14px;">
                                <b>Check-in Date:</b> ${b.checkInDate}<br/>
                                <b>Guests:</b> ${b.numberOfPeople}
                            </p>
                            </div>

                            <p style="font-size:13px; color:#666;">
                            Please coordinate with the host for check-in instructions.
                            </p>

                            <p style="font-size:12px; color:#999;">
                            — EasyHome Team
                            </p>

                        </div>
                        </div>`
            })
        
            if(b.home.host.email){
                await sendMail({
                    to: b.home.host.email,
                    subject: `Reminder: Guest ${b.name || b.user.username} is arriving tomorrow!`,
                    html: `<div style="font-family: Arial, sans-serif; padding:20px;">
                            <h2 style="color:#28a745;">Guest Check-in Tomorrow</h2>

                            <p>
                                Hi <b>${b.home.host.username ? b.home.host.username : 'Sir'}</b>,
                            </p>

                            <p>
                                Your guest <b>${b.name || b.user.username}</b> will be checking in tomorrow at <b>${b.home.houseName}</b>.
                            </p>

                            <p>
                                <b>Check-in:</b> ${b.checkInDate}
                            </p>

                            <p style="font-size:12px; color:#888;">
                                Please be ready to welcome the guest.
                            </p>
                            </div>`
                })
            }
            b.oneDayReminderSent = true;
            await b.save();
            console.log("one days reminder send successfully");

    }

    if(sameOrAfterDay(checkOut, today) && !b.checkOutMailSent){
        if(b.email || b.user.email){
        await sendMail({
            to: b.email || b.user.email,
            subject: `Thank you for staying with EasyHome!`,
            html: `<div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:20px;">
                    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:24px;">
                        
                        <h2 style="color:#1890ff;">
                        Stay Completed
                        </h2>

                        <p>
                        Hi <b>${b.name || b.user.username}</b>,
                        </p>

                        <p style="font-size:14px; color:#555;">
                        Your stay at <b>${b.home.houseName}</b> has been successfully completed.
                        </p>

                        <p style="font-size:14px;">
                        We hope you had a great experience and would love to host you again!
                        </p>

                        <p style="font-size:12px; color:#999;">
                        Thank you for choosing EasyHome.
                        </p>

                    </div>
                    </div>`
        })
        }

        if(b.home.host.email){
            await sendMail({
                to: b.home.host.email,
                subject:"Booking completed",
                html: `<div style="font-family: Arial, sans-serif; padding:20px;">
                        <h2 style="color:#1890ff;">Booking Completed</h2>

                        <p>
                            Hi <b>${b.home.host.username ? b.home.host.username : 'Sir'}</b>,
                        </p>

                        <p>
                            The booking at <b>${b.home.houseName }</b> has been completed successfully.
                        </p>

                        <p style="font-size:12px; color:#888;">
                            The dates are now available for new bookings.
                        </p>
                        </div>`
            })
        }
        b.checkOutMailSent = true;
        b.status = 'Completed';
        await b.save();
        console.log("Booking completed successfully and mail sent....");

    }
}
}