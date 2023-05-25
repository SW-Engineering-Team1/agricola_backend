const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameStatus = models.game_status;
const GameRooms = models.gameroom;
const sequelize = require('sequelize');

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
        }
      })
      if (remainedMainFacilityCard.dataValues.remainedMainFacilityCard.includes(goodsName)) {
        return "main"
      }
      // 주요 설비에 해당 카드가 없으므로 플레이어가 갖고 있는 보조 설비에서 보조설비 카드 쿼리
      else {
        const remainedSubFacilityCard = await GameStatus.findOne({
          where: {
            userId,
          }
        })
        if (remainedSubFacilityCard.dataValues.remainedSubFacilityCard.includes(goodsName)) {
          return "sub"
        }
        else {
          // 어디에도 카드가 없으므로 none 리턴
          return "none"
        }
      }
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  updateFacilityCard: async function (goodsName, userId, roomId, type) {
    if (type === "main") {
      try {
        const gameRoom = await GameRooms.findOne({
          where: {
            room_id: roomId,
          }
        });
        const gameStatus = await GameStatus.findOne({
          where: {
            userId,
          }
        });
        const updatedRemainedMainFacilityCard = gameRoom.dataValues.remainedMainFacilityCard.filter((card) => card != goodsName);
        const updatedUsedMainFacilityCard = gameStatus.dataValues.usedMainFacilityCard.concat(goodsName);
        let tmp = await GameRooms.update(
          {
            remainedMainFacilityCard: updatedRemainedMainFacilityCard,
          },
          {
            where: {
              room_id: roomId,
            },
          }
        )
        // return 1
        // console.log(tmp)
        await GameStatus.update(
          {
            usedMainFacilityCard: updatedUsedMainFacilityCard,
          },
          {
            where: {
              userId,
            },
          }
        )
      }
      catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    }
    else {
      try {
        const gameStatus = await GameStatus.findOne({
          where: {
            userId,
          },
        });
        const updatedRemainedSubFacilityCard = gameStatus.dataValues.remainedSubFacilityCard.filter((card) => card != goodsName);
        const updatedUsedSubFacilityCard = gameStatus.dataValues.usedSubFacilityCard.concat(goodsName);

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
  getMainFacilityCards: async function(roomId) {
    try {
      const gameRoom = await GameRooms.findOne({
        where: {
          room_id: roomId,
        }
      })
      return gameRoom.dataValues
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
    } catch(err){
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  }


};
