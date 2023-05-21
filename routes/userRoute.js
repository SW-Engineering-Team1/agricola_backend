const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middlewares/auth').checkToken;
const secretKey = require('../config/secretKey');

const userController = require('../controllers/userController');

router.post('/signup', userController.signUp);
router.post('/signin', userController.signIn);
router.get('/payload', jwtMiddleware, userController.getPayload);

module.exports = router;
