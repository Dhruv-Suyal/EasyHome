const express = require('express');
const { addHome, sumbitHome, hostHomeList, editHome, postEditHome, postDeleteHome, getMyBookings, postConfirmBookings, postCancel, HostBookingDetails, VerifyGuestQr, VerifyGuestOtp } = require('../controller/host');

const hostRouter = express.Router();

hostRouter.get('/home-list',hostHomeList);

hostRouter.get('/add-home',addHome);
hostRouter.post('/add-home',sumbitHome);

hostRouter.get('/edit-home/:homeId',editHome);
hostRouter.post('/edit-home', postEditHome);

hostRouter.post('/delete-home/:homeId', postDeleteHome);

hostRouter.get('/mybookings', getMyBookings);
hostRouter.post('/booking/:bookingId/confirm', postConfirmBookings);

hostRouter.post('/booking/:bookingId/cancel', postCancel);

hostRouter.get('/bookingDetails/:bookingId/', HostBookingDetails);
hostRouter.post('/verify-qr', VerifyGuestQr);
hostRouter.post('/verify-otp/:bookingId', VerifyGuestOtp)

module.exports = hostRouter;
