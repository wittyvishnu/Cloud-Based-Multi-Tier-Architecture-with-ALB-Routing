// src/models/Post.js
module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      field: 'image_urls' // Re-add this if your DB column is underscored
    },
    // Map the Sequelize timestamps to the database snake_case columns
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at' 
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at' 
    }
  }, {
    tableName: 'Posts', 
    timestamps: true 
  });

  return Post;
};