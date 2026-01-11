const express = require("express");
const autoCancelBooking = require("../services/autoCancelBooking");
const sendBookingReminder = require("../services/sendBookingReminder");

const internalRouter = express.Router();

internalRouter.post('/jobs', async (req, res)=>{
    
    if(req.headers.authorization !== process.env.CRON_SECRET){
        return res.status(401).send('Unauthorized');
    }
    try{
        await autoCancelBooking();
        await sendBookingReminder();
         return res.status(200).send('Cron job executed successfully');
    }catch(err){
        console.error('Cron job failed:', err);
        res.status(500).send('Cron job error');
    }
})

module.exports = internalRouter;