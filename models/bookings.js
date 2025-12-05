'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class bookings extends
      Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        bookings.belongsTo(models.users, { foreignKey: 'customer_id', as: 'customer' });
        bookings.belongsTo(models.rooms, { foreignKey: 'room_id', as: 'room' });
        bookings.belongsTo(models.promotions, { foreignKey: 'promotion_id', as: 'promotion' });

    }
  }
  bookings.init({
      id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
      },
      customer_id:{
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
      },
      room_id:{
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'rooms',
                key: 'id'
            }
      },
      start_time:{
            type: DataTypes.DATE, //example '2024-10-10 14:00:00'
            allowNull: false
      },
      end_time:{
            type: DataTypes.DATE,
            allowNull: false
      },
      total_price:{
            type: DataTypes.DECIMAL(10,3),
            allowNull: false
      },
      promotion_id:{
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'promotions',
                key: 'id'
            }
      },
      status:{
            type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
            allowNull: false,
            defaultValue: 'pending'
      },
  }, {
    sequelize,
    modelName: 'bookings',
  });
  return bookings;
};