module.exports = (sequelize, DataTypes) => {
  const UserGameRoom = sequelize.define(
    'UserGameRoom',
    {
      room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      timestamps: false,
    }
  );
  return UserGameRoom;
};
