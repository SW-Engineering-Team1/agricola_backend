const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameStatus = models.game_status;
const GameRooms = models.gameroom;
const sequelize = require('sequelize');
const Op = sequelize.Op;

module.exports = {
  checkGoodsValidity: function (goodsList, updateResults) {
    for (let i = 0; i < goodsList.length; i++) {
      const { name, num, isAdd } = goodsList[i];
      const updatedQuantity = updateResults[name];

      if (!isAdd && updatedQuantity < 0) {
        return false;
      }
    }
    return true;
  },
  updateGoods: async function (userId, goodsList) {
    try {
      for (const goods of goodsList) {
        const { name, num, isAdd } = goods;
        await GameStatus.update(
          {
            [name]: sequelize.literal(`${name} ${isAdd ? '+' : '-'} ${num}`),
          },
          {
            where: {
              userId,
            },
          }
        );
      }
      const updateResults = await GameStatus.findOne({
        where: { userId: userId },
      });

      const isValid = this.checkGoodsValidity(goodsList, updateResults);
      if (!isValid) {
        for (const goods of goodsList) {
          const { name, num, isAdd } = goods;
          await GameStatus.update(
            {
              [name]: sequelize.literal(`${name} ${isAdd ? '-' : '+'} ${num}`),
            },
            {
              where: {
                userId,
              },
            }
          );
        }
        return errResponse(baseResponse.INVALID_GOODS_QUANTITY);
      }
      return updateResults;
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  isExistFacilityCard: async function (goodsName, userId, roomId) {
    try {
      const remainedMainFacilityCard = await GameRooms.findOne({
        where: {
          room_id: roomId,
        },
      });
      if (
        remainedMainFacilityCard.dataValues.remainedMainFacilityCard.includes(
          goodsName
        )
      ) {
        return 'main';
      }
      // 주요 설비에 해당 카드가 없으므로 플레이어가 갖고 있는 보조 설비에서 보조설비 카드 쿼리
      else {
        const remainedSubFacilityCard = await GameStatus.findOne({
          where: {
            userId,
          },
        });
        if (
          remainedSubFacilityCard.dataValues.remainedSubFacilityCard.includes(
            goodsName
          )
        ) {
          return 'sub';
        } else {
          // 어디에도 카드가 없으므로 none 리턴
          return 'none';
        }
      }
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  updateFacilityCard: async function (goodsName, userId, roomId, type) {
    if (type === 'main') {
      try {
        const gameRoom = await GameRooms.findOne({
          where: {
            room_id: roomId,
          },
        });
        const gameStatus = await GameStatus.findOne({
          where: {
            userId,
          },
        });
        const updatedRemainedMainFacilityCard =
          gameRoom.dataValues.remainedMainFacilityCard.filter(
            (card) => card != goodsName
          );
        const updatedUsedMainFacilityCard =
          gameStatus.dataValues.usedMainFacilityCard.concat(goodsName);
        await GameRooms.update(
          {
            remainedMainFacilityCard: updatedRemainedMainFacilityCard,
          },
          {
            where: {
              room_id: roomId,
            },
          }
        );
        await GameStatus.update(
          {
            usedMainFacilityCard: updatedUsedMainFacilityCard,
          },
          {
            where: {
              userId,
            },
          }
        );
      } catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    } else {
      try {
        const gameStatus = await GameStatus.findOne({
          where: {
            userId,
          },
        });
        const updatedRemainedSubFacilityCard =
          gameStatus.dataValues.remainedSubFacilityCard.filter(
            (card) => card != goodsName
          );
        const updatedUsedSubFacilityCard =
          gameStatus.dataValues.usedSubFacilityCard.concat(goodsName);

        await GameStatus.update(
          {
            remainedSubFacilityCard: updatedRemainedSubFacilityCard,
          },
          {
            where: {
              userId,
            },
          }
        );

        await GameStatus.update(
          {
            usedSubFacilityCard: updatedUsedSubFacilityCard,
          },
          {
            where: {
              userId,
            },
          }
        );
        return true;
      } catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    }
  },
  getMainFacilityCards: async function (roomId) {
    try {
      const gameRoom = await GameRooms.findOne({
        where: {
          room_id: roomId,
        },
      });
      return gameRoom.dataValues;
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  getPlayerStatus: async function (userId, roomId) {
    try {
      let playerDetail = await GameStatus.findOne({
        where: {
          userId,
          roomId,
        },
      });
      return playerDetail.dataValues;
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  updateOrder: async function (roomId, userId) {
    try {
      await GameStatus.update(
        {
          nextOrder: 1,
        },
        {
          where: {
            userId,
          },
        }
      );
      await GameStatus.update(
        {
          nextOrder: 2,
        },
        {
          where: {
            roomId,
            userId: {
              [Op.not]: userId,
            },
          },
        }
      );
      return response(baseResponse.SUCCESS);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  canAddFamily: async function (userId, roomId) {
    try {
      const playerDetail = await GameStatus.findOne({
        where: {
          userId,
          roomId,
        },
      });
      const currentFamily =
        playerDetail.dataValues.family + playerDetail.dataValues.baby;
      const maxFamily =
        playerDetail.dataValues.sandHouse +
        playerDetail.dataValues.stoneHouse +
        playerDetail.dataValues.woodHouse;
      if (maxFamily > currentFamily) {
        return true;
      }
      return false;
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  hasEnoughFamily: async function (userId, roomId) {
    try {
      const playerDetail = await GameStatus.findOne({
        where: {
          userId,
          roomId,
        },
      });
      const remainedFamily = playerDetail.dataValues.remainedFamily;
      return remainedFamily === 0 ? false : true;
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  harvestCrop: async function (userId, roomId){
    let playerDetail = await GameStatus.findOne({
      where: {
        userId: userId,
        roomId,
      },
    });
    let data = [];
    data.push({name: 'vegeOnField', num: playerDetail.dataValues.vegeOnField, isAdd: false});
    data.push({name: 'vegeOnStorage', num: playerDetail.dataValues.vegeOnField, isAdd: true});
    data.push({name: 'grainOnField', num: playerDetail.dataValues.grainOnField, isAdd: false});
    data.push({name: 'grainOnStorage', num: playerDetail.dataValues.grainOnField, isAdd: true});

    try{
      let result = await this.updateGoods(userId, data);
      return response(baseResponse.SUCCESS, result);
    }catch (err){
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  payFood: async function (userId, roomId){
    let playerDetail = await GameStatus.findOne({
      where: {
        userId: userId,
        roomId,
      },
    });
    let pay = playerDetail.dataValues.family * 2 + playerDetail.dataValues.baby * 1
    if (pay > playerDetail.dataValues.food){
      let begging = pay - playerDetail.dataValues.food;
      let data = [];
      data.push({name: 'numOfBeggingToken', num: begging, isAdd: true});
      data.push({name: 'food', num: playerDetail.dataValues.food, isAdd: false});
      try{
        let result = await this.updateGoods(userId, data);
        return response(baseResponse.SUCCESS, result);
      } catch(err){
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    }
    else{
      let data = [];
      data.push({name: 'food', num: pay, isAdd: false});
      try{
        let result = await this.updateGoods(userId, data);
        return response(baseResponse.SUCCESS, result);
      }catch (err){
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    }
  },
  breedAnimal: async function (userId, roomId){
    let playerDetail = await GameStatus.findOne({
      where: {
        userId: userId,
        roomId,
      },
    });
    let data = [];
    if(playerDetail.dataValues.sheep > 1){
      data.push({name: 'sheep', num: 1, isAdd: true});
    }
    if(playerDetail.dataValues.pig > 1){
      data.push({name: 'pig', num: 1, isAdd: true});
    }
    if(playerDetail.dataValues.cow > 1){
      data.push({name: 'cow', num: 1, isAdd: true});
    }

    // console.log(data)
    try{
      let result = await this.updateGoods(userId, data);
      return response(baseResponse.SUCCESS, result);
    }catch (err){
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  }
};
