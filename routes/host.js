const express = require('express');
const { addHome, sumbitHome, hostHomeList, editHome, postEditHome, postDeleteHome, getMyBookings, postConfirmBookings } = require('../controller/host');

const hostRouter = express.Router();

hostRouter.get('/home-list',hostHomeList);

hostRouter.get('/add-home',addHome);
hostRouter.post('/add-home',sumbitHome);

hostRouter.get('/edit-home/:homeId',editHome);
hostRouter.post('/edit-home', postEditHome);

hostRouter.post('/delete-home/:homeId', postDeleteHome);

hostRouter.get('/mybookings', getMyBookings);
hostRouter.post('/booking/:bookingId/confirm', postConfirmBookings);

module.exports = hostRouter;
