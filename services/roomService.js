const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameRoom = models.gameroom;
const UserGameRoom = models.user_gameroom;
const GameStatus = models.game_status;
const sequelize = require('sequelize');

let crypto = require('crypto');

module.exports = {
  getGameStatus: async (roomId) => {
    try {
      let gameStatus = await GameStatus.findAll({
        where: {
          roomId: roomId,
        },
      });
      return response(baseResponse.SUCCESS, gameStatus);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },

  patchGameStatus: async (data) => {
    // 기존 정보 파기
    try {
      await GameStatus.destroy({
        where: {
          room_id: data.roomId,
          user_id: data.userId,
        },
      });
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }

    try {
      let gameStatus = await GameStatus.create({
        room_id: data.roomId,
        user_id: data.userId,
        is_my_turn: data.isMyTurn,
        order_num: data.orderNum,
        sheep_num: data.sheepNum,
        pig_num: data.pigNum,
        cow_num: data.cowNum,
        wood_num: data.woodNum,
        sand_num: data.sandNum,
        reed_num: data.reedNum,
        stone_num: data.stoneNum,
        grain_on_storage_num: data.grainOnStorageNum,
        vege_on_storage_num: data.vegeOnStorageNum,
        grain_on_field_num: data.grainOnFieldNum,
        vege_on_field_num: data.vegeOnFieldNum,
        grain_doing_num: data.grainDoingNum,
        vege_doing_num: data.vegeDoingNum,
        remained_fence: data.remainedFence,
        remained_barn: data.remainedBarn,
        remained_family: data.remainedFamily,
        adult_num: data.adultNum,
        baby_num: data.babyNum,
        wood_house_num: data.woodHouseNum,
        sand_house_num: data.sandHouseNum,
        stone_house_num: data.stoneHouseNum,
        field_num: data.fieldNum,
        food_num: data.foodNum,
        remained_job_card: data.remainedJobCard,
        used_job_card: data.usedJobCard,
        remained_main_facility_card: data.remainedMainFacilityCard,
        used_main_facility_card: data.usedMainFacilityCard,
        remained_sub_facility_card: data.remainedSubFacilityCard,
        used_sub_facility_card: data.usedSubFacilityCard,
        num_of_begging_token: data.numOfBeggingToken,
      });
      return response(baseResponse.SUCCESS, gameStatus);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },

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
    try {
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
    } catch (err) {
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
    try {
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
  checkIsInGameStatus: async (roomId, userId) => {
    let isStart = await GameStatus.findOne({
      where: {
        roomId: roomId,
        UserId: userId,
      },
    });
    if (isStart) {
      return true;
    } else {
      return false;
    }
  },
  findUserListByRoomId: async (roomId) => {
    let findUserResult = await UserGameRoom.findAll({
      where: {
        room_id: roomId,
      },
    });
    let userList = [];
    for (let result of findUserResult) {
      userList.push(result.dataValues.user_id);
    }
    return userList;
  },
};
