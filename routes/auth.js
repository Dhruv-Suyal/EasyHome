const express = require('express');
const { getLogin, postLogin, postLogout, getsignUp, postsignUp, postProfile } = require('../controller/auth');
const passport = require('passport');
const User = require('../models/user');

const authRouter = express.Router();

authRouter.get('/auth/google', passport.authenticate("google", {scope: ['profile', 'email']}));

authRouter.get('/auth/google/callback', passport.authenticate("google", {failureRedirect: '/login'}),   async (req, res)=>{
    req.session.isLoggedIn = true;
    req.session.user = req.user;

    if(!req.user.isProfileCompleted || !req.user.password){
        return res.redirect('/profile');
    }
    else{
        return res.redirect('/');
    }
});

authRouter.get('/profile', (req, res)=>{
    const user = req.session.user;
    if(!user){
        return res.redirect('/login');
    }
    if(!user.isProfileCompleted || !user.password){   
        res.render('Auth/complete_profile', {user: req.user, error:[]});
    }
    return res.redirect('/');
});

authRouter.post('/profile', postProfile);

authRouter.get('/login', getLogin);
authRouter.post('/login', postLogin);
authRouter.post('/logout', postLogout);
authRouter.get('/signUp', getsignUp);
authRouter.post('/signUp', postsignUp);

module.exports = authRouter;