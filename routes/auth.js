const express = require('express');
const { getLogin, postLogin, postLogout, getsignUp, postsignUp } = require('../controller/auth');

const authRouter = express.Router();

authRouter.get('/login', getLogin);
authRouter.post('/login', postLogin);
authRouter.post('/logout', postLogout);
authRouter.get('/signUp', getsignUp);
authRouter.post('/signUp', postsignUp);

module.exports = authRouter;