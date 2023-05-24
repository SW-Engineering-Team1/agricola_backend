const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameStatus = models.game_status;
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
};
