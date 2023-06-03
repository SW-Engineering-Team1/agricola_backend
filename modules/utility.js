const baseResponse = require('../config/baseResponseStatus');
const gameService = require('../services/gameService');

module.exports = {
  sowSeed: async function (userId, goodsList) {
    let tmp = JSON.parse(JSON.stringify(goodsList));
    tmp[0].name = tmp[0].name + 'OnStorage';

    let updateResult = await gameService.updateGoods(userId, tmp);
    if (updateResult.isSuccess == false) {
      return updateResult;
    }
    // console.log(abc.isSuccess);

    goodsList[0].name = goodsList[0].name + 'Doing';
    goodsList[0].isAdd = true;

    return gameService.updateGoods(userId, goodsList);
  },

  bakeBread: async function (userId, goodsList) {
    let findUsedMainFacilityResult = await gameService.findUsedMainFacility(
      userId
    );
    goodsList[0].name = goodsList[0].name + 'OnStorage';

    if (findUsedMainFacilityResult.includes('stove')) {
      goodsList = [
        goodsList[0],
        {
          name: 'food',
          num: parseInt(goodsList[0].num) * 2,
          isAdd: true,
        },
      ];
    } else if (findUsedMainFacilityResult.includes('earthen kiln')) {
      goodsList = [
        goodsList[0],
        {
          name: 'food',
          num: parseInt(goodsList[0].num) * 5,
          isAdd: true,
        },
      ];
    } else {
      return baseResponse.BAD_REQUEST;
    }
    let updateResult = await gameService.updateGoods(userId, goodsList);
    if (updateResult.isSuccess == false) {
      return updateResult;
    }
    return updateResult;
  },

  addSubFacility: async function (goodsList, userId, roomId, facilType) {
    // 총 emit 두 개(게임 방의 주요설비 판 내용 + 플레이어의 주요설비 리스트)
    await gameService.updateFacilityCard(
      goodsList[0].name,
      userId,
      roomId,
      facilType
    );

    return await gameService.getPlayerStatus(userId, roomId);
  },
  fixHouse: async function (userId, roomId, goodsList) {
    // goodsList[0]: 개조할 집, goodsList[1]: 갈대 개수, goodsList[2]: 개조하기 위해 필요한 자원
    let getPlayerStatus = await gameService.getPlayerStatus(userId, roomId);
    let playerHouse;
    let updateList = [goodsList[0], goodsList[1], goodsList[2]];
    if (goodsList[0].name === 'sandHouse') {
      playerHouse = getPlayerStatus.woodHouse;
      updateList[3] = JSON.parse(
        `{"name": "woodHouse", "num": "${playerHouse}", "isAdd": false}`
      );
    } else if (goodsList[0].name === 'stoneHouse') {
      playerHouse = getPlayerStatus.sandHouse;
      updateList[3] = JSON.parse(
        `{"name": "sandHouse", "num": "${playerHouse}", "isAdd": false}`
      );
    } else {
      io.to(roomId).emit('useActionSpace', baseResponse.BAD_REQUEST);
    }

    if (
      playerHouse != goodsList[0].num ||
      goodsList[1].num != 1 ||
      goodsList[2].num != goodsList[0].num
    ) {
      io.to(roomId).emit('useActionSpace', baseResponse.NOT_ENOUGHDATA);
      console.log('error');
      return;
    }

    let updateResult = await gameService.updateGoods(userId, updateList);

    return updateResult;
  },
};
