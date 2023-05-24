module.exports = (sequelize, DataTypes) => {
  const GameStatus = sequelize.define(
    'GameStatus',
    {
      // roomId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      //   primaryKey: true,
      // },
      // userId: {
      //   type: DataTypes.STRING(20),
      //   allowNull: false,
      //   primaryKey: true,
      // },
      isMyTurn: {
        type: DataTypes.BOOLEAN,
      },
      order: {
        type: DataTypes.INTEGER,
      },
      sheep: {
        type: DataTypes.INTEGER,
      },
      pig: {
        type: DataTypes.INTEGER,
      },
      cow: {
        type: DataTypes.INTEGER,
      },
      wood: {
        type: DataTypes.INTEGER,
      },
      sand: {
        type: DataTypes.INTEGER,
      },
      reed: {
        type: DataTypes.INTEGER,
      },
      stone: {
        type: DataTypes.INTEGER,
      },
      grainOnStorage: {
        type: DataTypes.INTEGER,
      },
      vegeOnStorage: {
        type: DataTypes.INTEGER,
      },
      grainOnField: {
        type: DataTypes.INTEGER,
      },
      vegeOnField: {
        type: DataTypes.INTEGER,
      },
      grainDoing: {
        type: DataTypes.INTEGER,
      },
      vegeDoing: {
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
      adult: {
        type: DataTypes.INTEGER,
      },
      baby: {
        type: DataTypes.INTEGER,
      },
      woodHouse: {
        type: DataTypes.INTEGER,
      },
      sandHouse: {
        type: DataTypes.INTEGER,
      },
      stoneHouse: {
        type: DataTypes.INTEGER,
      },
      field: {
        type: DataTypes.INTEGER,
      },
      food: {
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
      },
    },
    {
      timestamps: false,
    }
  );

  return GameStatus;
};
