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
        let { name, num, isAdd } = goods;
        if (name == 'grain' || name == 'vege') {
          name += 'OnStorage';
        }
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

        // 비용 내기
        let findCardResult = await this.findCard(goodsName);
        let cardCost = findCardResult.cardCost;

        if ((goodsName = 'Bottle')) {
          let familyNum =
            gameStatus.dataValues.family + gameStatus.dataValues.baby;
          cardCost = [
            { num: 1 * familyNum, name: 'sand', isAdd: false },
            { num: 1 * familyNum, name: 'food', isAdd: false },
          ];
        }

        let updateGoodsResult = await this.updateGoods(userId, cardCost);
        if (updateGoodsResult.isSuccess == false) {
          return false;
        }

        // 업데이트
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

        // 카드 효과 (보조설비 다진 흙)
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
    let field = [];
    for (let element of playerDetail.dataValues.field) {
      if (element.remainedNum != 0) {
        data.push({ name: element.kind + 'OnStorage', num: 1, isAdd: true });
        element.remainedNum -= 1;
      }
      field.push(element);
    }
    try {
      await GameStatus.update(
        {
          field: field,
        },
        {
          where: {
            userId: userId,
            roomId,
          },
        }
      );
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
            'Walled workman',
            'Roof mower',
            'Adoptive parents',
            'Woodcutter',
            'Merchandiser',
            'Organic farmer',
          ],
          usedJobCard: [],
          usedMainFacilityCard: [],
          remainedSubFacilityCard: [
            'Hard ceramic',
            'Carpenter room',
            'Corn shovel',
            'Threshing plate',
            'Clay mine',
            'Street vendor',
            'Log boat',
          ],
          usedSubFacilityCard: [],
          field: [],
          food: 2,
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
            'Subsidiary farmer',
            'Hedge keeper',
            'Servant',
            'Plowman',
          ],
          usedJobCard: [],
          usedMainFacilityCard: [],
          remainedSubFacilityCard: [
            'Crushed soil',
            'Manger',
            'Bottle',
            'Kitchen room',
            'Field of beans',
            'Junkyard',
            'Thick forest',
          ],
          usedSubFacilityCard: [],
          field: [],
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
          remainedMainFacilityCard: [
            'Brazier1',
            'Brazier2',
            'Stove1',
            'Stove2',
            'Well',
            'Earthen kiln',
            'Stone kiln',
            'Furniture factory',
            'Bowl factory',
            'Basket factory',
          ],
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
            roomId,
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

      // 카드 효과
      for (let cardName of data.usedSubFacilityCard) {
        if (cardName == 'Manger') {
          if (data.cageArea >= 10) {
            score += 4;
          } else if (data.cageArea >= 8) {
            score += 3;
          } else if (data.cageArea == 7) {
            score += 2;
          } else if (data.cageArea == 6) {
            score += 1;
          }
        }
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
          cardName,
        },
        attributes: ['cardScore'],
      });
      return findResult.dataValues.cardScore;
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
  growBaby: async function (userList, roomId) {
    try {
      for (let userId of userList) {
        let status = await this.getPlayerStatus(userId, roomId);
        let baby = status.baby;
        let family = status.family;
        family += baby;
        await GameStatus.update(
          {
            baby: 0,
            family: family,
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
      return baseResponse.DB_ERROR;
    }
  },
  getUserField: async function (userId, roomId) {
    try {
      let findResult = await GameStatus.findOne({
        where: {
          userId,
          roomId,
        },
      });
      return findResult.dataValues.field;
    } catch (err) {
      console.log(err);
      return baseResponse.DB_ERROR;
    }
  },
  addField: async function (userId, roomId, field) {
    let currentField = await this.getUserField(userId, roomId);
    if (!(await this.checkFieldExist(userId, roomId, field.id))) {
      currentField = currentField.concat(field);
      try {
        await GameStatus.update(
          {
            field: currentField,
          },
          {
            where: {
              userId,
              roomId,
            },
          }
        );
        return response(baseResponse.SUCCESS);
      } catch (err) {
        console.log(err);
        return baseResponse.DB_ERROR;
      }
    } else {
      return errResponse(baseResponse.BAD_REQUEST);
    }
  },
  checkFieldExist: async function (userId, roomId, fieldId) {
    let currentField = await this.getUserField(userId, roomId);
    let flag = false;
    currentField.forEach((element) => {
      if (element.id === fieldId) {
        flag = true;
      }
    });
    return flag;
  },
  canCultivate: async function (userId, roomId, fieldId) {
    let currentField = await this.getUserField(userId, roomId);
    let flag = true;
    currentField.forEach((element) => {
      if (element.id === fieldId) {
        if (element.remainedNum > 0) {
          flag = false;
        }
      }
    });
    return flag;
  },
  SowField: async function (userId, roomId, field) {
    let currentField = await this.getUserField(userId, roomId);
    currentField.forEach((element) => {
      if (element.id === field.id) {
        element.remainedNum = field.remainedNum;
        element.kind = field.kind;
      }
    });

    try {
      await GameStatus.update(
        {
          field: currentField,
        },
        {
          where: {
            userId,
            roomId,
          },
        }
      );
      return response(baseResponse.SUCCESS);
    } catch (err) {
      console.log(err);
      return baseResponse.DB_ERROR;
    }
  },
  skipGame: async function (roomId, userId, roundNum, i) {
    if (roundNum == 8) {
      try {
        await GameRooms.update(
          {
            remainedMainFacilityCard: [
              'Brazier1',
              'Brazier2',
              'Stove2',
              'Well',
              'Stone kiln',
              'Furniture factory',
              'Bowl factory',
              'Basket factory',
            ],
          },
          {
            where: {
              room_id: roomId,
            },
          }
        );
        if (i == 0) {
          await GameStatus.update(
            {
              isMyTurn: false,
              order: 2,
              nextOrder: 2,
              sheep: 5,
              pig: 0,
              cow: 0,
              wood: 3,
              fence: 3,
              cage: 1,
              cageArea: 8,
              sand: 0,
              reed: 5,
              stone: 0,
              grainOnStorage: 1,
              vegeOnStorage: 0,
              family: 2,
              baby: 0,
              woodHouse: 2,
              sandHouse: 0,
              stoneHouse: 0,
              field: [
                {
                  id: 1,
                  kind: 'grain',
                  remainedNum: 1,
                },
              ],
              food: 1,
              remainedJobCard: [
                'Walled workman',
                'Roof mower',
                'Adoptive parents',
                'Woodcutter',
                'Merchandiser',
                'Organic farmer',
              ],
              usedJobCard: ['Small farmer'],
              usedMainFacilityCard: ['Earthen kiln'],
              remainedSubFacilityCard: [
                'Hard ceramic',
                'Carpenter room',
                'Corn shovel',
                'Threshing plate',
                'Clay mine',
                'Street vendor',
                'Log boat',
              ],
              usedSubFacilityCard: [],
              numOfBeggingToken: 0,
            },
            {
              where: {
                userId,
                roomId,
              },
            }
          );
        } else {
          await GameStatus.update(
            {
              isMyTurn: true,
              order: 1,
              nextOrder: 1,
              sheep: 0,
              pig: 0,
              cow: 0,
              wood: 2,
              fence: 7,
              cage: 1,
              cageArea: 3,
              sand: 2,
              reed: 2,
              stone: 0,
              grainOnStorage: 1,
              vegeOnStorage: 0,
              family: 2,
              baby: 0,
              woodHouse: 2,
              sandHouse: 0,
              stoneHouse: 0,
              field: [
                {
                  id: 15,
                  kind: '',
                  remainedNum: 0,
                },
              ],
              food: 0,
              remainedJobCard: [
                'Palanquinist',
                'Subsidiary farmer',
                'Hedge keeper',
                'Servant',
                'Plowman',
              ],
              usedJobCard: ['Counselor', 'Property manager'],
              usedMainFacilityCard: ['Stove1'],
              remainedSubFacilityCard: [
                'Manger',
                'Bottle',
                'Kitchen room',
                'Field of beans',
                'Junkyard',
                'Thick forest',
              ],
              usedSubFacilityCard: ['Crushed soil'],
              numOfBeggingToken: 0,
            },
            {
              where: {
                userId,
                roomId,
              },
            }
          );
        }
      } catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
      return response(baseResponse.SUCCESS);
    } else if (roundNum == 14) {
      try {
        await GameRooms.update(
          {
            remainedMainFacilityCard: [
              'Brazier2',
              'Stove2',
              'Well',
              'Furniture factory',
              'Bowl factory',
              'Basket factory',
            ],
          },
          {
            where: {
              room_id: roomId,
            },
          }
        );
        if (i == 0) {
          await GameStatus.update(
            {
              isMyTurn: false,
              order: 2,
              nextOrder: 2,
              sheep: 8,
              pig: 4,
              cow: 0,
              wood: 4,
              fence: 14,
              cage: 2,
              cageArea: 8,
              sand: 2,
              reed: 1,
              stone: 0,
              grainOnStorage: 1,
              vegeOnStorage: 1,
              family: 3,
              baby: 0,
              woodHouse: 4,
              sandHouse: 0,
              stoneHouse: 0,
              field: [
                {
                  id: 1,
                  kind: 'grain',
                  remainedNum: 2,
                },
                {
                  id: 2,
                  kind: 'vege',
                  remainedNum: 1,
                },
                {
                  id: 3,
                  kind: '',
                  remainedNum: 0,
                },
              ],
              food: 0,
              remainedJobCard: [
                'Walled workman',
                'Roof mower',
                'Adoptive parents',
                'Woodcutter',
                'Merchandiser',
                'Organic farmer',
              ],
              usedJobCard: ['Small farmer'],
              usedMainFacilityCard: ['Earthen kiln', 'Brazier1'],
              remainedSubFacilityCard: [
                'Carpenter room',
                'Corn shovel',
                'Threshing plate',
                'Clay mine',
                'Street vendor',
                'Log boat',
              ],
              usedSubFacilityCard: ['Hard ceramic'],
              numOfBeggingToken: 0,
            },
            {
              where: {
                userId,
                roomId,
              },
            }
          );
        } else {
          await GameStatus.update(
            {
              isMyTurn: true,
              order: 1,
              nextOrder: 1,
              sheep: 3,
              pig: 0,
              cow: 4,
              wood: 0,
              fence: 15,
              cage: 2,
              cageArea: 9,
              sand: 2,
              reed: 1,
              stone: 2,
              grainOnStorage: 1,
              vegeOnStorage: 1,
              family: 3,
              baby: 0,
              woodHouse: 0,
              sandHouse: 0,
              stoneHouse: 2,
              field: [
                {
                  id: 14,
                  kind: '',
                  remainedNum: 0,
                },
                {
                  id: 15,
                  kind: '',
                  remainedNum: 0,
                },
              ],
              food: 1,
              remainedJobCard: [
                'Subsidiary farmer',
                'Hedge keeper',
                'Servant',
                'Plowman',
              ],
              usedJobCard: ['Counselor', 'Property manager', 'Palanquinist'],
              usedMainFacilityCard: ['Stove1'],
              remainedSubFacilityCard: [
                'Manger',
                'Kitchen room',
                'Field of beans',
                'Junkyard',
                'Thick forest',
              ],
              usedSubFacilityCard: ['Crushed soil', 'Bottle'],
              numOfBeggingToken: 1,
            },
            {
              where: {
                userId,
                roomId,
              },
            }
          );
        }
      } catch (err) {
        console.log(err);
        return errResponse(baseResponse.DB_ERROR);
      }
      return response(baseResponse.SUCCESS);
    } else {
      return errResponse(baseResponse.BAD_REQUEST);
    }
  },
};
