const express = require('express');
const { getLogin, postLogin, postLogout, getsignUp, postsignUp, postProfile } = require('../controller/auth');
const passport = require('passport');
const User = require('../models/user');

const authRouter = express.Router();

authRouter.get('/auth/google', passport.authenticate("google", {scope: ['profile', 'email']}));

authRouter.get('/auth/google/callback', passport.authenticate("google", {failureRedirect: '/login'}),   async (req, res)=>{
    req.session.isLoggedIn = true;
    req.session.user = req.user;
    console.log(req.user.isProfileCompleted, req.user.password);
    if(!req.user.isProfileCompleted || !req.user.password){
        console.log("Redirecting to profile");
        return res.redirect('/profile');
    }
    else{
        console.log("Redirecting to home");
        return res.redirect('/');
    }
});

authRouter.get('/profile', (req, res)=>{
    const user = req.session.user;
    if(!user){
        console.log("No user in session, redirecting to login");
        return res.redirect('/login');
    }
    if(!user.isProfileCompleted || !user.password){   
        console.log("Rendering complete profile page");
        return res.render('Auth/complete_profile', {user: req.user, error:[]});
    }
    else{
        console.log("Profile already completed, redirecting to home");
    return res.redirect('/');
    }
});

authRouter.post('/profile', postProfile);

authRouter.get('/login', getLogin);
authRouter.post('/login', postLogin);
authRouter.post('/logout', postLogout);
authRouter.get('/signUp', getsignUp);
authRouter.post('/signUp', postsignUp);

module.exports = authRouter;