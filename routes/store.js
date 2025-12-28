const express = require('express');
const {homeList, getbooking,getIndex,getFavouriteList, homeDetails, postFavouriteList, deleteFavourite, postbooking, getAllBookings, postCancelBooking, getbookinghistory, getAutoComplete, getSearch} = require('../controller/store');

const storeRouter = express.Router();

storeRouter.get('/',getIndex);
storeRouter.get("/booking/:homeId", getbooking);
storeRouter.post("/booking/:homeId", postbooking);
storeRouter.get("/Allbookings", getAllBookings);
storeRouter.post('/cancelBooking/:bookingId', postCancelBooking);
storeRouter.get("/index",homeList);
storeRouter.get("/favourites", getFavouriteList);
storeRouter.post("/favourites", postFavouriteList)
storeRouter.get("/homes/:homeId", homeDetails);
storeRouter.post("/store/favourites/:homeId", deleteFavourite);
storeRouter.get("/bookinghistory", getbookinghistory);
storeRouter.get("/autoComplete", getAutoComplete);
storeRouter.get("/search", getSearch);


module.exports = storeRouter;