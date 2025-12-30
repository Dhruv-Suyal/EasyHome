const passport = require("passport");
const User = require("../models/user");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.Google_Client_ID,
    clientSecret: process.env.Google_Client_Secret,
    callbackURL: process.env.Google_Callback_URL
},
    async (accessToken, refreshToken, profile, done)=>{
        try{
            const email = profile.emails[0].value;

            let user = await User.findOne({googleId: profile.id});

            if(!user){
                user = await User.findOne({email: email});
            }

            if(!user){
                user = await User.create({
                    username: profile.displayName,
                    email: email,
                    googleId: profile.id,
                    isProfileCompleted: false,
                });
            }
            else{
                if(!user.googleId){
                    user.googleId = profile.id;
                    await user.save();
                }
            }
            return done(null, user);
        } catch(err){
            return done(err, null);
        }
    })
);

passport.serializeUser((user, done)=>{
    done(null, user.id);
})

passport.deserializeUser(async (id, done)=>{
    const user = await User.findById(id);
    done(null, user);
});

module.exports = passport;