const { check, validationResult } = require("express-validator");
const Home = require("../models/data");
const Booking = require("../models/booking");
const instance = require("../utils/razorpay");
const sendMail = require("../utils/sendMail");
const QRCode = require('qrcode');

exports.addHome = (req, res, next)=>{
    if(!req.isLoggedIn){
        return res.redirect('/login');
    }
    res.render('host/addHome', {error: [], pageTittle:'Edit Home', currentPage: 'addHome', editing: false, change: false, isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.editHome = (req, res, next)=>{
    if(!req.isLoggedIn){
        return res.redirect('/login');
    }
    const homeId = req.params.homeId;
    const editing = req.query.editing === 'true';
   Home.findById(homeId).then((home)=>{
    if(!home){
        console.log("Home not find");
        res.redirect("/host/home-list");
    }
    else{
        // const house = new Home(home.id, home.houseName, home.location, home.price, home.photoUrl);
        // house.save();
        res.render('host/addHome', {Home: home, error: [], pageTittle:'addHome', currentPage: 'addHome', editing: editing, change:false, isLoggedIn:req.isLoggedIn, user: req.session.user});
    }
   })
}

exports.postEditHome = [
        check('homeName')
    .isLength({min: 3})
    .withMessage('Home name must be at least 3 characters long'),

    check('location')
    .isLength({min: 3})
    .withMessage('Location must be at least 3 characters long'),

    check('pricePerNight')
    .isFloat()
    .withMessage('Price must be a number'),

    check('description')
    .isLength({min: 12, max:400})
    .withMessage('Description must be between 12 and 400 characters long'),

    check('bedrooms')
    .isInt({min:1, max:10})
    .withMessage('Wrong number of bedrooms'),

    check('bathrooms')
    .isInt({min:1, max:10})
    .withMessage('Wrong number of bathrooms'),

    check('squareFt')
    .isInt({min:100, max:10000})
    .withMessage('Wrong square ft size'),

    (req, res, next)=>{
        if(!req.isLoggedIn){
            return res.redirect('/login');
        }
        console.log(req.body.id);
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).render(
            'host/addHome', {
                Home:{
                    _id:req.body.id, houseName:req.body.homeName, location:req.body.location, price:req.body.pricePerNight, description: req.body.description, bedrooms: req.body.bedrooms, bathrooms: req.body.bathrooms, squareFt:req.body.squareFt, photoUrl: req.file ? req.file.path : null
                },
                error: errors.array().map(err => err.msg),
                pageTittle:'addHome', currentPage: 'addHome', editing:true, change:false, isLoggedIn:req.isLoggedIn, user: req.session.user}
        )
        }
        Home.findById(req.body.id).then((home)=>{
        home.houseName = req.body.homeName;
        home.location = req.body.location;
        home.price = req.body.pricePerNight;
        home.description = req.body.description;
        home.bedrooms = req.body.bedrooms;
        home.bathrooms = req.body.bathrooms;
        home.squareFt = req.body.squareFt;
        if(req.file){
            home.photoUrl = req.file.path
        }
        home.save().then((result)=>{
            console.log('Home update Successfully', result);
        }).catch((err)=>{
            console.log('Error while updating home', err);
        })
    res.redirect("/host/home-list");
    }).catch((err)=>{
        console.log('Error while finding home', err);
    })
    }
]

exports.postDeleteHome = (req, res, next)=>{
    if(!req.isLoggedIn){
        return res.redirect('/login');
    }
    const homeId = req.params.homeId;
    Home.findByIdAndDelete(homeId).then((result)=>{
            console.log("Home deleted succesfully", result);
            res.redirect("/host/home-list");
        }).catch((err)=>{
            console.log("Error while deleting", err);

        })
}

exports.sumbitHome = [ 
    check('homeName')
    .isLength({min: 3})
    .withMessage('Home name must be at least 3 characters long'),

    check('location')
    .isLength({min: 3})
    .withMessage('Location must be at least 3 characters long'),

    check('pricePerNight')
    .isFloat()
    .withMessage('Price must be a number'),

    check('description')
    .isLength({min: 12, max:1000})
    .withMessage('Description must be between 12 and 400 characters long'),

    check('bedrooms')
    .isInt({min:1, max:10})
    .withMessage('Wrong number of bedrooms'),

    check('bathrooms')
    .isInt({min:1, max:10})
    .withMessage('Wrong number of bathrooms'),

    check('squareFt')
    .isInt({min:100, max:10000})
    .withMessage('Wrong square ft size'),

    check('photoUrl')
    .custom((value, {req})=>{
        if(!req.file){
            throw new Error('Please upload a image file');
        }
        return true;
    }),

    (req, res, next)=>{
        if(!req.isLoggedIn){
            return res.redirect('/login');
        }
        console.log(req.file);
        const {homeName, pricePerNight, location, description, bedrooms, bathrooms, squareFt} = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).render(
                'host/addHome', {
                    error: errors.array().map(err => err.msg),
                    Home:{houseName:homeName, location:location, price: pricePerNight, description: description, bedrooms: bedrooms, bathrooms: bathrooms, squareFt:squareFt},
                    pageTittle:'addHome', currentPage: 'addHome', editing: false, change: true, isLoggedIn:req.isLoggedIn, user: req.session.user}
            )
        }
        const home = new Home({houseName:homeName, location:location, price: pricePerNight, description: description, bedrooms: bedrooms, bathrooms: bathrooms, squareFt:squareFt, photoUrl:req.file ? req.file.path: null, host: req.session.user._id});
        home.save().then(()=>{
            console.log('Home update Successfully');
            res.redirect("/host/home-list");
        });
}
];

exports.hostHomeList =(req, res, next)=>{
    if(!req.isLoggedIn){
        return res.redirect('/login');
    }
    Home.find({host: req.session.user._id}).sort({createdAt: -1}).
    then((registeredHome)=>{
         res.render('host/host-home-list', {registeredHome:registeredHome, pageTittle:'Host home List', currentPage:'host-home-list', isLoggedIn:req.isLoggedIn, user: req.session.user});
    });
}

exports.getMyBookings = async (req, res, next)=>{
    console.log("Get my bookings");
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    }
    const userId = req.session.user._id;
    const hostMsg =req.session.hostMsg|| null;
    req.session.hostMsg = null;
    const homes = await Home.find({host: userId}).sort({createdAt: -1});
        if (homes.length === 0) {
            return res.render('host/host-bookings', {
                bookings: [],
                hostMsg: hostMsg,
                pageTittle: 'Home Bookings',
                currentPage: 'mybooking',
                isLoggedIn: req.isLoggedIn,
                user: req.session.user
            });
        }
        const homeId = homes.map(home => home._id);
        let bookings = await Booking.find({home: {$in: homeId}, status: { $in: ["Pending", "Confirmed", "checkedIn"] } }).populate('user').populate('home').sort({createdAt: -1});
        const now = new Date();
        bookings = bookings.map((b)=>{
            const obj = b.toObject();
            console.log(obj.checkInDate)
            obj.cancellable = obj.checkInDate > now;
            console.log(obj.cancellable);

            return obj;
        })
        console.log(bookings.checkInDate, now);
        console.log("HostMsg:",hostMsg);
        return res.render('host/host-bookings', {bookings: bookings, hostMsg: hostMsg, pageTittle:'Home Bookings', currentPage:'mybooking', isLoggedIn:req.isLoggedIn, user: req.session.user});
}


exports.postConfirmBookings = async (req, res, next)=>{
    const bookingId = req.params.bookingId;

    const booking = await Booking.findById(bookingId).populate('home').populate('user');
    const user = req.session.user;
    if(!booking){
        return res.redirect('/host/mybookings');
    }
    if(booking.status === 'Confirmed' || booking.status === 'Cancelled' || booking.status === 'Completed' || booking.status === 'checkedIn'){
        return res.redirect('/host/mybookings');
    }
    const now = new Date();
    if(now >= booking.checkInDate){
        console.log("Cannot confirm booking after check-in date");
        return res.redirect('/host/mybookings');
    }

    booking.status = 'Confirmed';
    let currentRating = booking.home.ratings || 1;

    // increase rating slightly (example +0.2)
    const increased = currentRating + 0.2;

    // clamp value between 1 and 5
    booking.home.ratings = Math.min(5, increased);

     booking.checkInOtp = Math.floor(100000 + Math.random() * 900000);

     const dataToEncode = `${booking._id}|${booking.checkInOtp}`;
        // Generate QR code as Data URL
    booking.qrcode = await QRCode.toDataURL(dataToEncode);

    await booking.save();
    await booking.home.save();
    req.session.hostMsg = "Booking successfully Confirmed";

    if(booking.email || booking.user.email){
    await sendMail({
      to: booking.email || booking.user.email,
      subject: "Your booking was confirmed 🎉",
      html: `
        <h2>Your Booking is Confirmed 🎉</h2>

        <p>Hi <b>${booking.user.username || booking.name}</b>,</p>

        <p>Your booking for <b>${booking.home.houseName}</b> has been confirmed by the host.</p>

        <div style="background:#f6f6f6;padding:12px;border-radius:6px;">
            <p><b>Check-in:</b> ${booking.checkInDate.toDateString()}</p>
            <p><b>Check-out:</b> ${booking.checkOutDate.toDateString()}</p>
            <p><b>Guests:</b> ${booking.numberOfPeople}</p>
            <p>Your Check-in OTP:</p>
            <h2><b>${ booking.checkInOtp }</b></h2>
            <p>OR scan this QR at the property:</p>
            <img src="${ booking.qrcode }" width="180" alt="QR Code"/>
        </div>

        <p>We look forward to hosting you!</p>

        <p>– EasyHome Team</p>
      `
    });
    }
    return res.redirect('/host/mybookings');
}

exports.HostBookingDetails = async (req, res, next)=>{
    const user = req.session.user;
    if(!user || user.userType != 'host'){
        return res.redirect('/');
    }
    const bookingId = req.params.bookingId;
    const booking = await Booking.findOne({_id: bookingId}).populate('home').populate('user');
    if(!booking){
        return res.redirect('/host/mybookings');
    }
    const otpMsg = req.session.otpMsg || null;
    req.session.otpMsg = null;
    res.render('host/booking-details', {booking:booking, otpMsg:otpMsg, pageTittle:'Home Bookings', currentPage:'mybooking', isLoggedIn:req.isLoggedIn, user: req.session.user})
}

exports.VerifyGuestQr = async (req, res, next)=>{
    try{
        const {data, bookingId} = req.body;
        console.log(data);
        const [scannedBookingId, scannedOtp] = data.split("|");

        if (!scannedBookingId || !scannedOtp) {
            return res.json({ success: false, message: "Invalid QR format" });
        }

        const booking = await Booking.findOne({_id: bookingId});

        if(!booking){
             return res.json({ success: false, message: "Invalid booking" });
        }
        if(booking.checkInOtp !== scannedOtp){
             return res.json({ success: false, message: "Did Not Match" });
        }
        if(booking.status === 'checkedIn'){
            return res.json({ success: false, message: "Already CheckedIn" });
        }
        const today = new Date();
        const checkIn = new Date(booking.checkInDate);

        // strip time
        today.setHours(0,0,0,0);
        checkIn.setHours(0,0,0,0);

        if(today.getTime() !== checkIn.getTime()){
            return res.json({success:false, message:'Today is not Check-In Date'});
        }

        booking.status = 'checkedIn';
        booking.checkInAt = now;
        await booking.save();
        return res.json({success:true});
    }catch(e){
        console.log(e);
        res.json({success:false, message:'Invalid QR'});
    }
}

exports.VerifyGuestOtp = async (req, res, next)=>{
    const bookingId = req.params.bookingId;
    console.log(req.body)
    const {otp} = req.body;
    const booking = await Booking.findOne({_id: bookingId});
    if(!booking){
        req.session.otpMsg = 'Booking Not Found';
        return res.redirect(`/host/bookingDetails/${bookingId}`);
    }
    if(booking.checkInOtp!=otp){
        req.session.otpMsg = 'Wrong Otp! Retry'
        return res.redirect(`/host/bookingDetails/${bookingId}`);

    }
    if(booking.status === 'checkedIn'){
        req.session.otpMsg = 'Already CheckedIn'
        return res.redirect(`/host/bookingDetails/${bookingId}`);
    }
    const today = new Date();
    const checkIn = new Date(booking.checkInDate);

    // strip time
    today.setHours(0,0,0,0);
    checkIn.setHours(0,0,0,0);

    if(today.getTime() !== checkIn.getTime()){
        req.session.otpMsg = 'Today is not Check-In Date';
        return res.redirect(`/host/bookingDetails/${bookingId}`);
    }
    booking.status = 'checkedIn';
    booking.checkInAt = today;
    await booking.save();
    req.session.otpMsg = 'Otp Verified! Guest Successfully CheckIn';
   return res.redirect(`/host/bookingDetails/${bookingId}`);
}

exports.postCancel = async (req, res, next)=>{
    const bookingId = req.params.bookingId;
    const booking = await Booking.findOne({_id: bookingId}).populate('home').populate('user');
    const home = await Home.findById(booking.home._id).populate('host');
    const user = req.session.user;
    if(!booking){
        console.log("Booking not found");
        return res.redirect('/host/mybookings');
    }
    if(booking.status === 'Cancelled' || booking.status === 'Completed'){
        console.log("Booking already cancelled or completed");
        return res.redirect('/host/mybookings');
    }
    const now = new Date();
    if(now >= booking.checkInDate){
        console.log("Cannot cancel booking after check-in date");
        return res.redirect('/host/mybookings');
    }
    let cancelUserEmail = ``;
    if(booking.paymentStatus === 'Paid' || booking.paymentId){
        // Process refund logic here
        const refund = await instance.payments.refund(booking.paymentId, { amount: booking.totalPrice * 100});
        booking.paymentStatus = 'Refunded';
        booking.refundId = refund.id;

        cancelUserEmail= `<h2 style="color:#d62828;">Your Booking Was Cancelled by the Host ❌</h2>

                                <p>Hi <b>${booking.name || booking.user.username}</b>,</p>

                                <p>
                                The host has cancelled your booking for <b>${booking.home.houseName }</b>.
                                </p>

                                <div style="background:#fafafa; padding:12px; border-radius:8px; border:1px solid #eee;">
                                <p><b>Check-in:</b> ${booking.checkInDate.toDateString()}</p>
                                <p><b>Check-out:</b> ${ booking.checkOutDate.toDateString()}</p>
                                <p><b>Guests:</b> ${booking.numberOfPeople}</p>
                                <p><b>Booking ID:</b> ${booking._id}</p>
                                </div>

                                <h3 style="color:#2a9d8f;">Refund Details 💸</h3>

                                <p>
                                A refund of <b>₹${booking.totalPrice}</b> has been initiated to your original payment method.
                                </p>

                                <ul>
                                <li>Payment ID: <b>${booking.paymentId}</b></li>
                                <li>Refund ID: <b>${booking.refundId}</b></li>
                                </ul>

                                <p style="font-size:13px; color:#777;">
                                It may take 3–7 business days to reflect depending on your bank.
                                </p>

                                <p>
                                We sincerely apologize for the inconvenience caused.
                                </p>

                                <p>
                                Warm regards,<br>
                                <b>EasyHome Team</b>
                                </p>`;
    }
    else{
        cancelUserEmail = `<h2 style="color:#d62828;">Your Booking Was Cancelled by the Host ❌</h2>

                                <p>Hi <b>${booking.name || booking.user.username}</b>,</p>

                                <p>
                                The host has cancelled your booking for <b>${booking.home.houseName }</b>.
                                </p>

                                <div style="background:#fafafa; padding:12px; border-radius:8px; border:1px solid #eee;">
                                <p><b>Check-in:</b> ${booking.checkInDate.toDateString()}</p>
                                <p><b>Check-out:</b> ${ booking.checkOutDate.toDateString()}</p>
                                <p><b>Guests:</b> ${booking.numberOfPeople}</p>
                                <p><b>Booking ID:</b> ${booking._id}</p>
                                </div>

                                <p>
                                We sincerely apologize for the inconvenience caused.
                                </p>

                                <p>
                                Warm regards,<br>
                                <b>EasyHome Team</b>
                                </p>`;
    }
    booking.status = 'Cancelled';
    home.cancellationCount += 1;
    // deduct rating per cancellation
    home.ratings = Math.max(0.5, home.ratings - 0.2);
    await booking.save();
    await home.save();
    req.session.hostMsg = "Booking successfully Cancelled";

    const cancelHostEmail = `<h2 style="color:#e76f51;">Booking Cancellation Confirmed</h2>

                                <p>Hi <b>${home.host.username || user.username}</b>,</p>

                                <p>
                                You have successfully cancelled the booking for <b>${booking.home.houseName}</b>.
                                </p>

                                <div style="background:#fafafa; padding:12px; border-radius:8px; border:1px solid #eee;">
                                <p><b>Guest:</b> ${ booking.name || booking.user.username }</p>
                                <p><b>Check-in:</b> ${booking.checkInDate.toDateString() }</p>
                                <p><b>Check-out:</b> ${booking.checkOutDate.toDateString() }</p>
                                <p><b>Booking ID:</b> ${booking._id }</p>
                                </div>

                                <p style="font-size:13px; color:#777;">
                                Please avoid frequent cancellations — repeated cancellations may affect listing performance.
                                </p>

                                <p>
                                Regards,<br>
                                <b>EasyHome Support</b>
                                </p>`
    if(booking.email || booking.user.email){
        await sendMail({
            to: booking.email,
            subject: 'Important: Your EasyHome booking was cancelled by the host',
            html: cancelUserEmail
        })
    }
    if(home.host.email || user.email){
        await sendMail({
            to: home.host.email || user.email,
            subject: 'You have cancelled a booking on EasyHome',
            html: cancelHostEmail
        })
    }
    return res.redirect('/host/mybookings');

}

