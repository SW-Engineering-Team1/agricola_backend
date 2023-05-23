const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const roomService = require('../services/roomService');

module.exports = function (io) {
  io.on('connection', function (socket) {
    socket.on('createRoom', createRoom);
    socket.on('getRooms', getRooms);
    socket.on('joinRoom', joinRoom);
    socket.on('exitRoom', exitRoom);
    socket.on('enterLobby', enterLobby);

    async function exitRoom(data) {
      try {
        let userId = data.userId;
        let roomId = data.roomId;

        let isHost = await roomService.checkIsHost(roomId, userId);

        // 로직 확인 필요
        // 호스트일 경우 방을 삭제하는 거? ㅇㅋ 그럼 이 때 emit은 어디로 해야하는가
        if (isHost) {
          // Delete the room
          await roomService.deleteRoom(roomId);
          io.sockets.emit('exitRoom', response(baseResponse.SUCCESS));
          return;
        }

        // Check if the user is in the room
        let isInRoom = await roomService.checkIsInRoom(roomId, userId);
        if (!isInRoom) {
          io.sockets.emit(
            'exitRooms',
            errResponse(baseResponse.ROOM_NOT_JOINED)
          );
          io.sockets.emit("exitRoom", errResponse(baseResponse.ROOM_NOT_JOINED));
          return;
        }

        // Subtract the participant number
        await roomService.calParticipantNum(roomId, false);

        // Delete the user from the room
        let exitRoomResult = await roomService.exitRoom(roomId, userId);
        io.sockets.emit('exitRooms', exitRoomResult);
      } catch (err) {
        console.log(err);
        io.sockets.emit('exitRooms', errResponse(baseResponse.SERVER_ERROR));
      }
    }

    async function enterLobby() {
      try {
        let getRoomsResult = await roomService.getRooms();
        io.sockets.emit('getRooms', getRoomsResult);
      } catch (err) {
        console.log(err);
        io.sockets.emit('getRooms', errResponse(baseResponse.SERVER_ERROR));
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
            io.sockets.emit('createRoom', createResult);
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
            let joinRoomResult = await roomService.joinRoom(roomId, userId);
            socket.join(parseInt(roomId));
            io.sockets.emit('joinRoom', joinRoomResult);
          }
        }
      } catch (err) {
        console.log(err);
        io.sockets.emit('joinRoom', errResponse(baseResponse.SERVER_ERROR));
      }
    }
  });
};
