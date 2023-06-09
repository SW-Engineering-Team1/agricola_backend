const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const roomService = require('../services/roomService');

module.exports = {
  createRoom: async function (req, res) {
    try {
      let roomName = req.body.roomName;
      let limitNum = req.body.limitNum;
      let hostId = req.body.hostId;

      let isInRoom = await roomService.isInRoom(hostId);
      if (isInRoom) {
        return res.send(errResponse(baseResponse.ALREADY_IN_ROOM));
      } else {
        // Create the room
        let createResult = await roomService.createRoom(
          roomName,
          limitNum,
          hostId
        );

        if (createResult.isSuccess === false) {
          res.send(createResult);
        } else {
          // Find the room id
          let roomId = await roomService.findRoomId(hostId);

          // Add the participant number
          await roomService.calParticipantNum(
            parseInt(roomId.dataValues.room_id),
            true
          );

          // Add the host to the room
          await roomService.joinRoom(
            parseInt(roomId.dataValues.room_id),
            hostId
          );
          res.send(createResult);
        }
      }
    } catch (err) {
      console.log(err);
      res.send(errResponse(baseResponse.SERVER_ERROR));
    }
  },
  getRooms: async function (req, res) {
    try {
      let getRoomsResult = await roomService.getRooms();
      res.send(getRoomsResult);
    } catch (err) {
      console.log(err);
      res.send(errResponse(baseResponse.SERVER_ERROR));
    }
  },
  deleteRoom: async function (req, res) {
    try {
      let roomId = req.params.roomId;
      let deleteRoomResult = await roomService.deleteRoom(roomId);
      res.send(deleteRoomResult);
    } catch (err) {
      console.log(err);
      res.send(errResponse(baseResponse.SERVER_ERROR));
    }
  },
  joinRoom: async function (req, res) {
    try {
      let roomId = req.body.roomId;
      let userId = req.body.userId;

      // Check if the user is already in the room
      let isInRoom = await roomService.checkIsInRoom(roomId, userId);
      if (isInRoom) {
        res.send(errResponse(baseResponse.ROOM_ALREADY_JOINED));
        return;
      } else {
        // Add the participant number
        let calResult = await roomService.calParticipantNum(roomId, true);

        if (calResult.isSuccess === false) {
          res.send(calResult);
        } else {
          // Add the user to the room
          let joinRoomResult = await roomService.joinRoom(roomId, userId);
          res.send(joinRoomResult);
        }
      }
    } catch (err) {
      console.log(err);
      res.send(errResponse(baseResponse.SERVER_ERROR));
    }
  },
  exitRoom: async function (req, res) {
    try {
      let roomId = req.body.roomId;
      let userId = req.body.userId;

      // Check if the user is already in the room
      let isInRoom = await roomService.checkIsInRoom(roomId, userId);
      if (!isInRoom) {
        res.send(errResponse(baseResponse.ROOM_NOT_JOINED));
        return;
      }
      // Subtract the participant number
      await roomService.calParticipantNum(roomId, false);

      // Delete the user from the room
      let exitRoomResult = await roomService.exitRoom(roomId, userId);
      res.send(exitRoomResult);
    } catch (err) {
      console.log(err);
      res.send(errResponse(baseResponse.SERVER_ERROR));
    }
  },
};
