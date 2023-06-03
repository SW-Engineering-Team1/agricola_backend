module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define(
    'Card',
    {
      cardName: {
        type: DataTypes.STRING(45),
        allowNull: false,
        primaryKey: true,
      },
      cardCost: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      cardScore: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );
  return Card;
};
