const jwt = require('../modules/jwt');
const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');

const jwtMiddleware = {
    checkToken: async (req, res, next) => {
        var token = req.headers.token;
        if (!token) return res.send(errResponse(baseResponse.TOKEN_EMPTY));
        const jwtResult = await jwt.verifyToken(token);
        if (jwtResult === -1 || jwtResult == undefined)
            return res.send(
                errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE)
            );
        req.id = jwtResult;
        next();
    },
};

module.exports = jwtMiddleware;
