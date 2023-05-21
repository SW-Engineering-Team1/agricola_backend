const jwt = require('jsonwebtoken');
const secretKey = require('../config/secretKey').secretKey;
const accessTokenExpiresIn = '1d';

module.exports = {
    generateToken: async (user) => {
        const token = jwt.sign(user.id, secretKey, {
            expiresIn: accessTokenExpiresIn,
        });
        return token;
    },
    verifyToken: async (token) => {
        try {
            const decoded = jwt.verify(token, secretKey);
            return decoded;
        } catch (err) {
            console.log(err);
            return -1;
        }
    },
};
