const Sequelize = require("sequelize");
const config = require("./config.json");
const { logger } = require("../utils/logger");

let env = process.env.NODE_ENV;
if (!env) {
  env = "development";
}

logger.info("Running in", env, "mode");

const sequelize = new Sequelize(
  process.env.DB_DATABASE || config[env].database,
  process.env.DB_USER || config[env].username,
  process.env.DB_PASSWORD || config[env].password,
  {
    host: process.env.DB_HOST || config[env].host,
    port: process.env.DB_PORT || config[env].port,
    dialect: config[env].dialect,
    logging: false
  }
);

module.exports = sequelize;
