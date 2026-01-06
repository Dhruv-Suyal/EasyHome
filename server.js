require('dotenv').config({path: 'contact.env'});
require('./utils/booking-cron');
console.log("MAIL_USER:", process.env.MAIL_USER);
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "Loaded ✅" : "Missing ❌");

const express = require('express');
const passport = require('./utils/goggle-auth');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const path = require('path');
const storeRouter = require('./routes/store');
const hostRouter = require('./routes/host');
const { errorPage } = require('./controller/store');
const { default: mongoose } = require('mongoose');
const authRouter = require('./routes/auth');
const multer = require('multer');
const sendMail = require("./utils/sendMail");
const Razorpay = require('razorpay');
const { truncate } = require('fs/promises');

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');
const home = require('./models/data');

const store = new mongoDbStore({
    uri:  process.env.MONGO_URL,
    collection: 'sessions'
})


const filefilter = (req, file, cb)=>{
    if(file.mimetype.startsWith('image/')){
        cb(null, true);
    }
    else{
        cb(null, false);
    }
}

const randomString = (length)=>{
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for(let i=0; i<length; i++){
        result = result + characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const multerStorage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'uploads/');
    },
    filename: (req, file, cb)=>{
        const cleanName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        cb(null, randomString(10) + '-' + cleanName);
    }
})

app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'src')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/host/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/host/bookingDetails/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/homes/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/bookingDetails/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/booking/uploads', express.static(path.join(__dirname, 'uploads')));



app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(multer({storage: multerStorage, fileFilter: filefilter}).single('photoUrl'));

app.use(session({
    secret: 'DhruvCode',
    resave: false,
    saveUninitialized: true,
    store: store,
}))

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next)=>{
    req.isLoggedIn = req.session.isLoggedIn;
    next();
})


app.use(authRouter);
app.use(storeRouter);
app.use('/host', hostRouter);
app.use("/fix", async (req,res)=>{

    console.log("Fixing existing records...");
  await home.updateMany(
    { ratings: { $exists: false } },
    { $set: { ratings: 5 } }
  );

  await home.updateMany(
    { cancellationCount: { $exists: false } },
    { $set: { cancellationCount: 0 } }
  );

  res.send("Updated existing records");
});

app.use('/', errorPage);



const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("Mongoose Connected");
    app.listen(port, ()=>{
    console.log(`Server is Successfully Created at http://localhost:${port}`);})
}).catch((err)=>{
    console.log("Error while connecting mongoose", err);
})


