const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const sequelize = require('sequelize');
const models = require('../models');
const User = models.users;
let crypto = require('crypto');
const jwt = require('../modules/jwt');

module.exports = {
    createUser: async (id, password) => {
        try {
            let salt = crypto.randomBytes(64).toString('base64');
            let hashedPassword = crypto
                .pbkdf2Sync(password, salt, 12345, 64, 'sha512')
                .toString('base64');
            await User.create({
                id,
                password: hashedPassword,
                salt,
            });
            return response(baseResponse.SUCCESS);
        } catch (err) {
            if (err.name == 'SequelizeUniqueConstraintError') {
                return errResponse(baseResponse.SIGNUP_REDUNDANT_ID);
            }
            return errResponse(baseResponse.DB_ERROR);
        }
    },
    signIn: async (id, password) => {
        try {
            let user = await User.findOne({
                where: {
                    id,
                },
            });
            if (user == null) {
                return errResponse(baseResponse.USER_USERID_NOT_EXIST);
            }
            let hashedPassword = crypto
                .pbkdf2Sync(password, user.salt, 12345, 64, 'sha512')
                .toString('base64');
            if (hashedPassword != user.password) {
                return errResponse(baseResponse.SIGNIN_PASSWORD_WRONG);
            }
            const token = await jwt.generateToken(user);
            return response(baseResponse.SUCCESS, { token });
        } catch (err) {
            console.log(err);
            return errResponse(baseResponse.DB_ERROR);
        }
    },
};
