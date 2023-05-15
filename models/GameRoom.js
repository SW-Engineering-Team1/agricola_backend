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
    },
    {
      timestamps: false,
    }
  );
  return GameRoom;
};
