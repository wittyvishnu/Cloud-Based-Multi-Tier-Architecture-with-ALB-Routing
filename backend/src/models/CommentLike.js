// src/models/CommentLike.js
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const CommentLike = sequelize.define('CommentLike', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    commentId: {
      type: DataTypes.UUID,
      allowNull: false,
      // CRITICAL: Point to the new unified table
      references: {
        model: 'Comments', 
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    indexes: [{ unique: true, fields: ['commentId', 'userId'] }]
  });

  return CommentLike;
};