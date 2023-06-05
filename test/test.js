const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('sys', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',
});

// 테스트에서 사용될 데이터베이스 연결 - 게임방방방방
const GameRoom = sequelize.define(
  'GameRoom',
  {
    room_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    room_name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    limit_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    participant_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    host_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    remainedMainFacilityCard: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    timestamps: false,
  }
);

// 테스트에서 사용될 데이터베이스 연결 - 게임방 유저
const GameStatus = sequelize.define(
  'GameStatuses',
  {
    isMyTurn: {
      type: DataTypes.BOOLEAN,
    },
    order: {
      type: DataTypes.INTEGER,
    },
    nextOrder: {
      type: DataTypes.INTEGER,
    },
    sheep: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    pig: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    cow: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    wood: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    fence: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    cageArea: {
      type: DataTypes.INTEGER,
      dafaultValue: 0,
    },
    sand: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stone: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    grainOnStorage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    vegeOnStorage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    grainOnField: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    vegeOnField: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    grainDoing: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    vegeDoing: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    remainedFence: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    remainedChild: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    remainedFamily: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    family: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
    baby: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    woodHouse: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
    sandHouse: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stoneHouse: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    field: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    food: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    remainedJobCard: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    usedJobCard: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    usedMainFacilityCard: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    remainedSubFacilityCard: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    usedSubFacilityCard: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    numOfBeggingToken: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: false,
  }
);

describe('Unit test', () => {
  let io, serverSocket, clientSocket;

  // 테스트 전에 서버, 소켓, 데이터베이스 연결
  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      const sequelize = new Sequelize('sys', 'root', '1234', {
        host: 'localhost',
        dialect: 'mysql',
      });
      new Promise(async (resolve) => {
        await sequelize.sync();
        resolve();
      });
      clientSocket.on('connect', done);
    });
  });

  // 테스트 후에 서버, 소켓, 데이터베이스 연결 해제
  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  // 주요설비 사용 - 정상동작
  test('use main facility - ok', (done) => {
    clientSocket.on('test1', async () => {
      // 주요 설비를 사용할 방 id
      let roomId = 2;

      // 주요 설비를 사용할 유저 id
      let userId = 'test2';

      // 사용할 주요 설비 이름
      let goodsName = 'Stove';

      // 에러를 위한 변수
      let e;

      // 업데이트 된 유저의 상태
      let updatedStatus;

      // 방이 존재하는지 확인
      const gameRoom = await GameRoom.findOne({
        where: {
          room_id: roomId,
        },
      });
      if (!gameRoom) {
        e = () => {
          // 방이 존재하지 않으면 에러
          throw new Error('NO_ROOM');
        };
      } else {
        const playerStatus = await GameStatus.findOne({
          where: {
            roomId: roomId,
            userId: userId,
          },
        });
        if (!playerStatus) {
          e = () => {
            // 유저가 존재하지 않으면 에러
            throw new Error('NO_USER');
          };
        } else {
          // 주요 설비가 남아있는지 확인
          if (
            gameRoom.dataValues.remainedMainFacilityCard.includes(goodsName)
          ) {
            // 사용 이후 남은 주요 설비
            const updatedRemainedMainFacilityCard =
              gameRoom.dataValues.remainedMainFacilityCard.filter(
                (card) => card != goodsName
              );
            // 유저가 사용한 주요 설비
            const updatedUsedMainFacilityCard =
              playerStatus.dataValues.usedMainFacilityCard.concat(goodsName);
            // 유저의 주요 설비 업데이트
            await GameStatus.update(
              {
                usedMainFacilityCard: updatedUsedMainFacilityCard,
              },
              {
                where: {
                  userId: userId,
                },
              }
            );
            // 방의 주요 설비 업데이트
            await GameRoom.update(
              {
                remainedMainFacilityCard: updatedRemainedMainFacilityCard,
              },
              {
                where: {
                  room_id: roomId,
                },
              }
            );
            updatedStatus = await GameStatus.findOne({
              where: {
                roomId: roomId,
                userId: userId,
              },
            });
          } else {
            // 이미 사용한 주요 설비면 에러
            e = () => {
              throw new Error('ALREADY_USED');
            };
          }
        }
      }
      expect(updatedStatus.dataValues.usedMainFacilityCard).toContain(
        goodsName
      );
      done();
    });
    serverSocket.emit('test1');
  });

  // 주요설비 사용 - 방이 존재하지 않음
  test('use main facility - no room', (done) => {
    clientSocket.on('test2', async () => {
      // 주요 설비를 사용할 방 id
      let roomId = 11112;

      // 주요 설비를 사용할 유저 id
      let userId = 'test2';

      // 사용할 주요 설비 이름
      let goodsName = 'Stove';

      // 에러를 위한 변수
      let e;

      // 방이 존재하는지 확인
      const gameRoom = await GameRoom.findOne({
        where: {
          room_id: roomId,
        },
      });
      if (!gameRoom) {
        e = () => {
          // 방이 존재하지 않으면 에러
          throw new Error('NO_ROOM');
        };
      } else {
        const playerStatus = await GameStatus.findOne({
          where: {
            roomId: roomId,
            userId: userId,
          },
        });
        if (!playerStatus) {
          e = () => {
            // 유저가 존재하지 않으면 에러
            throw new Error('NO_USER');
          };
        } else {
          // 주요 설비가 남아있는지 확인
          if (
            gameRoom.dataValues.remainedMainFacilityCard.includes(goodsName)
          ) {
            // 사용 이후 남은 주요 설비
            const updatedRemainedMainFacilityCard =
              gameRoom.dataValues.remainedMainFacilityCard.filter(
                (card) => card != goodsName
              );
            // 유저가 사용한 주요 설비
            const updatedUsedMainFacilityCard =
              playerStatus.dataValues.usedMainFacilityCard.concat(goodsName);
            // 유저의 주요 설비 업데이트
            await GameStatus.update(
              {
                usedMainFacilityCard: updatedUsedMainFacilityCard,
              },
              {
                where: {
                  userId: userId,
                },
              }
            );
            // 방의 주요 설비 업데이트
            await GameRoom.update(
              {
                remainedMainFacilityCard: updatedRemainedMainFacilityCard,
              },
              {
                where: {
                  room_id: roomId,
                },
              }
            );
          } else {
            // 이미 사용한 주요 설비면 에러
            e = () => {
              throw new Error('ALREADY_USED');
            };
          }
        }
      }
      expect(e).toThrowError('NO_ROOM');
      done();
    });
    serverSocket.emit('test2');
  });

  // 주요설비 사용 - 유저가 존재하지 않음
  test('use main facility - no user', (done) => {
    clientSocket.on('test3', async () => {
      // 주요 설비를 사용할 방 id
      let roomId = 2;

      // 주요 설비를 사용할 유저 id
      let userId = '이런 이름은 없지용';

      // 사용할 주요 설비 이름
      let goodsName = 'Stove';

      // 에러를 위한 변수
      let e;

      // 방이 존재하는지 확인
      const gameRoom = await GameRoom.findOne({
        where: {
          room_id: roomId,
        },
      });
      if (!gameRoom) {
        e = () => {
          // 방이 존재하지 않으면 에러
          throw new Error('NO_ROOM');
        };
      } else {
        const playerStatus = await GameStatus.findOne({
          where: {
            roomId: roomId,
            userId: userId,
          },
        });
        if (!playerStatus) {
          e = () => {
            // 유저가 존재하지 않으면 에러
            throw new Error('NO_USER');
          };
        } else {
          // 주요 설비가 남아있는지 확인
          if (
            gameRoom.dataValues.remainedMainFacilityCard.includes(goodsName)
          ) {
            // 사용 이후 남은 주요 설비
            const updatedRemainedMainFacilityCard =
              gameRoom.dataValues.remainedMainFacilityCard.filter(
                (card) => card != goodsName
              );
            // 유저가 사용한 주요 설비
            const updatedUsedMainFacilityCard =
              playerStatus.dataValues.usedMainFacilityCard.concat(goodsName);
            // 유저의 주요 설비 업데이트
            await GameStatus.update(
              {
                usedMainFacilityCard: updatedUsedMainFacilityCard,
              },
              {
                where: {
                  userId: userId,
                },
              }
            );
            // 방의 주요 설비 업데이트
            await GameRoom.update(
              {
                remainedMainFacilityCard: updatedRemainedMainFacilityCard,
              },
              {
                where: {
                  room_id: roomId,
                },
              }
            );
          } else {
            // 이미 사용한 주요 설비면 에러
            e = () => {
              throw new Error('ALREADY_USED');
            };
          }
        }
      }
      expect(e).toThrowError('NO_USER');
      done();
    });
    serverSocket.emit('test3');
  });

  // 주요설비 사용 - 이미 사용한 설비
  test('use main facility - already used', (done) => {
    clientSocket.on('test4', async () => {
      // 주요 설비를 사용할 방 id
      let roomId = 2;

      // 주요 설비를 사용할 유저 id
      let userId = 'test2';

      // 사용할 주요 설비 이름
      let goodsName = 'Stove';

      // 에러를 위한 변수
      let e;

      // 방이 존재하는지 확인
      const gameRoom = await GameRoom.findOne({
        where: {
          room_id: roomId,
        },
      });
      if (!gameRoom) {
        e = () => {
          // 방이 존재하지 않으면 에러
          throw new Error('NO_ROOM');
        };
      } else {
        const playerStatus = await GameStatus.findOne({
          where: {
            roomId: roomId,
            userId: userId,
          },
        });
        if (!playerStatus) {
          e = () => {
            // 유저가 존재하지 않으면 에러
            throw new Error('NO_USER');
          };
        } else {
          // 주요 설비가 남아있는지 확인
          if (
            gameRoom.dataValues.remainedMainFacilityCard.includes(goodsName)
          ) {
            // 사용 이후 남은 주요 설비
            const updatedRemainedMainFacilityCard =
              gameRoom.dataValues.remainedMainFacilityCard.filter(
                (card) => card != goodsName
              );
            // 유저가 사용한 주요 설비
            const updatedUsedMainFacilityCard =
              playerStatus.dataValues.usedMainFacilityCard.concat(goodsName);
            // 유저의 주요 설비 업데이트
            await GameStatus.update(
              {
                usedMainFacilityCard: updatedUsedMainFacilityCard,
              },
              {
                where: {
                  userId: userId,
                },
              }
            );
            // 방의 주요 설비 업데이트
            await GameRoom.update(
              {
                remainedMainFacilityCard: updatedRemainedMainFacilityCard,
              },
              {
                where: {
                  room_id: roomId,
                },
              }
            );
          } else {
            // 이미 사용한 주요 설비면 에러
            e = () => {
              throw new Error('ALREADY_USED');
            };
          }
        }
      }
      expect(e).toThrowError('ALREADY_USED');
      done();
    });
    serverSocket.emit('test4');
  });
});
