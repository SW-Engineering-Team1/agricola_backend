const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('sys', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',
});

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

describe('my awesome project', () => {
  let io, serverSocket, clientSocket;

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

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('should work', (done) => {
    clientSocket.on('hello', async (arg) => {
      // let tmp = JSON.parse(arg);
      let roomId = 2;
      let userId = 'test1';
      let goodsName = 'Stove';
      const gameRoom = await GameRoom.findOne({
        where: {
          room_id: roomId,
        },
      });
      // console.log(gameRoom.dataValues);
      const playerStatus = await GameStatus.findOne({
        where: {
          roomId: roomId,
          userId: userId,
        },
      });
      // console.log(playerStatus.dataValues);
      if (gameRoom.dataValues.remainedMainFacilityCard.includes(goodsName)) {
        console.log('테스트 성공');
        // 업데이트
        const updatedRemainedMainFacilityCard =
          gameRoom.dataValues.remainedMainFacilityCard.filter(
            (card) => card != goodsName
          );
        const updatedUsedMainFacilityCard =
          playerStatus.dataValues.usedMainFacilityCard.concat(goodsName);
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
      } else {
        console.log('테스트 실패');
      }
      expect(arg).toBe('world');
      done();
    });
    serverSocket.emit(
      'hello',
      // '{"roomId": 2, "userId": "test1", "goodsName": "테스트"}'
      'world'
    );
  });
});
