// src/models/PostLike.js
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const PostLike = sequelize.define('PostLike', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Use Sequelize's built-in UUIDV4
      primaryKey: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Posts', // CRITICAL: Capital 'P' to match the Post model
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'PostLikes', 
    indexes: [{ unique: true, fields: ['postId', 'userId'] }]
  });

  return PostLike;
};