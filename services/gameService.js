const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameStatus = models.game_status;
const sequelize = require('sequelize');
const { Op } = require('sequelize');

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
  isExistMajorImprovementCard: async function (goodsName, userId) {
    console.log(goodsName)
    try{
      const gameStatus = await GameStatus.findOne({
        where: {
          userId,
          [Op.or]: [
            {
              remainedSubFacilityCard: {
                [Op.like]: "%" + goodsName + "%"
              },
            },
            {
              remainedMainFacilityCard: {
                [Op.like]: "%" + goodsName + "%"
              },
            },
          ]
        },
      });
      console.log(gameStatus);

      // const majorImprovementCards = JSON.parse(gameStatus.majorImprovementCards);
      // const isExist = majorImprovementCards.some((card) => {
      //   return card.name === goodsName;
      // });
      let isExist = false;
      return isExist;
    } catch(err){
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  }
};
