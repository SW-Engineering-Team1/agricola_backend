const jwt = require('jsonwebtoken');
const secretKey = require('../config/secretKey').secretKey;
const options = require('../config/secretKey').options;

module.exports = {
    generateToken: async (user) => {
        const token = jwt.sign(user.id, secretKey, options);
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
