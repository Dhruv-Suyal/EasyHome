const {check, validationResult} = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const user = require('../models/user');

exports.getLogin = (req, res, next)=>{
    res.render('Auth/login', {
        error: [],
        oldInput: {email: ''}
    });
}

exports.postLogin = async (req, res, next)=>{
    const {email, password} = req.body;
    const user = await User.findOne({email});
        if(!user){
            return res.status(422).render('Auth/login', {
                error: ['Invalid Email or Password'],
                oldInput: {email}
            })
        }
    const match = await bcrypt.compare(password, user.password);
        if(!match){
            return res.status(422).render('Auth/login', {
            error: ['Invalid Email or Password'],
            oldInput: {email}
            })
        }
        req.session.isLoggedIn = true;
        req.session.user = user;
        req.session.save(()=>{
            res.redirect('/');
        })
}

exports.postLogout = (req, res, next)=>{
    // res.cookie("isLoggedIn", false);
    req.session.destroy(()=>{
         res.redirect('/');
    })
}

exports.getsignUp = (req, res, next) =>{
    res.render('Auth/signUp', {
        error: [],
        oldInput: {name: '', email: '', password: '', userType: ''}
    });
}

exports.postsignUp = [
            check('name')
            .trim()
            .isLength({min: 3})
            .withMessage('Username must be at least 3 characters Long'),

            check('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .normalizeEmail(),

            check('password')
            .isLength({min: 8})
            .withMessage('Password must be at least 8 characters Long')
            .matches(/[a-z]/)
            .withMessage('Password must contain at least one lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/[0-9]/)
            .withMessage('Password must contain at least one number')
            .matches(/[!@#$%^&*]/)
            .withMessage('Password must contain at least one special character'),

            check('confirmPassword')
            .custom((value, {req})=>{
                if(value !== req.body.password){
                    throw new Error('Password do not match');
                }
                return true;
            }),

            check('userType')
            .notEmpty()
            .withMessage('Please select a user type')
            .isIn(['host', 'guest'])
            .withMessage('Invalid user type'),
            
 (req, res, next) =>{
    const {name, email, password, userType} = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('Auth/signUp',
            {error: errors.array().map(err => err.msg),
            oldInput: {name, email, password, userType}
            }
        )
    }
    bcrypt.hash(password, 12).then(hashedPassword =>{
        const newUser = new User({username:name, email, password: hashedPassword, userType, isProfileCompleted: true});
        return newUser.save();
    }).then(()=>{
        res.render('Auth/login', {
        error: [],
        oldInput: {name: '', email: '', password: '', userType: ''}
    });
    }).catch(err =>{
        return res.status(422).render('Auth/signUp',
            {
                error: [ err.message],
                oldInput: {name, email, password, userType}
            }
        )
    })
    
}
]


exports.postProfile = [
    check('password')
            .isLength({min: 8})
            .withMessage('Password must be at least 8 characters Long')
            .bail()
            .matches(/[a-z]/)
            .withMessage('Password must contain at least one lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/[0-9]/)
            .withMessage('Password must contain at least one number')
            .matches(/[!@#$%^&*]/)
            .withMessage('Password must contain at least one special character'),

            check('confirmPassword')
            .custom((value, {req})=>{
                if(value !== req.body.password){
                    throw new Error('Password do not match');
                }
                return true;
            }),

            check('userType')
            .notEmpty()
            .withMessage('Please select a user type')
            .isIn(['host', 'guest'])
            .withMessage('Invalid user type')
    
    ,async (req, res, next)=>{
    const {userType, password} = req.body;
    const user = req.session.user;
    if(!user){
        console.log("No user in session, redirecting to login");
        return res.redirect('/login');
    }

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log("Validation errors in profile completion:", errors.array());
        return res.status(422).render('Auth/complete_profile',
            {error: errors.array().map(err => err.msg), user: user }
        )
    }

    if(password){
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(user._id, {password: hashedPassword});
    }
    if(userType){
        req.session.user.userType = userType;
        req.session.user.isProfileCompleted = true;
        await User.findByIdAndUpdate(user._id, {userType, isProfileCompleted: true});
    }
    console.log("Profile completed successfully, redirecting to home");
    return res.redirect('/');
}
];