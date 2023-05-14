const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const userService = require('../services/userService');

module.exports = {
    signUp: async function (req, res) {
        try {
            let id = req.body.id;
            let password = req.body.password;
            let createResult = await userService.createUser(id, password);
            res.send(createResult);
        } catch (err) {
            console.log(err);
            res.send(errResponse(baseResponse.SERVER_ERROR));
        }
    },
};
