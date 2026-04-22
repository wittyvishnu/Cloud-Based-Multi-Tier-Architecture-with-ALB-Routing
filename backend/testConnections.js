require('dotenv').config();
console.log("Password loaded from env:", process.env.DB_PASSWORD);
console.log("User loaded from env:", process.env.DB_USER);
const { Client } = require('pg');

async function connectDB() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { 
      rejectUnauthorized: false 
    }
  });

  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    return client;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

connectDB();