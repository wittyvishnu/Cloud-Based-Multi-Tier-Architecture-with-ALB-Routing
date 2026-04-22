const amqp = require('amqplib');

let connection = null;
let channel = null;

async function connectRabbitMQ() {
  try {
    // Connect using the URL from your backend/.env file
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    console.log('✔ RabbitMQ connected');

    // Create a channel for sending/receiving messages
    channel = await connection.createChannel();

    // Setup a default queue for your DevOps tasks
    const queueName = 'devops_tasks';
    await channel.assertQueue(queueName, {
      durable: true // Ensures messages survive if RabbitMQ restarts
    });

  } catch (error) {
    console.error('RabbitMQ Connection Error:', error);
    process.exit(1); // Stop the server if RabbitMQ fails to connect
  }
}

// Helper function so you can use this channel in your routes/controllers
function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel is not initialized!');
  }
  return channel;
}

module.exports = { connectRabbitMQ, getChannel };