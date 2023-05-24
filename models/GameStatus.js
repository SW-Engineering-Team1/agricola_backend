module.exports = (sequelize, DataTypes) => {
  const GameStatus = sequelize.define(
    'GameStatus',
    {
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
      isMyTurn: {
        type: DataTypes.BOOLEAN,
      },
      orderNum: {
        type: DataTypes.INTEGER,
      },
      sheepNum: {
        type: DataTypes.INTEGER,
      },
      pigNum: {
        type: DataTypes.INTEGER,
      },
      cowNum: {
        type: DataTypes.INTEGER,
      },
      woodNum: {
        type: DataTypes.INTEGER,
      },
      sandNum: {
        type: DataTypes.INTEGER,
      },
      reedNum: {
        type: DataTypes.INTEGER,
      },
      stoneNum: {
        type: DataTypes.INTEGER,
      },
      grainOnStorageNum: {
        type: DataTypes.INTEGER,
      },
      vegeOnStorageNum: {
        type: DataTypes.INTEGER,
      },
      grainOnFieldNum: {
        type: DataTypes.INTEGER,
      },
      vegeOnFieldNum: {
        type: DataTypes.INTEGER,
      },
      grainDoingNum: {
        type: DataTypes.INTEGER,
      },
      vegeDoingNum: {
        type: DataTypes.INTEGER,
      },
      remainedFence: {
        type: DataTypes.INTEGER,
      },
      remainedChild: {
        type: DataTypes.INTEGER,
      },
      remainedFamily: {
        type: DataTypes.INTEGER,
      },
      adultNum: {
        type: DataTypes.INTEGER,
      },
      babyNum: {
        type: DataTypes.INTEGER,
      },
      woodHouseNumber: {
        type: DataTypes.INTEGER,
      },
      sandHouseNum: {
        type: DataTypes.INTEGER,
      },
      stoneHouseNum: {
        type: DataTypes.INTEGER,
      },
      fieldNum: {
        type: DataTypes.INTEGER,
      },
      foodNum: {
        type: DataTypes.INTEGER,
      },
      remainedJobCard: {
        type: DataTypes.JSON,
      },
      usedJobCard: {
        type: DataTypes.JSON,
      },
      remainedMainFacilityCard: {
        type: DataTypes.JSON,
      },
      usedMainFacilityCard: {
        type: DataTypes.JSON,
      },
      remainedSubFacilityCard: {
        type: DataTypes.JSON,
      },
      usedSubFacilityCard: {
        type: DataTypes.JSON,
      },
      numOfBeggingToken: {
        type: DataTypes.INTEGER,
      }
    },
    {
      timestamps: false,
    }
  );
  return GameStatus;
};