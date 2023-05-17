'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.createTable('GameRooms',{
      room_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      room_name: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      limit_num: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      participant_num: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      host_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    })
  },

  async down (queryInterface, Sequelize) {
    queryInterface.dropTable('GameRooms');
  }
};
