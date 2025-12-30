const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true},
    email: {type: String, required: [true , 'email already exists'], unique: true},
    password: {type: String},
    googleId: {type: String},
    isProfileCompleted: {type: Boolean, default: false},
    userType: {type: String, enum: ['host', 'guest'], required: true, default: 'guest'},
    favourite: [{type: mongoose.Schema.Types.ObjectId, ref: 'Home'}]
})

module.exports = mongoose.model('User', userSchema);