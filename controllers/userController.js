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
    signIn: async function (req, res) {
        try {
            let id = req.body.id;
            let password = req.body.password;
            let signInResult = await userService.signIn(id, password);
            res.send(signInResult);
        } catch (err) {
            console.log(err);
            res.send(errResponse(baseResponse.SERVER_ERROR));
        }
    },
    getPayload: async (req, res) => {
        res.send(
            response(baseResponse.TOKEN_VERIFICATION_SUCCESS, { id: req.id })
        );
    },
};
