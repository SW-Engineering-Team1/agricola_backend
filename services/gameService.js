const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameStatus = models.game_status;
const GameRooms = models.gameroom;
const Card = models.card;
const sequelize = require('sequelize');
const roomService = require('../services/roomService');
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

        // 비용 내기
        let findCardResult = await this.findCard(goodsName);
        let cardCost = findCardResult.cardCost;

        let updateGoodsResult = await this.updateGoods(userId, cardCost);
        if (updateGoodsResult.isSuccess == false) {
          return false;
        }

        // 업데이트
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
        return true;
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
        if (goodsName === 'Crushed soil') {
          await GameStatus.update(
            {
              sand: sequelize.literal(`sand + 1`),
            },
            {
              where: {
                userId,
              },
            }
          );
        }
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
  updateNextOrder: async function (roomId, userId) {
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
  updateJobCard: async function (jobCardName, roomId, userId) {
    try {
      let getResult = await GameStatus.findOne({
        attributes: ['remainedJobCard'],
        where: {
          roomId,
          userId,
        },
      });
      let remainedJobCard = getResult.dataValues.remainedJobCard;
      if (!remainedJobCard.includes(jobCardName)) {
        return errResponse(baseResponse.INVALID_CARD_NAME);
      } else {
        remainedJobCard = remainedJobCard.filter((card) => card != jobCardName);
        await GameStatus.update(
          {
            remainedJobCard,
          },
          {
            where: {
              roomId,
              userId,
            },
          }
        );
        let usedJobCard = await GameStatus.findOne({
          attributes: ['usedJobCard'],
          where: {
            roomId,
            userId,
          },
        });
        usedJobCard = usedJobCard.dataValues.usedJobCard.concat(jobCardName);
        await GameStatus.update(
          {
            usedJobCard: usedJobCard,
          },
          {
            where: {
              roomId,
              userId,
            },
          }
        );
        let cardCost = await Card.findOne({
          attributes: ['cardCost'],
          where: {
            cardName: jobCardName,
          },
        });
        cardCost.dataValues.cardCost.push({
          name: 'food',
          num: 1,
          isAdd: true,
        });
        await this.updateGoods(userId, cardCost.dataValues.cardCost);
        if (jobCardName === 'Counselor') {
          let tmp = [];
          tmp[0] = JSON.parse(`{"name": "sand", "num": 3, "isAdd": true}`);
          await this.updateGoods(userId, tmp);
        } else if (jobCardName === '') {
        }
      }
      return response(baseResponse.SUCCESS);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  harvestCrop: async function (userId, roomId) {
    let playerDetail = await GameStatus.findOne({
      where: {
        userId: userId,
        roomId,
      },
    });
    let data = [];
    data.push({
      name: 'vegeOnField',
      num: playerDetail.dataValues.vegeOnField,
      isAdd: false,
    });
    data.push({
      name: 'vegeOnStorage',
      num: playerDetail.dataValues.vegeOnField,
      isAdd: true,
    });
    data.push({
      name: 'grainOnField',
      num: playerDetail.dataValues.grainOnField,
      isAdd: false,
    });
    data.push({
      name: 'grainOnStorage',
      num: playerDetail.dataValues.grainOnField,
      isAdd: true,
    });

    try {
      let result = await this.updateGoods(userId, data);
      return response(baseResponse.SUCCESS, result);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  payFood: async function (userId, roomId) {
    let playerDetail = await GameStatus.findOne({
      where: {
        userId: userId,
        roomId,
      },
    });
    let pay =
      playerDetail.dataValues.family * 2 + playerDetail.dataValues.baby * 1;
    if (pay > playerDetail.dataValues.food) {
      let begging = pay - playerDetail.dataValues.food;
      let data = [];
      data.push({ name: 'numOfBeggingToken', num: begging, isAdd: true });
      data.push({
        name: 'food',
        num: playerDetail.dataValues.food,
        isAdd: false,
      });
      try {
        let result = await this.updateGoods(userId, data);
        return response(baseResponse.SUCCESS, result);
      } catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    } else {
      let data = [];
      data.push({ name: 'food', num: pay, isAdd: false });
      try {
        let result = await this.updateGoods(userId, data);
        return response(baseResponse.SUCCESS, result);
      } catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    }
  },
  breedAnimal: async function (userId, roomId) {
    let playerDetail = await GameStatus.findOne({
      where: {
        userId: userId,
        roomId,
      },
    });
    let data = [];
    if (playerDetail.dataValues.sheep > 1) {
      data.push({ name: 'sheep', num: 1, isAdd: true });
    }
    if (playerDetail.dataValues.pig > 1) {
      data.push({ name: 'pig', num: 1, isAdd: true });
    }
    if (playerDetail.dataValues.cow > 1) {
      data.push({ name: 'cow', num: 1, isAdd: true });
    }

    // console.log(data)
    try {
      let result = await this.updateGoods(userId, data);
      return response(baseResponse.SUCCESS, result);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  startGame: async function (roomId, userId) {
    let isHost = await roomService.checkIsHost(roomId, userId);
    if (isHost) {
      try {
        await GameStatus.create({
          roomId,
          UserId: userId,
          isMyTurn: true,
          order: 1,
          nextOrder: 1,
          remainedJobCard: [
            'Small farmer',
            'Roof mower',
            'Horse man',
            'Priest',
            'Organic farmer',
            'Merchandiser',
            'Mushroom picker',
          ],
          usedJobCard: [],
          usedMainFacilityCard: [],
          remainedSubFacilityCard: [
            'Noose rope',
            'Manger',
            'Pond hut',
            'Huge farm',
            'Sheet of earth',
            'Bed Room',
          ],
          usedSubFacilityCard: [],
        });
      } catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    } else {
      try {
        await GameStatus.create({
          roomId,
          UserId: userId,
          isMyTurn: false,
          order: 2,
          nextOrder: 2,
          remainedJobCard: [
            'Counselor',
            'Palanquinist',
            'Property manager',
            'Large sickle worker',
            'Barn builder',
            'Sheep pedestrians',
            'Scholar',
          ],
          usedJobCard: [],
          usedMainFacilityCard: [],
          remainedSubFacilityCard: [
            'Crushed soil',
            'Cattle market',
            'Stone tongs',
            'Fireplace rack',
            'Wool',
            'Blanket',
            'Bottle',
            'Loom',
          ],
          usedSubFacilityCard: [],
        });
      } catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
    }
    try {
      await GameRooms.update(
        {
          status: 'STARTED',
        },
        {
          where: {
            room_id: roomId,
          },
        }
      );
      return response(baseResponse.SUCCESS);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  endTurn: async function (roomId, userId) {
    let gamestatus = await GameStatus.findAll({
      where: {
        roomId,
      },
    });

    gamestatus.forEach(async (element) => {
      if (element.dataValues.UserId === userId) {
        await GameStatus.update(
          {
            isMyTurn: false,
          },
          {
            where: {
              roomId,
              UserId: userId,
            },
          }
        );
      } else {
        await GameStatus.update(
          {
            isMyTurn: true,
          },
          {
            where: {
              roomId,
              UserId: element.dataValues.UserId,
            },
          }
        );
      }
    });

    try {
      let gamestatus = await GameStatus.findAll({
        where: {
          roomId,
        },
      });
      return response(baseResponse.SUCCESS, gamestatus);
    } catch (err) {
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
  updateOrder: async function (userIdList, roomId) {
    try {
      for (let userId of userIdList) {
        await GameStatus.update(
          {
            order: sequelize.col('nextOrder'),
            isMyTurn: sequelize.literal(
              'CASE WHEN nextOrder = 1 THEN true ELSE false END'
            ),
          },
          {
            where: {
              userId,
            },
          }
        );
      }
      let orderResult = [];
      for (let i = 1; i <= 2; i++) {
        let findResult = await GameStatus.findOne({
          where: {
            order: i,
          },
          attributes: ['userId'],
        });
        orderResult.push(findResult.dataValues.userId);
      }
      return orderResult;
    } catch (err) {
      console.log(err);
      return baseResponse.DB_ERROR;
    }
  },
  usedJobCard: async function (userId, cardName) {
    try {
      let findResult = await GameStatus.findOne({
        where: { userId },
      });
      let usedJobCard = findResult.dataValues.usedJobCard;
      if (!usedJobCard.includes(cardName)) {
        return false;
      }
      if (
        findResult.dataValues.woodHouse == 2 ||
        findResult.dataValues.sandHouse == 2 ||
        findResult.dataValues.stoneHouse == 2
      ) {
        let updateData = [
          {
            name: 'wood',
            num: 1,
            isAdd: true,
          },
        ];
        await this.updateGoods(userId, updateData);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
      return baseResponse.DB_ERROR;
    }
  },
  calGameScore: async function (roomId) {
    let gameResult = [];
    let gameStatus = await GameStatus.findAll({
      where: {
        roomId,
      },
    });
    for (let status of gameStatus) {
      let data = status.dataValues;
      let score = 0;

      // 밭
      if (data.field <= 1) {
        score -= 1;
      } else if (data.field == 2) {
        score += 1;
      } else if (data.field == 3) {
        score += 2;
      } else if (data.field == 4) {
        score += 3;
      } else if (data.field >= 5) {
        score += 4;
      }

      // 우리
      if (data.cage == 0) {
        score -= 1;
      } else if (data.cage == 1) {
        score += 1;
      } else if (data.cage == 2) {
        score += 2;
      } else if (data.cage == 3) {
        score += 3;
      } else if (data.cage >= 4) {
        score += 4;
      }

      // 곡식과 채소
      if (data.grainOnStorage == 0) {
        score -= 1;
      } else if (data.grainOnStorage <= 3) {
        score += 1;
      } else if (data.grainOnStorage <= 5) {
        score += 2;
      } else if (data.grainOnStorage <= 7) {
        score += 3;
      } else if (data.grainOnStorage >= 8) {
        score += 4;
      }

      if (data.vegeOnStorage == 0) {
        score -= 1;
      } else if (data.vegeOnStorage == 1) {
        score += 1;
      } else if (data.vegeOnStorage == 2) {
        score += 2;
      } else if (data.vegeOnStorage == 3) {
        score += 3;
      } else if (data.vegeOnStorage >= 4) {
        score += 4;
      }

      // 가축
      if (data.sheep == 0) {
        score -= 1;
      } else if (data.sheep <= 3) {
        score += 1;
      } else if (data.sheep <= 5) {
        score += 2;
      } else if (data.sheep <= 7) {
        score += 3;
      } else if (data.sheep >= 8) {
        score += 4;
      }

      if (data.pig == 0) {
        score -= 1;
      } else if (data.pig <= 2) {
        score += 1;
      } else if (data.pig <= 4) {
        score += 2;
      } else if (data.pig <= 6) {
        score += 3;
      } else if (data.pig >= 7) {
        score += 4;
      }

      if (data.cow == 0) {
        score -= 1;
      } else if (data.cow == 1) {
        score += 1;
      } else if (data.cow <= 3) {
        score += 2;
      } else if (data.cow <= 5) {
        score += 3;
      } else if (data.cow >= 6) {
        score += 4;
      }

      // 사용하지 않는 빈칸
      score -=
        15 -
        (data.field +
          data.woodHouse +
          data.sandHouse +
          data.stoneHouse +
          data.cageArea);

      // 울타리 친 외양간 보류

      // 집
      score += data.sandHouse;
      score += data.stoneHouse * 2;

      // 가족 구성원
      score += data.family * 3;
      score += data.baby * 3;

      // 주요설비 카드 점수
      for (let cardName of data.usedMainFacilityCard) {
        let cardScore = await this.findCardScore(cardName);
        score += cardScore;
      }

      // 보조설비 카드 점수
      for (let cardName of data.usedSubFacilityCard) {
        let cardScore = await this.findCardScore(cardName);
        score += cardScore;
      }

      // 직업 카드 점수
      for (let cardName of data.usedJobCard) {
        let cardScore = await this.findCardScore(cardName);
        score += cardScore;
      }

      // 구걸 토큰
      score -= data.numOfBeggingToken * 3;
      gameResult.push({
        userId: data.UserId,
        score: score,
      });
    }

    gameResult.sort((x, y) => y.score - x.score);
    return gameResult;
  },
  findCardScore: async function (cardName) {
    try {
      let findResult = await Card.findOne({
        where: {
          card_name: cardName,
        },
        attributes: ['card_score'],
      });
      return findResult.dataValues.card_score;
    } catch (err) {
      console.log(err);
      return baseResponse.DB_ERROR;
    }
  },
  isHasCrashedSoil: async function (userId, roomId) {
    let userDetail = await GameStatus.findOne({
      where: {
        userId,
        roomId,
      },
    });
    if (userDetail.dataValues.usedSubFacilityCard.includes('Crushed soil')) {
      return true;
    } else {
      return false;
    }
  },
  findUsedMainFacility: async function (userId) {
    try {
      let findResult = await GameStatus.findOne({
        where: {
          userId,
        },
      });
      return findResult.dataValues.usedMainFacilityCard;
    } catch (err) {
      console.log(err);
      return baseResponse.DB_ERROR;
    }
  },
  findCard: async function (cardName) {
    try {
      let findResult = await Card.findOne({
        where: {
          cardName,
        },
      });
      return findResult.dataValues;
    } catch (err) {
      console.log(err);
      return baseResponse.DB_ERROR;
    }
  },
};
