const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const sequelize = require('sequelize');
const models = require('../models');
const User = models.users;
let crypto = require('crypto');

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
};
