const { check, validationResult } = require("express-validator");
const Home = require("../models/data");
const user = require("../models/user");
const Booking = require("../models/booking");
const sendMail = require("../utils/sendMail");
const instance = require("../utils/razorpay");
const crypto = require("crypto");


exports.homeList =async (req, res, next)=>{
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    }
    const userId = req.session.user._id;
    const favouriteHomes = await user.findById(userId).populate("favourite").select('favourite');
    console.log(favouriteHomes);
    Home.find().sort({createdAt: -1}).then((registeredHome)=>{
         res.render('store/home-list', {registeredHome:registeredHome, favouriteHomes: favouriteHomes, pageTittle:'home List', currentPage:'home-list', isLoggedIn:req.isLoggedIn, user: req.session.user});
    });
}
exports.getbooking = async (req, res, next)=>{
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    }
    const homeId = req.params.homeId;
    const userId = req.session.user._id;

    const bookings = await Booking.find({home: homeId, status: {$in: ["Pending", "Confirmed", "checkedIn"]}}).select('checkInDate checkOutDate');
    const blocked = [];
    bookings.forEach(b =>{
        let start = new Date(b.checkInDate);
        let end = new Date(b.checkOutDate);
        end.setDate(end.getDate() + 1);
        blocked.push({from: start, to: end});
    });
    console.log(blocked);

    Home.findById(homeId).then((home)=>{
        if(!home){
            console.log("Home not found");
            return res.redirect("/");
        }
        return Booking.find({home: homeId, user: userId, status:{$in: ['Confirmed' , 'Pending']} }).then((bookings)=>{
            if(bookings.length > 0){
                return res.redirect('/Allbookings');
            }
            return  res.render('store/booking', {isBooked: false, blockedDated: JSON.stringify(blocked), error: [], oldInput: {}, home:home, pageTittle:'Booking', currentPage:'booking', isLoggedIn:req.isLoggedIn, user: req.session.user});
        });
    });
}

exports.postbooking = [
    check('name')
    .isLength({min:3})
    .withMessage('Name must be at least 3 characters long')
    .bail()
    .trim()
    .isAlpha('en-US', {ignore: ' '})
    .withMessage('Name must contain only letters and spaces'),

    check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .bail(),

    check('countryCode')
    .not().isEmpty()
    .withMessage('Country code is required')
    .bail(),

    check('phone')
    .not().isEmpty()
    .withMessage('Phone number is required')
    .bail()
    .isNumeric()
    .withMessage('Phone number must contain only numbers'),

    check('checkInDate')
    .not().isEmpty()
    .withMessage('Check-in date is required')
    .bail()
    .isISO8601()
    .withMessage('Check-in date must be a valid date'),

    check('checkOutDate')
    .not().isEmpty()
    .withMessage('Check-out date is required')
    .bail()
    .isISO8601()
    .withMessage('Check-out date must be a valid date'),

    check('numberOfPeople')
    .not().isEmpty()
    .withMessage('Number of people is required')
    .bail()
    .isInt({min:1})
    .withMessage('Number of people must be at least 1'),

    check('specialRequests')
    .trim()
    .isLength({max:500})
    .withMessage('Special requests cannot exceed 500 characters')
    
    ,async (req, res, next)=>{
        if(!req.isLoggedIn) {
            return res.redirect('/login');
        }
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const home = await Home.findById(homeId).populate("host");

    const {checkInDate, checkOutDate, numberOfPeople, totalPrice, email, countryCode, phone, specialRequests, name} = req.body;
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return renderWithErrors();
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if(checkIn >= checkOut){
        errors.errors.push({msg: 'Check-out date must be after check-in date'});
    }
    if(checkIn < new Date().setHours(0,0,0,0)){
        errors.errors.push({msg: 'Check-in date cannot be in the past'});
    }
    const existingBookings = await Booking.find({
        home: homeId,
        status: {$in: ["Pending", "Confirmed", "checkedIn"]},
        $and: [
            {checkInDate: {$lt: checkOut}},
            {checkOutDate: {$gt: checkIn}}
        ]
    });
    if(existingBookings.length > 0){
        errors.errors.push({msg: 'The selected dates are not available. Please choose different dates.'});
    }
    const duplicateBooking = await Booking.findOne({
        home: homeId,
        user: userId,
        status: {$in: ["Pending", "Confirmed", "checkedIn"]},
        checkInDate: {$lt: checkOut},
        checkOutDate: {$gt: checkIn}
    });
    if(duplicateBooking){
        errors.errors.push({msg: 'You have already made a booking for these dates.'});
    }

    if(errors.errors.length > 0){
        return renderWithErrors();
    }

    async function renderWithErrors() {
        const bookings = await Booking.find({home: homeId, status: {$in: ["Pending", "Confirmed", "checkedIn"]}}).select('checkInDate checkOutDate');
        const blocked = [];
        bookings.forEach(b =>{
            let start = new Date(b.checkInDate);
            let end = new Date(b.checkOutDate);
            end.setDate(end.getDate() + 1);
            blocked.push({from: start, to: end});
    });

        return res.status(422).render('store/booking',
             {error: errors.array().map(err => err.msg),
                blockedDated: JSON.stringify(blocked),
                oldInput: {name, checkInDate, checkOutDate, numberOfPeople, totalPrice, email, countryCode, phone, specialRequests},
             home:home, pageTittle:'Booking', currentPage:'booking', isLoggedIn:req.isLoggedIn, user: req.session.user});
    }

    const pendingBooking = {name: name, home: homeId, user: user, checkInDate: checkInDate, checkOutDate: checkOutDate, numberOfPeople: numberOfPeople, totalPrice: totalPrice, email: email, countryCode: countryCode, phoneNumber: phone, specialRequests: specialRequests};
    req.session.pendingBooking = pendingBooking;
    res.redirect('/payment');
    }
]

exports.getPaymentPage = async (req, res, next)=>{
    const user = req.session.user;
    if(!req.session.isLoggedIn){
        return res.redirect('/login');
    }
    if(!req.session.pendingBooking){
        return res.redirect('/');
    }
    const home = await Home.findById({_id: req.session.pendingBooking.home});
    if(!home){
        return res.redirect('/');
    }
    res.render('store/payment', {home: home, pendingBooking:req.session.pendingBooking, keyId:process.env.RazorPay_Key_ID, pageTittle:'Payment', currentPage:'payment', isLoggedIn:req.isLoggedIn, user: user});
}

exports.postPaymentPage = async (req, res, next)=>{
    const pendingBooking = req.session.pendingBooking;

    if (!pendingBooking) {
    return res.status(400).json({ success: false });
    }
    
    const options = {
        amount: Number(pendingBooking.totalPrice) * 100,
        currency: "INR",
        receipt: `receipt_order_${pendingBooking.checkInDate}`,
    }
    
    const order = await instance.orders.create(options);


    pendingBooking.orderId = order.id;
    pendingBooking.amount = order.amount;
    req.session.pendingBooking = pendingBooking;
    res.json({
        success: true,
        key: process.env.RazorPay_Key_ID,
        order: order
    })
}

exports.postPaymentVerify = async (req, res, next)=>{
    if (!req.session.isLoggedIn || !req.session.user) {
    return res.status(401).json({ status: false });
}   
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;
    const pendingBooking = req.session.pendingBooking;
    if (!pendingBooking) {
    return res.status(400).json({ status: false, message: "Session expired" });
    }
    if (razorpay_order_id !== pendingBooking.orderId) {
    return res.status(400).json({ status: false });
    }
    if (pendingBooking.amount !== pendingBooking.totalPrice * 100) {
    return res.status(400).json({ status: false });
    }

    const home = await Home.findById({_id: pendingBooking.home}).populate('host');
    const user = req.session.user;
    
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
                        .createHmac('sha256', process.env.RazorPay_Secret_Key)
                        .update(sign.toString())
                        .digest("hex");
    
    if(expectedSign === razorpay_signature){
        const booking = new Booking({home:home._id, user:user._id, paymentId:razorpay_payment_id, orderId:razorpay_order_id, paymentStatus:'Paid', name:pendingBooking.name, checkInDate: pendingBooking.checkInDate, checkOutDate: pendingBooking.checkOutDate, numberOfPeople: pendingBooking.numberOfPeople, totalPrice: pendingBooking.totalPrice, email: pendingBooking.email, countryCode: pendingBooking.countryCode, phoneNumber: pendingBooking.phoneNumber, specialRequests: pendingBooking.specialRequests});
        await booking.save();
        const hostEmail = home.host?.email;
        if(hostEmail) {
            await sendMail({
            to: hostEmail,
            subject: "New Booking Request",
            html: `
            <div style="font-family: Arial, sans-serif; padding: 16px;">
                <h2 style="color:#ff4d4f;">New Booking Request 🏠</h2>
                <p>Hi ${home.host.username || "Host"},</p>
                <p><b>${user.username || "Guest"}</b> has requested to book your home <b>${home.houseName}</b>.</p>
                <p>
                <b>Check-in:</b> ${pendingBooking.checkInDate}<br/>
                <b>Check-out:</b> ${pendingBooking.checkOutDate}<br/>
                <b>Guests:</b> ${pendingBooking.numberOfPeople}<br/>
                <b>Total Price:</b> ₹${pendingBooking.totalPrice}
                </p>
                <p>
                <b>Guest Contact:</b><br/>
                Name: ${user.username}<br/>
                Email: ${pendingBooking.email || user.email}<br/>
                Phone: +${pendingBooking.countryCode} ${pendingBooking.phone}
                </p>
                ${
                pendingBooking.specialRequests
                    ? `<p><b>Special Requests:</b> ${pendingBooking.specialRequests || ''}</p>`
                    : ""
                }
                <p style="margin-top:16px; font-size:12px; color:#888;">
                This request is pending your approval. Please log in to your dashboard to confirm or cancel.
                <a href="https://easyhome-production.up.railway.app/" target="_blank">View Bookings</a>
                </p>
            </div>
            `
        });
        } else {
        console.warn("⚠️ Host email not found for home:", homeId);
        }

        // ✅ SAFE USER EMAIL (form email first, fallback to session)
        const userEmail = pendingBooking.email || user.email;

        if (userEmail) {
        await sendMail({
            to: userEmail,
            subject: "Your Booking Request Was Sent",
            html: `
            <div style="font-family: Arial, sans-serif; padding: 16px;">
                <h2 style="color:#52c41a;">Booking Request Sent ✅</h2>
                <p>Hi ${pendingBooking.name || user.username},</p>
                <p>Your booking request for <b>${home.houseName}</b> has been sent to the host.</p>
                <p>
                <b>Check-in:</b> ${pendingBooking.checkInDate}<br/>
                <b>Check-out:</b> ${pendingBooking.checkOutDate}<br/>
                <b>Guests:</b> ${pendingBooking.numberOfPeople}<br/>
                <b>Total Price:</b> ₹${pendingBooking.totalPrice}
                </p>
                ${
                pendingBooking.specialRequests
                    ? `<p><b>Your special requests:</b> ${pendingBooking.specialRequests}</p>`
                    : ""
                }
                <p style="margin-top:16px; font-size:13px; color:#555;">
                The host will review your request and confirm or decline it.
                You can check the status anytime in your bookings page.
                </p>
                <p style="margin-top:16px; font-size:12px; color:#888;">
                This is an automated message from EasyHome. Please do not reply.
                </p>
            </div>
            `
        });
        await sendMail({
            to:userEmail,
            subject:"Your Booking payment done Successfully",
            html: `
            <div style="font-family: Arial, sans-serif; padding: 16px;">
                <h2 style="color:#52c41a;">Booking payment done✅</h2>
                <p>Hi ${pendingBooking.name || user.username},</p>
                <p>Your booking payment done for <b>${home.houseName}</b></p>
                <p>
                <b>Check-in:</b> ${pendingBooking.checkInDate}<br/>
                <b>Check-out:</b> ${pendingBooking.checkOutDate}<br/>
                <b>Guests:</b> ${pendingBooking.numberOfPeople}<br/>
                <b>Total Price:</b> ₹${pendingBooking.totalPrice}
                </p>
                
                <p style="margin-top:16px; font-size:13px; color:#555;">
                If you cancel the booking before 48 hours of checkIn date you get full refund.
                otherwise you didn't get your payment back.
                </p>
                <p style="margin-top:16px; font-size:12px; color:#888;">
                This is an automated message from EasyHome. Please do not reply.
                </p>
            </div>
            `
        })
        } else {
        console.warn("⚠️ User email not found in form or session.");
        }
        delete req.session.pendingBooking;
        return res.json({status: true});
    }
     return res.status(400).json({status: false});
}

exports.getAllBookings = (req, res, next)=>{
    if(!req.isLoggedIn) {  
        return  res.redirect('/login');
    }
    const userId = req.session.user._id;
    Booking.find({user: userId , status: { $in: ["Pending", "Confirmed", "checkedIn"] } }).populate('home').sort({createdAt: -1}).then((bookings)=>{
        res.render('store/All-booking', {bookings: bookings, pageTittle:'All Bookings', currentPage:'booking', isLoggedIn:req.isLoggedIn, user: req.session.user});
    }).catch(err=>{
        console.log(err);
    });
}

exports.bookingDetail = async (req, res, next)=>{
    const bookingId = req.params.bookingId;
    const booking = await Booking.findOne({_id: bookingId}).populate('home').populate('user');

    const now = new Date();
    const diffMs = booking.checkInDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    let refundable = false;
    let cancellable = false;
    if(diffHours>=48){
        refundable = true;
    }
    if(booking.checkInDate>=now){
        cancellable = true;
    }
    const refundMsg = req.session.refundMsg || null;
    req.session.refundMsg = null;
    res.render('store/Booking-detail', {pageTittle:'Booking Details',booking: booking, refundable:refundable, cancellable:cancellable, refundMsg:refundMsg, currentPage:'booking-detail', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.getFavouriteList = async (req, res, next)=>{
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    }
    const userId = req.session.user._id;
    const Fuser = await user.findById(userId).populate('favourite').sort({createdAt: -1});
        res.render('store/favourite-list', {favourites:Fuser.favourite, pageTittle:'My favourite', currentPage:'favourites', isLoggedIn:req.isLoggedIn, user: req.session.user});      
    }
    
exports.postFavouriteList = async (req, res, next)=>{
    if(!req.isLoggedIn) {   
        return res.redirect('/login');  
    }
    const homeId = req.body.homeId;
    const userId = req.session.user._id;
    const Fuser = await user.findById(userId);
    if(!Fuser.favourite.includes(homeId)){
        Fuser.favourite.push(homeId);
        await Fuser.save();
    }
     res.redirect('/favourites')
}

exports.getIndex = async (req, res, next)=>{

    const NewlyAddedHomes = await Home.find().sort({createdAt: -1}).limit(5);

    const data = await Booking.aggregate([
        {$group: {_id: "$home", bookingCount: {$sum: 1}}},
        {$sort: {bookingCount: -1}},
        {$limit: 5}
    ]);

    const MostBookedHome = await Home.populate(data, {path: '_id'});
    const map = new Map();

    MostBookedHome.forEach(item =>{
        map.set(String(item._id._id), item._id);
    })

    NewlyAddedHomes.forEach(home =>{
        if(!map.has(String(home._id))){
            map.set(String(home._id), home);
        }
    })

    const trendingHomes = Array.from(map.values()).slice(0, 10);
    const cheapHomes = await Home.find({price: {$lte: 1600}}).sort({price: 1}).limit(10);

    const hillLocation =['Manali', 'Nainital', 'Mussoorie', 'Shimla', 'Darjeeling', 'Ooty', 'Munnar', 'Kodaikanal', 'Coorg', 'Mount Abu'];
    const hillyKeyword = /(hilly| hill| mountain | Himalaya | hills | valley)/i;
    const hillyHomes = await Home.find({
        $or:[
            {location: {$in: hillLocation}},
            {houseName: {$regex: hillyKeyword}},
            {description: {$regex: hillyKeyword}}
        ]
    }).limit(10);

    res.render('store/index', {trendingHomes: trendingHomes, cheapHomes: cheapHomes, hillyHomes: hillyHomes, pageTittle:'EasyHome', currentPage:'Easyhome', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.deleteFavourite = async (req, res, next)=>{
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    }
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const Fuser = await user.findById(userId);
    if(Fuser.favourite.includes(homeId)){
        Fuser.favourite.pull(homeId);
        await Fuser.save();
    }
    res.redirect('/favourites')
    
}

exports.homeDetails = async (req, res, next)=>{
    if(!req.isLoggedIn) {   
        return res.redirect('/login');
    }
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const favouriteHomes = await user.findById(userId).populate("favourite").select('favourite');

    Home.findById(homeId).then((home)=>{
        if(!home){
            console.log("Home not found");
            res.redirect("/homes");
        }
        else{
            res.render('store/home-detail', {Home:home, favouriteHomes: favouriteHomes, pageTittle:'Home details', currentPage:'home', isLoggedIn:req.isLoggedIn, user: req.session.user});
        }
        console.log(home);
    })
}

exports.errorPage = (req, res, next)=>{
    res.render('error')
}

exports.postCancelBooking = async (req, res, next)=>{
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    } 
    const bookingId = req.params.bookingId;
    const reasonForCancellation = req.body.reasonForCancellation;
    const booking = await Booking.findOne({_id: bookingId}).populate('home');
    const home = await Home.findById(booking.home._id).populate('host');
    const userId = req.session.user._id;

        if(!booking){
            console.log("Booking not found");
            return res.redirect(`/bookingDetails/${bookingId}`);
        }   
        else{
            if (booking.bookingStatus === "Cancelled") {
            return res.redirect(`/bookingDetails/${bookingId}`);
            }
            const now = new Date();
            const diffMs = booking.checkInDate - now;
            const diffHours = diffMs / (1000 * 60 * 60);

            let refundable = false;
            let cancellable = false;

            if(diffHours>=48 && (booking.paymentStatus == 'Paid' || booking.paymentId)){
                refundable = true;
            }
            if(now < booking.checkInDate){
                cancellable = true;
            }
            if(!cancellable){
                return res.redirect(`/bookingDetails/${bookingId}`);
            }
            let refundMsg = '';
            if(refundable){
                // Process refund via Razorpay
                    const refund = await instance.payments.refund(booking.paymentId, {
                        amount: booking.totalPrice * 100,
                        speed: 'normal',
                    });
                    booking.refundId = refund.id;
                    booking.paymentStatus = 'Refunded';
                req.session.refundMsg = 'A full refund has been initiated and will be processed to your original payment method within 5-7 business days.';
                booking.status = 'Cancelled';
                await booking.save();
            }
            else{
                if(booking.paymentStatus !== 'Paid' || !booking.paymentId){
                     req.session.refundMsg = 'Successfully Cancelled the booking';
                }
                else{
                    req.session.refundMsg = 'This booking is non-refundable as per our cancellation policy. Refund only applies for cancellations made at least 48 hours before check-in.';
                }
                booking.status = 'Cancelled';
                await booking.save();
            }

            const cancelUserEmailHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;">
                
                <h2 style="color: #ff4d4f;">Booking Cancelled ❌</h2>

                <p>Hi <b>${req.session.user.name}</b>,</p>

                <p>
                    Your booking for <b>${booking.home.houseName}</b> has been successfully cancelled.
                </p>

                <div style="background:#fafafa; padding: 12px; border-radius: 6px; margin: 15px 0;">
                    <p><b>Check-in:</b> ${booking.checkInDate}</p>
                    <p><b>Check-out:</b> ${booking.checkOutDate}</p>
                    <p><b>Guests:</b> ${booking.numberOfPeople}</p>
                </div>

                    ${req.session.refundMsg}

                    <p style="font-size:13px; color:#777;">
                    If you don’t receive your refund within the expected time, reply to this email and our support team will help you.
                    </p>

                <p style="margin-top: 20px; font-size: 13px; color: #888;">
                    Thank you for using <b>EasyHome</b>.  
                    We hope to host you again soon!
                </p>

                </div>
            </div>
            `;

            const cancelHostEmailHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color:#ff4d4f;">Booking Cancelled by Guest</h2>

                <p>
                The booking for your home <b>${booking.home.homeName}</b> has been cancelled by the guest.
                </p>
                 <p>
                 Upon cancellation, the guest provided the following reason:
                "<b>${reasonForCancellation}</b>".
                </p>

                <p>
                <b>Guest Name:</b> ${req.session.user.name}<br/>
                <b>Check-in:</b> ${booking.checkInDate}<br/>
                <b>Check-out:</b> ${booking.checkOutDate}
                </p>

                <p style="font-size: 13px; color: #888;">
                The dates are now available for new bookings.
                </p>
            </div>
            `;

            await sendMail({
                to: req.session.user.email,
                subject: "Your Booking Has Been Cancelled",
                html: cancelUserEmailHTML
            });
            await sendMail({
                to: home.host.email,
                subject: "Booking Cancelled by Guest",
                html: cancelHostEmailHTML
            });

            res.redirect(`/bookingDetails/${bookingId}`);
        }
        
}


exports.getbookinghistory = async (req, res, next)=>{
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    }
    const userId = req.session.user._id;
    const bookings = await Booking.find({user: userId, status: {$in: ["Cancelled", "Completed"]} }).sort({createdAt:-1}).populate('home');
    const deleteMsg = req.session.deleteMsg || null;
    req.session.deleteMsg = null;
    res.render('store/booking-history', {pageTittle:'Booking History', deleteMsg:deleteMsg, currentPage:'booking-history',booking:bookings, isLoggedIn:req.isLoggedIn, user: req.session.user});

}

exports.postDeleteBooking = async (req, res, next)=>{
    if(!req.isLoggedIn){
        return res.redirect('/login');
    }
    const bookingId = req.params.id;
    if(!bookingId){
        return res.redirect('/bookinghistory');
    }
    const deleteBooking = await Booking.findOneAndDelete({_id: bookingId, status:{$in: ["Cancelled", "Completed"]}});
    if(!deleteBooking){
        req.session.deleteMsg = 'Only Cancelled or completed booking can be removed';
        return res.redirect('/bookinghistory');
    }
    req.session.deleteMsg = 'Booking remove successfully';
    res.redirect('/bookinghistory');
}

exports.getAutoComplete = async (req, res, next) => {
    const q = req.query.q?.trim();
    if(!q){
        return res.json([]);
    }

    const regex = new RegExp(q, 'i');

    const results = await Home.find({
        $or: [
            {houseName: {$regex: q, $options: 'i'}},
            {location: {$regex: q, $options: 'i'}}
        ]
    }).select('houseName location').limit(20);

    const locationsSet = new Set();
    const locations = [];

    results.forEach(home => {
        if(regex.test(home.location) && !locationsSet.has(home.location)){
            locationsSet.add(home.location);
            locations.push({label: home.location});
        }
    })

    const topLocations = locations.slice(0, 4);
    const homeSet = new Set();
    const homes = [];

    results.forEach(home =>{
        if(regex.test(home.houseName) && !homeSet.has(home.houseName)){
            homeSet.add(home.houseName);
            homes.push({label: `${home.houseName}`});
        }
    })

    const topHomes = homes.slice(0, 3);

    const suggestions = [...topLocations, ...topHomes];

    res.json(suggestions);
}

exports.getSearch = async (req, res, next) => {
    const q = req.query.q?.trim();
   
    console.log("Search query:", q);

    if(!q){
        return res.redirect(req.url);
    }
    let favouriteHomes = [];
    if(req.isLoggedIn){
    const userId = req.session.user._id;
     favouriteHomes = await user.findById(userId).populate("favourite").select('favourite');
    }
    const homes = await Home.find({
        $or: [
            {houseName: {$regex: q, $options: 'i'}},
            {location: {$regex: q, $options: 'i'}}
        ]
    });
    res.render('store/search-result', {homes: homes, favouriteHomes: favouriteHomes, pageTittle:'Search Results', currentPage:'search-results', isLoggedIn:req.isLoggedIn, user: req.session.user, searchQuery: q});
}

exports.terms = (req, res, next)=>{
    console.log("DEPLOY TEST 1");
    res.render('store/terms-conditions', {pageTittle:'Terms and Conditions', currentPage:'terms', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.contact = (req, res, next)=>{
    res.render('store/contact', {pageTittle:'Contact Us', currentPage:'contact', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.privacyPolicy = (req, res, next)=>{
    res.render('store/privacy-policy', {pageTittle:'Privacy Policy', currentPage:'privacy-policy', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.cookiePolicy = (req, res, next)=>{
    res.render('store/cookie-policy', {pageTittle:'Cookie Policy', currentPage:'cookie-policy', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.desclaimer = (req, res, next)=>{
    res.render('store/desclaimer', {pageTittle:'Desclaimer', currentPage:'desclaimer', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.faq = (req, res, next)=>{
    res.render('store/faq', {pageTittle:'FAQ', currentPage:'faq', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.helpCenter = (req, res, next)=>{
    res.render('store/helpCenter', {pageTittle:'Help Center', currentPage:'help-center', isLoggedIn:req.isLoggedIn, user: req.session.user});
}

exports.safetyTips = (req, res, next)=>{
    res.render('store/safetyTips', {pageTittle:'Safety Tips', currentPage:'safety-tips', isLoggedIn:req.isLoggedIn, user: req.session.user});
}