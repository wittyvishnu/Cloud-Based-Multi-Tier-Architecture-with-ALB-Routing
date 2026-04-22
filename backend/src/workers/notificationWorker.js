require('dotenv').config();
const amqp = require('amqplib');
const { Post, Comment, Notification } = require('../models');

async function startNotificationWorker() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'notification_queue'; // Dedicated queue name

    await channel.assertQueue(queue, { durable: true });
    console.log(`[*] Worker listening for alerts on ${queue}...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const { targetId, actorId, type } = JSON.parse(msg.content.toString());
        
        try {
            console.log(`[Worker] Processing notification: ${type} by User ${actorId} on Target ${targetId}`);
          let recipientId = null;

          // 1. Resolve Recipient using Unified Model Logic
          if (type === 'like_post' || type === 'comment_post') {
            const post = await Post.findByPk(targetId);
            recipientId = post?.userId;
          } 
          else if (type === 'like_comment' || type === 'comment_comment') {
            const comment = await Comment.findByPk(targetId);
            recipientId = comment?.userId;
          } 
          else if (type === 'follow') {
            recipientId = targetId; 
          }

          // 2. Create Notification (Skip if User is interacting with their own content)
          if (recipientId && recipientId !== actorId) {
            await Notification.create({
              userId: recipientId,
              actorId,
              type,
              targetId,
              isRead: false
            });
            console.log(`[Notification Created] ${type} for user ${recipientId}`);
          }

          channel.ack(msg);
        } catch (error) {
          console.error("Worker Processing Error:", error.message);
          channel.nack(msg); 
        }
      }
    });
  } catch (error) {
    console.error("Worker Connection Error:", error.message);
  }
}

startNotificationWorker();