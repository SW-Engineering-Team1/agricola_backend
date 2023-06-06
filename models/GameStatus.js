module.exports = (sequelize, DataTypes) => {
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
        type: DataTypes.JSON,
        defaultValue: [],
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

  return GameStatus;
};
