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

    socket.on('useActionSpace', useActionSpace);

    async function useActionSpace(data) {
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
          let updatedPlayer = await utilities.addSubFacility(data.goods, data.userId, data.roomId, isExist);
          io.to(data.roomId).emit('useActionSpace', updatedPlayer);
        }
        else {
          response(baseResponse.NOT_ENOUGHDATA);
        }
      }
      // 씨뿌리기 이벤트
      else if (data.actionName === "Grain Utilization") {
        let updateResult = await utilities.sowSeed(data.userId, data.goods);
        io.to(data.roomId).emit('useActionSpace', updateResult);
      }
      // 빵 굽기 이벤트
      else if (data.actionName === "Bake Bread") {
        let updateResult = await utilities.bakeBread(data.userId, data.goods);
        io.to(data.roomId).emit('useActionSpace', updateResult);
      }
      else if (data.actionName === 'Meeting Place') {
        // 시작 플레이어 되기 그리고 보조 설비 1개 내려놓기
        if (data.goods.length === 2) {
          // 시작 플레이어 되기
          let updateOrderResult = await gameService.updateOrder(
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
              io.to(data.roomId).emit('useActionSpace', cardResult);
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
              io.to(data.roomId).emit('useActionSpace', updateOrderResult);
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
                io.to(data.roomId).emit('useActionSpace', cardResult);
                return;
              }
            } else {
              io.to(data.roomId).emit(
                'useActionSpace',
                baseResponse.INVALID_CARD_NAME
              );
              io.sockets.emit('useActionSpace', baseResponse.INVALID_CARD_NAME);
            }
          }
          let updateResult = await gameService.getPlayerStatus(
            data.userId,
            data.roomId
          );
          io.to(data.roomId).emit('useActionSpace', updateResult);
          // io.sockets.emit('useActionSpace', updateResult);
        }
      } else {
        // else
        let updateResult = await gameService.updateGoods(
          data.userId,
          data.goods
        );
        io.to(data.roomId).emit('useActionSpace', updateResult);
        // io.sockets.emit('useActionSpace', updateResult);
      }
    }

    async function patchGameStatus(data) {
      try {
        await roomService.patchGameStatus(data);
        let gameStatus = await roomService.getGameStatus(data.roomId);
        console.log(gameStatus);
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
  });
};
