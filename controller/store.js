const Home = require("../models/data");
const user = require("../models/user");


exports.homeList =(req, res, next)=>{
    Home.find().then((registeredHome)=>{
         res.render('store/home-list', {registeredHome:registeredHome, pageTittle:'home List', currentPage:'home-list', isLoggedIn:req.isLoggedIn, user: req.session.user});
    });
}
exports.getbooking = (req, res, next)=>{
         res.render('store/booking', {pageTittle:'Booking', currentPage:'booking', isLoggedIn:req.isLoggedIn, user: req.session.user});
}
exports.getFavouriteList = async (req, res, next)=>{
    const userId = req.session.user._id;
    const Fuser = await user.findById(userId).populate('favourite');
        res.render('store/favourite-list', {favourites:Fuser.favourite, pageTittle:'My favourite', currentPage:'favourites', isLoggedIn:req.isLoggedIn, user: req.session.user});      
    }
    
exports.postFavouriteList = async (req, res, next)=>{
    const homeId = req.body.homeId;
    const userId = req.session.user._id;
    const Fuser = await user.findById(userId);
    if(!Fuser.favourite.includes(homeId)){
        Fuser.favourite.push(homeId);
        await Fuser.save();
    }
     res.redirect('/favourites')
   
}

exports.getIndex = (req, res, next)=>{
    Home.find().then
    ((registeredHome)=>{
         res.render('store/index', {registeredHome:registeredHome, pageTittle:'EasyHome', currentPage:'Easyhome', isLoggedIn:req.isLoggedIn, user: req.session.user});
    })
}

exports.deleteFavourite = async (req, res, next)=>{
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const Fuser = await user.findById(userId);
    if(Fuser.favourite.includes(homeId)){
        Fuser.favourite.pull(homeId);
        await Fuser.save();
    }
    res.redirect('/favourites')
    
}

exports.homeDetails = (req, res, next)=>{
    const homeId = req.params.homeId;
    Home.findById(homeId).then((home)=>{
        if(!home){
            console.log("Home not found");
            res.redirect("/homes");
        }
        else{
            res.render('store/home-detail', {Home:home, pageTittle:'Home details', currentPage:'home', isLoggedIn:req.isLoggedIn, user: req.session.user});
        }
        console.log(home);
    })
}

exports.errorPage = (req, res, next)=>{
    res.render('error')
}


