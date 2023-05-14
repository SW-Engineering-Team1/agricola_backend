module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.STRING(20),
            allowNull: false,
            primaryKey: true,
        },
        password: {
            type: DataTypes.STRING(128),
            allowNull: false,
        },
        salt: {
            type: DataTypes.STRING(128),
            allowNull: false,
        },
    });
    return User;
};
