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

db.users.hasMany(db.gameroom,{
    foreignKey: 'host_id',
    allowNull: false,
    constraints: true,
    onDelete: 'cascade',
})

db.gameroom.belongsTo(db.users,{
    foreignKey: 'host_id',
})

module.exports = db;
