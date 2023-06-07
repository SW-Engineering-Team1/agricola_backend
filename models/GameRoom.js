module.exports = (sequelize, DataTypes) => {
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
      woodAccumulated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      sandAccumulated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      reedAccumulated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      foodAccumulated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      sheepAccumulated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      stoneAccumulatedWest: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      pigAccumulated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      cowAccumulated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      stoneAccumulatedEast: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
    }
  );
  return GameRoom;
};
