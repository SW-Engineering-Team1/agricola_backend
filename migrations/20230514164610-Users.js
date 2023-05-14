'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        queryInterface.createTable('Users', {
            id: {
                type: Sequelize.STRING(20),
                allowNull: false,
                primaryKey: true,
            },
            password: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
            salt: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        queryInterface.dropTable('Users');
    },
};
