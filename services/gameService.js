const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameStatus = models.game_status;
const GameRooms = models.gameroom;
const sequelize = require('sequelize');

module.exports = {
  updateGoods: async function (goodsList, userId) {
    try {
      const updatePromises = goodsList.map(async (goods) => {
        const { goodsName, num, isAdd } = goods;
        return await GameStatus.update(
          {
            [goodsName]: sequelize.literal(
              `${goodsName} ${isAdd ? '+' : '-'} ${num}`
            ),
          },
          {
            where: {
              userId,
            },
          }
        );
      });

      const updateResults = await Promise.all(updatePromises);
      return updateResults;
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  isExistMajorImprovementCard: async function (goodsName, userId, roomId) {
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

  updateMajorImprovementCard: async function (goodsName, userId, roomId, type) {
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
        await GameRooms.update(
          {
            remainedMainFacilityCard: updatedRemainedMainFacilityCard,
          },
          {
            where: {
              room_id: roomId,
            },
          }
        )
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
  }
};
