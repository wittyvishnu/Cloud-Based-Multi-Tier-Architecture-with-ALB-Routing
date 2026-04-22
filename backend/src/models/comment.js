const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false, // Can be a Post UUID or a Comment UUID
    },
    targetType: {
      type: DataTypes.ENUM('post', 'comment'),
      allowNull: false, // Helps differentiate top-level from nested
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
  });

  return Comment;
};