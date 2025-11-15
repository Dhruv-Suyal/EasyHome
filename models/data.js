const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
    houseName : {type: String, required: true},
    location: {type: String, required: true},
    price : {type: Number, required: true},
    description: {type: String},
    bedrooms: {type: Number},
    bathrooms: {type: Number},
    squareFt: {type: Number},
    photoUrl: String,
    host: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
})

module.exports = mongoose.model('Home', homeSchema);