const { Sequelize, DataTypes } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];

const db = {};

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
);

db.Sequelize = Sequelize;
db.sequelize = sequelize;

sequelize
    .sync({ force: false })
    .then(() => {
        console.log('Database connected');
    })
    .catch((err) => {
        console.error(err);
    });

db.users = require('./User.js')(sequelize, DataTypes);
db.gameroom = require('./GameRoom.js')(sequelize, DataTypes);
db.user_gameroom = require('./UserGameRoom.js')(sequelize, DataTypes);
db.game_status = require('./GameStatus.js')(sequelize, DataTypes);

// Making one-to-many relationship between users and gamerooms
db.users.hasMany(db.gameroom,{
    foreignKey: 'host_id',
    allowNull: false,
    constraints: true,
    onDelete: 'cascade',
})

db.gameroom.belongsTo(db.users,{
    foreignKey: 'host_id',
})

// Making many-to-many relationship between users and gamerooms through user_gameroom
db.users.hasMany(db.user_gameroom,{
    foreignKey: 'user_id',
    allowNull: false,
    constraints: true,
    onDelete: 'cascade',
})

db.gameroom.hasMany(db.user_gameroom,{
    foreignKey: 'room_id',
    allowNull: false,
    constraints: true,
    onDelete: 'cascade',
})

db.user_gameroom.belongsTo(db.users,{
    foreignKey: 'user_id',
})

db.user_gameroom.belongsTo(db.gameroom,{
    foreignKey: 'room_id',
})


db.game_status.belongsTo(db.gameroom,{
    foreignKey: 'roomId',
    targetKey: 'room_id',
    onDelete: 'cascade',

})

db.game_status.belongsTo(db.users,{
    foreignKEy: 'userId',
    targetKey: 'id',
    onDelete: 'cascade',
})


module.exports = db;
