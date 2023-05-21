'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.createTable('UserGameRooms',{
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
    })
  },

  async down (queryInterface, Sequelize) {
    queryInterface.dropTable('UserGameRooms');
  }
};
