const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const roomService = require('../services/roomService');

module.exports = function (io) {
  io.on('connection', function (socket) {
    socket.on('enterLobby', enterLobby);
    socket.on('createRoom', createRoom);
    // socket.on('getRooms', getRooms);
    socket.on('joinRoom', joinRoom);
    socket.on('exitRoom', exitRoom);

    socket.on('useActionSpace', useActionSpace);

    async function useActionSpace (data){
      if(data.actionName == '어쩌고'){
        // logic
      }

    }

    socket.on('patchGameStatus', patchGameStatus);

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
        io.sockets.emit('patchRoomList', errResponse(baseResponse.SERVER_ERROR));
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
