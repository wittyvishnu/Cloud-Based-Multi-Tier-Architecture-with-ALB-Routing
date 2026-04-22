require('dotenv').config();
const { PostLike, PostComment } = require('../models');
const { redisClient } = require('../config/redis');
const { getChannel } = require('../config/rabbitmq');

async function processPostStats() {
  const channel = getChannel(); //
  const queue = 'post_interaction_sync';

  channel.consume(queue, async (msg) => {
    if (msg) {
      const { postId } = JSON.parse(msg.content.toString());
      
      // 1. Re-calculate counts from RDS
      const [likes, comments] = await Promise.all([
        PostLike.count({ where: { postId } }),
        PostComment.count({ where: { postId } })
      ]);

      const engagement = { likes, comments };

      // 2. Update Engagement Cache with short expiry (1 min)
      await redisClient.setEx(`post:engagement:${postId}`, 60, JSON.stringify(engagement));
      
      channel.ack(msg);
    }
  });
}