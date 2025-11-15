const { check, validationResult } = require("express-validator");
const Home = require("../models/data");

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
        console.log(req.body);
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
    Home.find({host: req.session.user._id}).
    then((registeredHome)=>{
         res.render('host/host-home-list', {registeredHome:registeredHome, pageTittle:'Host home List', currentPage:'host-home-list', isLoggedIn:req.isLoggedIn, user: req.session.user});
    });
}