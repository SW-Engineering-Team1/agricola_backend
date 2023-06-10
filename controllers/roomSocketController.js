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
    socket.on('startGame', startGame);
    socket.on('getRooms', getRooms);

    async function getRooms() {
      try {
        let updatedRooms = await roomService.getRooms();
        io.sockets.emit('updatedRooms', updatedRooms);
      } catch (err) {
        console.log(err);
        io.sockets.emit('getRooms', errResponse(baseResponse.SERVER_ERROR));
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
  });
};
