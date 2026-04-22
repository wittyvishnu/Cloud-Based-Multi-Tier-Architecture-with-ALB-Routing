const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 1. Import Models
const User = require('./User')(sequelize, DataTypes);
const Post = require('./Post')(sequelize, DataTypes); 
const Comment = require('./comment')(sequelize, DataTypes); 
const PostLike = require('./PostLike')(sequelize, DataTypes);
const CommentLike = require('./CommentLike')(sequelize, DataTypes);
const Follow = require('./Follow')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);

/**
 * RELATIONS & ASSOCIATIONS
 */

// --- User & Post ---
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// --- Unified Commenting System ---
Post.hasMany(Comment, { foreignKey: 'targetId', constraints: false, as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'targetId', constraints: false, as: 'post' });

Comment.hasMany(Comment, { 
  foreignKey: 'targetId', 
  constraints: false, 
  as: 'replies', 
  scope: { targetType: 'comment' } 
});
Comment.belongsTo(Comment, { foreignKey: 'targetId', constraints: false, as: 'parent' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'userComments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Likes ---
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'postLikes', onDelete: 'CASCADE' });
PostLike.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

Comment.hasMany(CommentLike, { foreignKey: 'commentId', as: 'commentLikes', onDelete: 'CASCADE' });
CommentLike.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });

User.hasMany(PostLike, { foreignKey: 'userId', as: 'likedPosts' });
User.hasMany(CommentLike, { foreignKey: 'userId', as: 'likedComments' });

// --- Follows ---
User.belongsToMany(User, { through: Follow, as: 'followersList', foreignKey: 'leaderId', otherKey: 'followerId' });
User.belongsToMany(User, { through: Follow, as: 'followingList', foreignKey: 'followerId', otherKey: 'leaderId' });
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'leaderId', as: 'leader' });

// --- Notifications (Dual User Relationship) ---
// 1. The Recipient (Owner of the content)
User.hasMany(Notification, { foreignKey: 'userId', as: 'receivedNotifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });

// 2. The Actor (The person who triggered the alert)
User.hasMany(Notification, { foreignKey: 'actorId', as: 'triggeredNotifications' });
Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' }); // <-- Fixed Alias

/**
 * DATABASE SYNC
 */
/**
 * DATABASE SYNC
 */
sequelize.sync({ alter: true })
  .then(async () => {
    console.log("Database & Unified Comment table synced!");
    
    // ADD THIS TEMPORARY LINE to destroy the ghost constraints
    await PostLike.sync({ force: true });
    console.log("PostLikes table FORCE RECREATED to fix fkey1!");
    
  })
  .catch(err => console.error("Sync Error: ", err.message));

module.exports = { 
  sequelize, 
  User, 
  Post, 
  Comment, 
  PostLike, 
  CommentLike, 
  Follow, 
  Notification 
};