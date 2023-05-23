const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameRoom = models.gameroom;
const UserGameRoom = models.user_gameroom;
const sequelize = require('sequelize');

let crypto = require('crypto');

module.exports = {
  createRoom: async (roomName, limitNum, hostId) => {
    try {
      await GameRoom.create({
        room_name: roomName,
        limit_num: limitNum,
        participant_num: 1,
        status: 'NOT_STARTED',
        host_id: hostId,
      });
      return response(baseResponse.SUCCESS);
    } catch (err) {
      // TODO: error handling
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  checkIsHost: async (roomId, userId) => {
    try{
      let isHost = await GameRoom.findOne({
        where: {
          room_id: roomId,
          host_id: userId,
        },
      });
      if (isHost) {
        return true;
      }
      return false;
    }
    catch(err){
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  findRoomId: async (hostId) => {
    try {
      let room = await GameRoom.findOne({
        where: {
          host_id: hostId,
        },
      });
      return room;
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  getRooms: async () => {
    try {
      let rooms = await GameRoom.findAll();
      return response(baseResponse.SUCCESS, rooms);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  getRoom: async (roomId) => {
    try{
      let room = await GameRoom.findByPk(roomId);
      return response(baseResponse.SUCCESS, room);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  deleteRoom: async (roomId) => {
    try {
      await GameRoom.destroy({
        where: {
          room_id: roomId,
        },
      });
      return response(baseResponse.SUCCESS);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  isInRoom: async (userId) => {
    try {
      let isInRoom = await UserGameRoom.findOne({
        where: {
          user_id: userId,
        },
      });
      if (isInRoom) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  checkIsInRoom: async (roomId, userId) => {
    try {
      let isInRoom = await UserGameRoom.findOne({
        where: {
          room_id: roomId,
          user_id: userId,
        },
      });
      if (isInRoom) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  joinRoom: async (roomId, userId) => {
    try {
      await UserGameRoom.create({
        room_id: roomId,
        user_id: userId,
      });
      return response(baseResponse.SUCCESS);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  exitRoom: async (roomId, userId) => {
    try {
      await UserGameRoom.destroy({
        where: {
          room_id: roomId,
          user_id: userId,
        },
      });
      return response(baseResponse.SUCCESS);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  calParticipantNum: async (roomId, isAdd) => {
    try {
      let updatedParticipantNum;
      if (isAdd) {
        updatedParticipantNum = sequelize.literal('participant_num + 1');
      } else {
        updatedParticipantNum = sequelize.literal('participant_num - 1');
      }

      await GameRoom.update(
        {
          participant_num: updatedParticipantNum,
        },
        {
          where: {
            room_id: roomId,
          },
        }
      );

      const room = await GameRoom.findByPk(roomId);
      if (room.participant_num > room.limit_num) {
        await GameRoom.update(
          {
            participant_num: sequelize.literal('participant_num - 1'),
          },
          {
            where: {
              room_id: roomId,
            },
          }
        );
        return errResponse(baseResponse.ROOM_IS_FULL);
      } else {
        return response(baseResponse.SUCCESS);
      }
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
};
