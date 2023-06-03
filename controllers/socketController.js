const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const roomService = require('../services/roomService');
const gameService = require('../services/gameService');
const utilities = require('../modules/utility');

module.exports = function (io) {
  io.on('connection', function (socket) {
    socket.on('enterLobby', enterLobby);
    socket.on('createRoom', createRoom);
    // socket.on('getRooms', getRooms);
    socket.on('joinRoom', joinRoom);
    socket.on('exitRoom', exitRoom);
    socket.on('patchGameStatus', patchGameStatus);
    socket.on('startRound', startRound);
    socket.on('endRound', endRound);
    socket.on('endCycle', endCycle);
    socket.on('startGame', startGame);

    socket.on('useActionSpace', useActionSpace);
    socket.on('endTurn', endTurn);

    socket.on('endGame', endGame);

    async function endTurn(data) {
      let userId = data.userId;
      let roomId = data.roomId;

      let updatedStatus = await gameService.endTurn(roomId, userId);
      if (updatedStatus.isSuccess === false) {
        io.to(roomId).emit('endTurn', baseResponse.BAD_REQUEST);
        return;
      } else {
        io.to(roomId).emit('endTurn', updatedStatus);
        return;
      }
    }

    async function startGame(data) {
      // data 형식
      // [
      //   {
      //     "roomId": 1,
      //     "userId": "user1"
      //   },
      //   {
      //     "roomId": 1,
      //     "userId": "user2"
      //   }
      // ]
      data.forEach(async (roomData) => {
        let roomId = roomData.roomId;
        let userId = roomData.userId;
        let isStart = await roomService.checkIsInGameStatus(roomId, userId);
        if (isStart) {
          io.to(roomId).emit(
            'startGame',
            errResponse(baseResponse.BAD_REQUEST)
          );
          return;
        } else {
          await gameService.startGame(roomId, userId);
        }
      });
      let gameStatus = await roomService.getGameStatus(data[0].roomId);
      io.to(data[0].roomId).emit('startGame', gameStatus);

      let updatedRoom = await roomService.getRoom(data[0].roomId);
      io.sockets.emit('updatedRoom', updatedRoom);
    }

    async function useActionSpace(data) {
      // 주요 및 보조 설비 이벤트
      if (data.actionName == 'Major Improvement') {
        let isExist = await gameService.isExistFacilityCard(
          data.goods[0].name,
          data.userId,
          data.roomId
        );
        if (isExist === 'main') {
          // 총 emit 두 개(게임 방의 주요설비 판 내용 + 플레이어의 주요설비 리스트)
          await gameService.updateFacilityCard(
            data.goods[0].name,
            data.userId,
            data.roomId,
            isExist
          );

          // 주요설비 관련 내용 emit
          let updatedFacilityList = await gameService.getMainFacilityCards(
            data.roomId
          );
          io.to(data.roomId).emit('useActionSpace', updatedFacilityList);

          // 주요설비를 사용한 플레이어의 상태 emit 필요
          let updatedPlayer = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.to(data.roomId).emit('useActionSpace', updatedPlayer);
        } else if (isExist === 'sub') {
          // 총 emit 한 개(플레이어의 보조설비 리스트)
          // 보조설비를 사용한 플레이어의 상태 emit 필요
          let updatedPlayer = await utilities.addSubFacility(
            data.goods,
            data.userId,
            data.roomId,
            isExist
          );
          io.to(data.roomId).emit('useActionSpace', updatedPlayer);
        } else {
          response(baseResponse.NOT_ENOUGHDATA);
        }
      }
      // 씨뿌리기 이벤트
      else if (data.actionName === 'Grain Utilization') {
        let updateResult = await utilities.sowSeed(data.userId, data.goods);
        io.to(data.roomId).emit('useActionSpace', updateResult);
      }
      // 빵 굽기 이벤트
      else if (data.actionName === 'Bake Bread') {
        let updateResult = await utilities.bakeBread(data.userId, data.goods);
        io.to(data.roomId).emit('useActionSpace', updateResult);
      }
      //회합 장소 이벤트
      else if (data.actionName === 'Meeting Place') {
        // 시작 플레이어 되기 그리고 보조 설비 1개 내려놓기
        if (data.goods.length === 2) {
          // 시작 플레이어 되기
          let updateOrderResult = await gameService.updateNextOrder(
            data.roomId,
            data.userId
          );
          if (updateOrderResult.isSuccess === false) {
            io.to(data.roomId).emit('useActionSpace', updateOrderResult);
            return;
          }
          // 보조 설비 1개 내려놓기
          let isExist = await gameService.isExistFacilityCard(
            data.goods[1].name,
            data.userId,
            data.roomId
          );
          if (isExist === 'sub') {
            let cardResult = await gameService.updateFacilityCard(
              data.goods[1].name,
              data.userId,
              data.roomId,
              'sub'
            );
            if (cardResult.isSuccess === false) {
              io.to(data.roomId).emit(
                'useActionSpace',
                baseResponse.INVALID_CARD_NAME
              );
              return;
            }
          } else {
            io.to(data.roomId).emit(
              'useActionSpace',
              baseResponse.INVALID_CARD_NAME
            );
          }
          // 업데이트 된 플레이어 상태 emit
          let updateResult = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.to(data.roomId).emit('useActionSpace', updateResult);
        } else {
          let updateOrderResult = null;
          // 시작 플레이어 되기
          if (data.goods[0].name === 'order') {
            updateOrderResult = await gameService.updateOrder(
              data.roomId,
              data.userId
            );
            if (updateOrderResult.isSuccess === false) {
              io.to(data.roomId).emit(
                'useActionSpace',
                baseResponse.BAD_REQUEST
              );
              return;
            }
          }
          // 보조 설비 1개 내려놓기
          else {
            let isExist = await gameService.isExistFacilityCard(
              data.goods[0].name,
              data.userId,
              data.roomId
            );
            if (isExist === 'sub') {
              let cardResult = await gameService.updateFacilityCard(
                data.goods[0].name,
                data.userId,
                data.roomId,
                'sub'
              );
              if (cardResult.isSuccess === false) {
                io.to(data.roomId).emit(
                  'useActionSpace',
                  baseResponse.INVALID_CARD_NAME
                );
                return;
              }
            } else {
              io.to(data.roomId).emit(
                'useActionSpace',
                baseResponse.INVALID_CARD_NAME
              );
              return;
            }
          }
          let updateResult = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.to(data.roomId).emit('useActionSpace', updateResult);
          // io.sockets.emit('useActionSpace', updateResult);
        }
      }
      // 기본 가족 늘리기
      else if (data.actionName === 'Basic Wish for Children') {
        let hasEnoughFamily = await gameService.hasEnoughFamily(
          data.userId,
          data.roomId
        );
        let canAddFamily = await gameService.canAddFamily(
          data.userId,
          data.roomId
        );
        if (canAddFamily && hasEnoughFamily) {
          data.goods[0].name = 'baby';

          let goodsList = [];

          let tmp = JSON.parse(JSON.stringify(data.goods));
          tmp[0].name = 'remainedFamily';
          tmp[0].isAdd = false;

          goodsList.push(data.goods[0]);
          goodsList.push(tmp[0]);

          let updateResult = await gameService.updateGoods(
            data.userId,
            goodsList
          );
          if (data.goods.length > 1) {
            let updatedPlayer = await utilities.addSubFacility(
              [data.goods[1]],
              data.userId,
              data.roomId,
              'sub'
            );
            io.to(data.roomId).emit('useActionSpace', updatedPlayer);
          } else {
            io.to(data.roomId).emit('useActionSpace', updateResult);
          }
        } else {
          io.to(data.roomId).emit(
            'useActionSpace',
            baseResponse.NOT_ENOUGHDATA
          );
        }
      }
      // 집 개조하기
      else if (data.actionName === 'Houser Redevelopment') {
        let updateResult = await utilities.fixHouse(
          data.userId,
          data.roomId,
          data.goods
        );
        if (updateResult.isSuccess == false) {
          io.to(roomId).emit('useActionSpace', updateResult);
          return;
        }

        if (data.goods.length > 3) {
          let isExist = await gameService.isExistFacilityCard(
            data.goods[3].name,
            data.userId,
            data.roomId
          );
          if (isExist === 'main') {
            // 총 emit 두 개(게임 방의 주요설비 판 내용 + 플레이어의 주요설비 리스트)
            await gameService.updateFacilityCard(
              data.goods[3].name,
              data.userId,
              data.roomId,
              isExist
            );

            // 주요설비 관련 내용 emit
            let updatedFacilityList = await gameService.getMainFacilityCards(
              data.roomId
            );
            io.to(data.roomId).emit('useActionSpace', updatedFacilityList);

            // 주요설비를 사용한 플레이어의 상태 emit 필요
            let updatedPlayer = await gameService.getPlayerStatus(
              data.userId,
              data.roomId
            );
            io.to(data.roomId).emit('useActionSpace', updatedPlayer);
          } else if (isExist === 'sub') {
            // 총 emit 한 개(플레이어의 보조설비 리스트)
            // 보조설비를 사용한 플레이어의 상태 emit 필요
            let updatedPlayer = await utilities.addSubFacility(
              [data.goods[3]],
              data.userId,
              data.roomId,
              isExist
            );
            io.to(data.roomId).emit('useActionSpace', updatedPlayer);
          } else {
            response(baseResponse.NOT_ENOUGHDATA);
          }
        } else {
          let updatedPlayer = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.to(data.roomId).emit('useActionSpace', updatedPlayer);
        }
      }
      // 급한 가족 늘리기
      else if (data.actionName === 'Urgent Wish for Children') {
        let hasEnoughFamily = await gameService.hasEnoughFamily(
          data.userId,
          data.roomId
        );
        if (hasEnoughFamily) {
          data.goods[0].name = 'baby';

          let goodsList = [];

          let tmp = JSON.parse(JSON.stringify(data.goods));
          tmp[0].name = 'remainedFamily';
          tmp[0].isAdd = false;

          goodsList.push(data.goods[0]);
          goodsList.push(tmp[0]);
          let updateResult = await gameService.updateGoods(
            data.userId,
            goodsList
          );
          io.to(data.roomId).emit('useActionSpace', updateResult);
        } else {
          io.to(data.roomId).emit(
            'useActionSpace',
            baseResponse.NOT_ENOUGHDATA
          );
        }
      } else if (data.actionName == 'Lessons') {
        let result = await gameService.updateJobCard(
          data.goods[0].name,
          data.roomId,
          data.userId
        );
        let updateResult = await gameService.getPlayerStatus(
          data.userId,
          data.roomId
        );
        io.sockets.emit('useActionSpace', updateResult);
      }
      // 밭 농사하기
      else if (data.actionName === 'Cultivation') {
        let updateResult = await gameService.updateGoods(data.userId, [
          data.goods[0],
        ]);
        if (updateResult.isSuccess == false) {
          io.to(data.roomId).emit('useActionSpace', updateResult);
          return;
        }
        if (data.goods.length > 1) {
          updateResult = await utilities.sowSeed(data.userId, [data.goods[1]]);
          io.to(data.roomId).emit('useActionSpace', updateResult);
          return;
        }
        io.to(data.roomId).emit('useActionSpace', updateResult);
      }
      // 농장 개조하기
      else if (data.actionName === 'Farm redevelopment') {
        let updateResult = await utilities.fixHouse(
          data.userId,
          data.roomId,
          data.goods
        );
        if (updateResult.isSuccess == false) {
          io.to(roomId).emit('useActionSpace', updateResult);
          return;
        }
        // 그리고/또는 울타리 치기
        if (data.goods.length > 3) {
          data.goods.splice(0, 3);
          data.goods[2].name = 'field';
          data.goods[2].isAdd = true;
          updateResult = await gameService.updateGoods(data.userId, data.goods);
          io.to(data.roomId).emit('useActionSpace', updateResult);
        }
      } else {
        // else
        let updateResult = await gameService.updateGoods(
          data.userId,
          data.goods
        );
        io.to(data.roomId).emit('useActionSpace', updateResult);
        io.sockets.emit('useActionSpace', updateResult);
      }
    }

    async function patchGameStatus(data) {
      try {
        await roomService.patchGameStatus(data);
        let gameStatus = await roomService.getGameStatus(data.roomId);
        io.to(data.roomId).emit('patchGameStatus', gameStatus);
      } catch (err) {
        console.log(err);
      }
    }

    async function exitRoom(data) {
      try {
        let userId = data.userId;
        let roomId = data.roomId;

        let isHost = await roomService.checkIsHost(roomId, userId);

        if (isHost) {
          // Delete the room
          await roomService.deleteRoom(roomId);
          io.sockets.emit('patchRoomList', getRoomsResult);
          return;
        }

        // Check if the user is in the room
        let isInRoom = await roomService.checkIsInRoom(roomId, userId);
        if (!isInRoom) {
          io.sockets.emit(
            'exitRoom',
            errResponse(baseResponse.ROOM_NOT_JOINED)
          );
          return;
        }

        // Subtract the participant number
        await roomService.calParticipantNum(roomId, false);

        // Delete the user from the room
        await roomService.exitRoom(roomId, userId);

        let roomDetail = await roomService.getRoom(roomId);
        io.sockets.emit('updatedRoom', roomDetail);
      } catch (err) {
        console.log(err);
        io.sockets.emit('exitRooms', errResponse(baseResponse.SERVER_ERROR));
      }
    }

    async function enterLobby() {
      try {
        let getRoomsResult = await roomService.getRooms();
        io.sockets.emit('patchRoomList', getRoomsResult);
      } catch (err) {
        console.log(err);
        io.sockets.emit(
          'patchRoomList',
          errResponse(baseResponse.SERVER_ERROR)
        );
      }
    }

    async function createRoom(data) {
      try {
        let roomName = data.roomName;
        let limitNum = data.limitNum;
        let hostId = data.hostId;

        // Check if the host is already in the room
        let isInRoom = await roomService.isInRoom(hostId);
        if (isInRoom) {
          io.sockets.emit(
            'createRoom',
            errResponse(baseResponse.ALREADY_IN_ROOM)
          );
        } else {
          // Create the room
          let createResult = await roomService.createRoom(
            roomName,
            limitNum,
            hostId
          );

          if (createResult.isSuccess === false) {
            io.sockets.emit('createRoom', createResult);
          } else {
            // Find the room id
            let roomId = await roomService.findRoomId(hostId);

            // Add the host to the room
            await roomService.joinRoom(
              parseInt(roomId.dataValues.room_id),
              hostId
            );
            socket.join(roomId.dataValues.room_id);
            let getRoomsResult = await roomService.getRooms();
            io.sockets.emit('patchRoomList', getRoomsResult);
          }
        }
      } catch (err) {
        console.log(err);
        io.sockets.emit('createRoom', errResponse(baseResponse.SERVER_ERROR));
      }
    }

    async function joinRoom(data) {
      try {
        let roomId = data.roomId;
        let userId = data.userId;

        // Check if the user is already in the room
        let isInRoom = await roomService.isInRoom(userId);
        if (isInRoom) {
          io.sockets.emit(
            'joinRoom',
            errResponse(baseResponse.ALREADY_IN_ROOM)
          );
        } else {
          // Add the participant number
          let calResult = await roomService.calParticipantNum(roomId, true);

          if (calResult.isSuccess === false) {
            io.sockets.emit('joinRoom', calResult);
          } else {
            // Add the user to the room
            await roomService.joinRoom(roomId, userId);
            socket.join(parseInt(roomId));

            let roomDetail = await roomService.getRoom(roomId);
            io.sockets.emit('updatedRoom', roomDetail);
          }
        }
      } catch (err) {
        console.log(err);
        io.sockets.emit('joinRoom', errResponse(baseResponse.SERVER_ERROR));
      }
    }

    async function endCycle(data) {
      try {
        let roomId = data.roomId;
        let userId = data.userId;

        // 작물 수확
        let result = await gameService.harvestCrop(userId, roomId);
        if (result.isSuccess === false) {
          io.sockets.emit('endCycle', result);
          return;
        }
        // 음식 지불
        else {
          result = await gameService.payFood(userId, roomId);
          if (result.isSuccess === false) {
            io.sockets.emit('endCycle', result);
            return;
          }
          // 가축 번식
          else {
            result = await gameService.breedAnimal(userId, roomId);
            if (result.isSuccess === false) {
              io.sockets.emit('endCycle', result);
              return;
            } else {
              let getPlayerStatus = await gameService.getPlayerStatus(
                userId,
                roomId
              );
              io.sockets.emit('endCycle', getPlayerStatus);
            }
          }
        }
      } catch (err) {
        console.log(err);
        io.sockets.emit('endCycle', errResponse(baseResponse.SERVER_ERROR));
      }
    }

    async function startRound(data) {
      let roomId = data.roomId;
      let findUserList = await roomService.findUserListByRoomId(roomId);
      if (findUserList.length == 0) {
        io.to(data.roomId).emit('startRound', baseResponse.BAD_REQUEST);
        return;
      }
      // 게임 순서 변경
      let updateOrderResult = await gameService.updateOrder(
        findUserList,
        roomId
      );
      if (updateOrderResult.isSuccess == false) {
        io.to(data.roomId).emit('startRound', baseResponse.BAD_REQUEST);
        return;
      }
      // 구성물 수거 (소규모 농부, Small farmer)
      let usedJobCardResult;
      let updateResult = [];
      for (let userId of findUserList) {
        usedJobCardResult = await gameService.usedJobCard(
          userId,
          'Small farmer'
        );
        if (usedJobCardResult.isSuccess == false) {
          io.to(data.roomId).emit('startRound', baseResponse.BAD_REQUEST);
          return;
        }
        // 소규모 농부 사용되었다면
        if (usedJobCardResult) {
          updateResult = await gameService.getPlayerStatus(userId, roomId);
        }
      }
      io.to(data.roomId).emit('startRound', {
        updateOrderResult,
        'Small Farmer': updateResult,
      });
      // io.sockets.emit('startRound', {
      //   updateOrderResult,
      //   'Small Farmer': updateResult,
      // });
    }

    async function endRound(data) {
      io.to(data.roomId).emit('endRound', 'endRound');
    }

    async function endGame(data) {
      let roomId = data.roomId;
      let calGameScoreResult = await gameService.calGameScore(roomId);

      io.sockets.emit('endGame', calGameScoreResult);
    }
  });
};
