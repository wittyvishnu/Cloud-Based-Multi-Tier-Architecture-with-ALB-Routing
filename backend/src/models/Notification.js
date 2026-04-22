module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Built-in Sequelize UUID generation
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false, // The Recipient (Owner of content)
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: false, // The person who triggered the alert
    },
    type: {
      type: DataTypes.ENUM('like_post', 'like_comment', 'comment_post', 'comment_comment', 'follow'),
      allowNull: false, 
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true, // ID of Post or Comment to link the user to the content
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Notification;
};