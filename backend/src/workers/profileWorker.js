// workers/profileWorker.js
require('dotenv').config();
const { connectRabbitMQ, getChannel } = require('../config/rabbitmq');
const { redisClient } = require('../config/redis');
const { getFullUserDetails } = require('../controllers/authController');

async function startWorker() {
  try {
    // 1. Connect to RabbitMQ
    await connectRabbitMQ();
    const channel = getChannel();
    const queueName = 'user_profile_sync';

    // 2. Ensure the queue exists
    await channel.assertQueue(queueName, { durable: true });
    
    // 3. Prefetch: Don't overwhelm this worker (process 1 at a time)
    channel.prefetch(1);

    console.log(`✔ Profile Worker is running and watching [${queueName}]`);

    // 4. Start consuming
    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        const { userId } = JSON.parse(msg.content.toString());
        
        try {
          console.log(`[Worker] Processing stats for User ID: ${userId}`);
          
          // Fetch full details (aggregates counts from DB)
          const details = await getFullUserDetails(userId);
          
          // Update Redis with a 5-minute (300s) expiration as requested
          await redisClient.setEx(
            `user:profile:${userId}`, 
            300, 
            JSON.stringify({ user: details })
          );

          console.log(`[Worker] Successfully cached profile for ${userId}`);
          channel.ack(msg); // Tell RabbitMQ the task is done
        } catch (err) {
          console.error(`[Worker] Error processing ${userId}:`, err.message);
          // Re-queue the message to try again later
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (error) {
    console.error("Worker Startup Error:", error);
  }
}

startWorker();