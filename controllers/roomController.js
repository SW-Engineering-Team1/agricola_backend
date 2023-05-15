const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const roomService = require('../services/roomService');

module.exports = {
    createRoom: async function (req, res) {
        try {
            let id = req.body.id;
            let password = req.body.password;

            let roomName = req.body.roomName;
            let limitNum = req.body.limitNum;
            let hostId = req.body.hostId;
            let createResult = await roomService.createRoom(roomName, limitNum, hostId);
            res.send(createResult);
        } catch (err) {
            console.log(err);
            res.send(errResponse(baseResponse.SERVER_ERROR));
        }
    },
};
