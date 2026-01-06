const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    home: {type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    checkInDate: {type: Date, required: true},
    checkOutDate: {type: Date, required: true},
    numberOfPeople: {type: Number, required: true},
    totalPrice: {type: Number, required: true},
    name: {type: String, required: true},
    email: {type: String, required: true},
    countryCode: {type: String, required: true},
    phoneNumber: {type: String, required: true},
    specialRequests: {type: String},
    status: {type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'checkedIn','Completed'], default: 'Pending'},
    twoDayReminderSent: {type: Boolean, default: false},
    oneDayReminderSent: {type: Boolean, default: false},
    checkOutMailSent: {type: Boolean, default: false},

    checkInOtp: {type: String},
    qrcode: {type: String},
    checkInAt: {type: Date},
    checkOutAt: {type: Date},

    paymentStatus: {type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending'},
    paymentId: {type: String},
    orderId: {type: String},
    refundId: {type: String},
    
}, {timestamps: true});         

module.exports = mongoose.model('Booking', bookingSchema);
