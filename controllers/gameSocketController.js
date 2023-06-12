const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const roomService = require('../services/roomService');
const gameService = require('../services/gameService');
const utilities = require('../modules/utility');

module.exports = function (io) {
  io.on('connection', function (socket) {
    socket.on('startRound', startRound);
    socket.on('endRound', endRound);

    socket.on('endCycleHarvestCrop', endCycleHarvestCrop);
    socket.on('endCyclePayFood', endCyclePayFood);
    socket.on('endCycleBreedAnimal', endCycleBreedAnimal);

    socket.on('endGame', endGame);
    socket.on('skipGame', skipGame);

    async function endCycleHarvestCrop(data) {
      try {
        let roomId = data.roomId;
        let userIdList = await roomService.findUserListByRoomId(roomId);
        // 작물 수확
        let result = await gameService.harvestCrop(userIdList, roomId);
        if (result.isSuccess === false) {
          io.sockets.emit('endCycleHarvestCrop', result);
          return;
        }
        io.sockets.emit(
          'endCycleHarvestCrop',
          response(baseResponse.SUCCESS, result)
        );
      } catch (err) {
        console.log(err);
        io.sockets.emit(
          'endCycleHarvestCrop',
          errResponse(baseResponse.SERVER_ERROR)
        );
      }
    }

    async function endCyclePayFood(data) {
      try {
        let roomId = data.roomId;
        let userIdList = await roomService.findUserListByRoomId(roomId);
        console.log(userIdList);
        //음식 지불
        let result = await gameService.payFood(userIdList, roomId);
        if (result.isSuccess === false) {
          io.sockets.emit('endCyclePayFood', result);
          return;
        }
        io.sockets.emit(
          'endCyclePayFood',
          response(baseResponse.SUCCESS, result)
        );
      } catch (err) {
        console.log(err);
        io.sockets.emit(
          'endCyclePayFood',
          errResponse(baseResponse.SERVER_ERROR)
        );
      }
    }

    async function endCycleBreedAnimal(data) {
      try {
        let roomId = data.roomId;
        let userIdList = await roomService.findUserListByRoomId(roomId);

        //음식 지불
        let result = await gameService.breedAnimal(userIdList, roomId);
        if (result.isSuccess === false) {
          io.sockets.emit('endCycleBreedAnimal', result);
          return;
        }
        io.sockets.emit(
          'endCycleBreedAnimal',
          response(baseResponse.SUCCESS, result)
        );
      } catch (err) {
        console.log(err);
        io.sockets.emit(
          'endCycleBreedAnimal',
          errResponse(baseResponse.SERVER_ERROR)
        );
      }
    }

    async function startRound(data) {
      let roomId = data.roomId;
      let findUserList = await roomService.findUserListByRoomId(roomId);
      if (findUserList.length == 0) {
        io.sockets.emit('startRound', baseResponse.BAD_REQUEST);
        return;
      }
      // 아기 성장
      let growBabyResult = await gameService.growBaby(findUserList, roomId);
      if (growBabyResult.isSuccess == false) {
        io.sockets.emit('startRound', growBabyResult);
        return;
      }

      // 게임 순서 변경
      let updateOrderResult = await gameService.updateOrder(
        findUserList,
        roomId
      );
      if (updateOrderResult.isSuccess == false) {
        io.sockets.emit('startRound', baseResponse.BAD_REQUEST);
        return;
      }
      // 구성물 수거 (소규모 농부, Small farmer)
      let usedJobCardResult;
      let updateResult = [];
      for (let userId of findUserList) {
        usedJobCardResult = await gameService.usedJobCard(
          userId,
          roomId,
          'Small farmer'
        );
        if (usedJobCardResult.isSuccess == false) {
          io.sockets.emit('startRound', baseResponse.BAD_REQUEST);
          return;
        }

        updateResult.push(await gameService.getPlayerStatus(userId, roomId));
      }
      io.sockets.emit('startRound', {
        updateOrderResult,
        updateResult,
      });
      // io.sockets.emit('startRound', {
      //   updateOrderResult,
      //   'Small Farmer': updateResult,
      // });
    }

    async function endRound(data) {
      io.sockets.emit('endRound', 'endRound');
    }

    async function endGame(data) {
      let roomId = data.roomId;
      let calGameScoreResult = await gameService.calGameScore(roomId);

      io.sockets.emit('endGame', calGameScoreResult);
    }

    async function skipGame(data) {
      // data 형식
      // {
      //   "roomId": 1,
      //   "skipRound": 8,
      //   "userId": [
      //       {"userId": "test1"},
      //       {"userId": "test2"}
      //     ]
      //  }
      // 시나리오 기준, P1(빨)이 무조건 userId List의 첫번째에 위치해야 함

      roomId = data.roomId;
      let i = 0;
      let skipResult = [];
      let accumulateGoods = [];
      for (let obj of data.userId) {
        try {
          let userId = obj.userId;
          let result = await gameService.skipGame(
            data.roomId,
            userId,
            data.skipRound,
            i
          );
          i++;
          if (result.isSuccess === false) {
            io.sockets.emit('skipGame', result);
          } else {
            let updatedPlayer = await gameService.getPlayerStatus(
              userId,
              roomId
            );
            skipResult.push(updatedPlayer);
            accumulateGoods = await gameService.getAccumulatedGoodsByRoomId(
              roomId
            );
          }
        } catch (err) {
          console.log(err);
          io.sockets.emit('skipGame', errResponse(baseResponse.SERVER_ERROR));
        }
      }
      io.sockets.emit('skipGame', {
        updatedPlayer: skipResult,
        accResult: accumulateGoods,
        skipRound: data.skipRound,
      });
    }
  });
};
