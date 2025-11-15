const express = require('express');
const {homeList, getbooking,getIndex,getFavouriteList, homeDetails, postFavouriteList, deleteFavourite } = require('../controller/store');

const storeRouter = express.Router();

storeRouter.get('/',getIndex);
storeRouter.get("/booking", getbooking);
storeRouter.get("/index",homeList);
storeRouter.get("/favourites", getFavouriteList);
storeRouter.post("/favourites", postFavouriteList)
storeRouter.get("/homes/:homeId", homeDetails);
storeRouter.post("/store/favourites/:homeId", deleteFavourite);

module.exports = storeRouter;