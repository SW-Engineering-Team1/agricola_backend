const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const roomService = require('../services/roomService');
const gameService = require('../services/gameService');
const utilities = require('../modules/utility');

module.exports = function (io) {
  io.on('connection', function (socket) {
    socket.on('enterLobby', enterLobby);
    socket.on('createRoom', createRoom);
    socket.on('joinRoom', joinRoom);
    socket.on('exitRoom', exitRoom);
    socket.on('startRound', startRound);
    socket.on('endRound', endRound);
    socket.on('endCycle', endCycle);
    socket.on('startGame', startGame);
    socket.on('useFacility', useFacility);

    socket.on('useActionSpace', useActionSpace);
    socket.on('endTurn', endTurn);

    socket.on('endGame', endGame);
    socket.on('skipGame', skipGame);
    socket.on('accumulateGoods', accumulateGoods);

    async function useFacility(data) {
      let userId = data.userId;
      let roomId = data.roomId;
      let dataList = [];
      if (data.actionName === 'Stove1') {
        if (data.goods[0].name === 'sheep') {
          dataList = [
            data.goods[0],
            {
              name: 'food',
              num: parseInt(data.goods[0].num) * 2,
              isAdd: true,
            },
          ];
        } else if (data.goods[0].name === 'pig') {
          dataList = [
            data.goods[0],
            {
              name: 'food',
              num: parseInt(data.goods[0].num) * 2,
              isAdd: true,
            },
          ];
        } else if (data.goods[0].name === 'cow') {
          dataList = [
            data.goods[0],
            {
              name: 'food',
              num: parseInt(data.goods[0].num) * 3,
              isAdd: true,
            },
          ];
        } else if (data.goods[0].name === 'vege') {
          data.goods[0].name = 'vegeOnStorage';
          dataList = [
            data.goods[0],
            {
              name: 'food',
              num: parseInt(data.goods[0].num) * 2,
              isAdd: true,
            },
          ];
        }
        let updatedPlayer = await gameService.updateGoods(
          userId,
          roomId,
          dataList
        );
        io.sockets.emit('useFacility', updatedPlayer);
      } else if (data.actionName == 'Hard ceramics') {
        if (data.goods[0].num == 2) {
          dataList = [
            data.goods[0],
            {
              name: 'stone',
              num: 1,
              isAdd: true,
            },
          ];
        } else if (data.goods[0].num == 3) {
          dataList = [
            data.goods[0],
            {
              name: 'stone',
              num: 2,
              isAdd: true,
            },
          ];
        } else if (data.goods[0].num == 4) {
          dataList = [
            data.goods[0],
            {
              name: 'stone',
              num: 3,
              isAdd: true,
            },
          ];
        }
        let updatedPlayer = await gameService.updateGoods(
          userId,
          roomId,
          dataList
        );
        io.sockets.emit('useFacility', updatedPlayer);
      } else if (data.actionName == 'Brazier1') {
        if (data.goods[0].name === 'sheep') {
          dataList = [
            data.goods[0],
            {
              name: 'food',
              num: parseInt(data.goods[0].num) * 2,
              isAdd: true,
            },
          ];
        } else if (data.goods[0].name === 'pig') {
          dataList = [
            data.goods[0],
            {
              name: 'food',
              num: parseInt(data.goods[0].num) * 3,
              isAdd: true,
            },
          ];
        } else if (data.goods[0].name === 'cow') {
          dataList = [
            data.goods[0],
            {
              name: 'food',
              num: parseInt(data.goods[0].num) * 4,
              isAdd: true,
            },
          ];
        } else if (data.goods[0].name === 'vege') {
          data.goods[0].name = 'vegeOnStorage';
          dataList = [
            data.goods[0],
            {
              name: 'food',
              num: parseInt(data.goods[0].num) * 3,
              isAdd: true,
            },
          ];
        }
        let updatedPlayer = await gameService.updateGoods(
          userId,
          roomId,
          dataList
        );
        io.sockets.emit('useFacility', updatedPlayer);
      }
    }

    async function endTurn(data) {
      let userId = data.userId;
      let roomId = data.roomId;

      let updatedStatus = await gameService.endTurn(roomId, userId);
      if (updatedStatus.isSuccess === false) {
        io.sockets.emit('endTurn', baseResponse.BAD_REQUEST);
        return;
      } else {
        io.sockets.emit('endTurn', updatedStatus);
        return;
      }
    }

    async function startGame(data) {
      // data 형식
      // [
      //   {
      //     roomId: 1,
      //     userId: 'test1',
      //   },
      //   {
      //     roomId: 1,
      //     userId: 'test2',
      //   },
      // ];
      for (let roomData of data) {
        let roomId = roomData.roomId;
        let userId = roomData.userId;
        let isStart = await roomService.checkIsInGameStatus(roomId, userId);
        if (isStart) {
          io.sockets.emit('startGame', errResponse(baseResponse.BAD_REQUEST));
          return;
        } else {
          await gameService.startGame(roomId, userId);
        }
      }
      let gameStatus = await roomService.getGameStatus(data[0].roomId);
      let mainFacilityList = await gameService.getMainFacilityCards(
        data[0].roomId
      );
      io.sockets.emit(
        'startGame',
        response(baseResponse.SUCCESS, {
          gameStatusList: gameStatus,
          mainFacilityList: mainFacilityList,
        })
      );

      let updatedRooms = await roomService.getRooms();
      io.sockets.emit('updatedRooms', updatedRooms);
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
          let updateFacilityCardResult = await gameService.updateFacilityCard(
            data.goods[0].name,
            data.userId,
            data.roomId,
            isExist
          );
          if (!updateFacilityCardResult) {
            io.sockets.emit('useActionSpace', baseResponse.BAD_REQUEST);
            return;
          }
          // 주요설비 관련 내용 emit
          let updatedFacilityList = await gameService.getMainFacilityCards(
            data.roomId
          );
          io.sockets.emit('useActionSpace', updatedFacilityList);

          // 주요설비를 사용한 플레이어의 상태 emit 필요
          let updatedPlayer = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.sockets.emit('useActionSpace', updatedPlayer);
        } else if (isExist === 'sub') {
          // 총 emit 한 개(플레이어의 보조설비 리스트)
          // 보조설비를 사용한 플레이어의 상태 emit 필요
          let updatedPlayer = await utilities.addSubFacility(
            data.goods,
            data.userId,
            data.roomId,
            isExist
          );
          io.sockets.emit('useActionSpace', updatedPlayer);
        } else {
          io.sockets.emit('useActionSpace', baseResponse.BAD_REQUEST);
        }
      }
      // 씨뿌리기 이벤트
      else if (data.actionName === 'Grain Utilization') {
        let updateResult = await utilities.sowSeed(
          data.userId,
          data.roomId,
          data.goods
        );
        io.sockets.emit('useActionSpace', updateResult);
      }
      // 빵 굽기 이벤트
      else if (data.actionName === 'Bake Bread') {
        let updateResult = await utilities.bakeBread(data.userId, data.goods);
        io.sockets.emit('useActionSpace', updateResult);
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
            io.sockets.emit('useActionSpace', updateOrderResult);
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
              io.sockets.emit('useActionSpace', baseResponse.INVALID_CARD_NAME);
              return;
            }
          } else {
            io.sockets.emit('useActionSpace', baseResponse.INVALID_CARD_NAME);
          }
          // 업데이트 된 플레이어 상태 emit
          let updateResult = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.sockets.emit('useActionSpace', updateResult);
        } else {
          let updateNextOrderResult = null;
          // 시작 플레이어 되기
          if (data.goods[0].name === 'order') {
            updateNextOrderResult = await gameService.updateNextOrder(
              data.roomId,
              data.userId
            );
            if (updateNextOrderResult.isSuccess === false) {
              io.sockets.emit('useActionSpace', baseResponse.BAD_REQUEST);
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
                io.sockets.emit(
                  'useActionSpace',
                  baseResponse.INVALID_CARD_NAME
                );
                return;
              }
            } else {
              io.sockets.emit('useActionSpace', baseResponse.INVALID_CARD_NAME);
              return;
            }
          }
          let updateResult = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.sockets.emit('useActionSpace', updateResult);
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
            data.roomId,
            goodsList
          );
          if (data.goods.length > 1) {
            let updatedPlayer = await utilities.addSubFacility(
              [data.goods[1]],
              data.userId,
              data.roomId,
              'sub'
            );
            io.sockets.emit('useActionSpace', updatedPlayer);
          } else {
            io.sockets.emit('useActionSpace', updateResult);
          }
        } else {
          io.sockets.emit('useActionSpace', baseResponse.NOT_ENOUGHDATA);
        }
      }
      // 집 개조하기
      else if (data.actionName === 'House Redevelopment') {
        let updateResult = await utilities.fixHouse(
          data.userId,
          data.roomId,
          data.goods,
          data.isUsingManager // 재산 관리자 사용 여부 판별을 위한 flag
        );
        if (updateResult.isSuccess == false) {
          io.sockets.emit('useActionSpace', updateResult);
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
            io.sockets.emit('useActionSpace', updatedFacilityList);

            // 주요설비를 사용한 플레이어의 상태 emit 필요
            let updatedPlayer = await gameService.getPlayerStatus(
              data.userId,
              data.roomId
            );
            io.sockets.emit('useActionSpace', updatedPlayer);
          } else if (isExist === 'sub') {
            // 총 emit 한 개(플레이어의 보조설비 리스트)
            // 보조설비를 사용한 플레이어의 상태 emit 필요
            let updatedPlayer = await utilities.addSubFacility(
              [data.goods[3]],
              data.userId,
              data.roomId,
              isExist
            );
            io.sockets.emit('useActionSpace', updatedPlayer);
          } else {
            response(baseResponse.NOT_ENOUGHDATA);
          }
        } else {
          let updatedPlayer = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.sockets.emit('useActionSpace', updatedPlayer);
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
            data.roomId,
            goodsList
          );
          io.sockets.emit('useActionSpace', updateResult);
        } else {
          io.sockets.emit('useActionSpace', baseResponse.NOT_ENOUGHDATA);
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
      // else if (data.actionName === 'Cultivation') {
      //   let updateResult = await gameService.updateGoods(data.userId, [
      //     data.goods[0],
      //   ]);
      //   if (updateResult.isSuccess == false) {
      //     io.sockets.emit('useActionSpace', updateResult);
      //     return;
      //   }
      //   if (data.goods.length > 1) {
      //     updateResult = await utilities.sowSeed(data.userId, [data.goods[1]]);
      //     io.sockets.emit('useActionSpace', updateResult);
      //     return;
      //   }
      //   io.sockets.emit('useActionSpace', updateResult);
      // }
      // 농장 개조하기
      else if (data.actionName === 'Farm redevelopment') {
        let updateResult = await utilities.fixHouse(
          data.userId,
          data.roomId,
          data.goods
        );
        if (updateResult.isSuccess == false) {
          io.sockets.emit('useActionSpace', updateResult);
          return;
        }
        // 그리고/또는 울타리 치기
        if (data.goods.length > 3) {
          data.goods.splice(0, 3);
          data.goods[2].name = 'field';
          data.goods[2].isAdd = true;
          updateResult = await gameService.updateGoods(
            data.userId,
            data.roomId,
            data.goods
          );
          io.sockets.emit('useActionSpace', updateResult);
        }
      } else if (data.actionName === 'Fencing') {
        let isHasCrashedSoil = await gameService.isHasCrashedSoil(
          data.userId,
          data.roomId
        );
        if (isHasCrashedSoil) {
          if (data.goods[0].name === 'wood' || data.goods[0].name === 'stone') {
            let updateResult = await gameService.updateGoods(
              data.userId,
              data.roomId,
              data.goods
            );
            io.sockets.emit('useActionSpace', updateResult);
          } else {
            io.sockets.emit('useActionSpace', baseResponse.BAD_REQUEST);
            return;
          }
          return;
        } else {
          if (data.goods[0].name === 'wood') {
            let updateResult = await gameService.updateGoods(
              data.userId,
              data.roomId,
              data.goods
            );
            io.sockets.emit('useActionSpace', updateResult);
          } else {
            io.sockets.emit('useActionSpace', baseResponse.BAD_REQUEST);
            return;
          }
        }
      } else if (data.actionName === 'Add Field') {
        let addFieldResult = await gameService.addField(
          data.userId,
          data.roomId,
          data.goods[0]
        );
        if (addFieldResult.isSuccess == false) {
          io.sockets.emit('useActionSpace', baseResponse.BAD_REQUEST);
        } else {
          let updateResult = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.sockets.emit('useActionSpace', updateResult);
        }
      }
      // 누적칸 사용하기
      else if (data.actionName === 'Use Accumulated Goods') {
        const excludedWord = 'Accumulated';

        const regexPattern = new RegExp(`${excludedWord}.*`, 'i');

        const extractedString = data.goods[0].name.replace(regexPattern, '');

        let accResult = await gameService.useAccumulatedGoods(
          data.roomId,
          data.goods[0].name
        );
        if (accResult.isSuccess === false) {
          io.sockets.emit('useActionSpace', accResult);
          return;
        }
        data.goods[0].name = extractedString;

        let updateResult = await gameService.updateGoods(
          data.userId,
          data.roomId,
          data.goods
        );

        if (updateResult.isSuccess === false) {
          io.sockets.emit('useActionSpace', updateResult);
          return;
        }
        io.sockets.emit('useActionSpace', { accResult, updateResult });
      } else {
        let updateResult = await gameService.updateGoods(
          data.userId,
          data.roomId,
          data.goods
        );
        io.sockets.emit('useActionSpace', updateResult);
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
          let updatedRooms = await roomService.getRooms();
          io.sockets.emit('updatedRooms', updatedRooms);
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

        let updatedRooms = await roomService.getRooms();
        io.sockets.emit('updatedRooms', updatedRooms);
        // TODO: 방 안에도 보내주는 emit 필요
        let playerInRoom = await roomService.findUserListByRoomId(roomId);
        io.sockets.emit('exitRoom', playerInRoom);
      } catch (err) {
        console.log(err);
        io.sockets.emit('exitRooms', errResponse(baseResponse.SERVER_ERROR));
      }
    }

    async function enterLobby() {
      try {
        let updatedRooms = await roomService.getRooms();
        io.sockets.emit('updatedRooms', updatedRooms);
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
            let updatedRooms = await roomService.getRooms();
            io.sockets.emit('updatedRooms', updatedRooms);
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

            let updatedRooms = await roomService.getRooms();
            io.sockets.emit('updatedRooms', updatedRooms);
            // TODO: 방 안에도 보내주는 emit 필요
            let playerInRoom = await roomService.findUserListByRoomId(roomId);
            io.sockets.emit('joinRoom', playerInRoom);
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
            io.sockets.emit('skipGame', updatedPlayer);
          }
        } catch (err) {
          console.log(err);
          io.sockets.emit('skipGame', errResponse(baseResponse.SERVER_ERROR));
        }
      }
    }

    async function accumulateGoods(data) {
      let roomId = data.roomId;
      let accList = data.accList;
      let updateResult = await gameService.accumulateGoods(roomId, accList);
      io.sockets.emit('accumulateGoods', updateResult);
    }
  });
};
