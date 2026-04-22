const { Sequelize } = require('sequelize');

const dialectOptions = {};
if (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') {
  dialectOptions.ssl = { rejectUnauthorized: false };
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions,
      }
    );

module.exports = { sequelize };
