const express = require('express');
const {homeList, getbooking,getIndex,getFavouriteList, homeDetails, postFavouriteList, deleteFavourite, postbooking, getAllBookings, postCancelBooking, getbookinghistory, getAutoComplete, getSearch, terms, contact, privacyPolicy, cookiePolicy, desclaimer, faq, helpCenter, safetyTips} = require('../controller/store');

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
storeRouter.get("/terms", terms);
storeRouter.get("/contact", contact);
storeRouter.get("/privacyPolicy", privacyPolicy);
storeRouter.get("/cookiePolicy", cookiePolicy);
storeRouter.get("/desclaimer", desclaimer);
storeRouter.get("/faq", faq);
storeRouter.get("/helpCenter",helpCenter);
storeRouter.get("/safetyTips", safetyTips);

module.exports = storeRouter;