require('dotenv').config();
const express = require('express');
const dbSync = require("./src/utils/dbsync.js");
const db = require("./src/models");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./src/utils/swagger.js").swaggerSpec
const winston = require("winston");
const { logger, combinedFormat } = require("./src/utils/logger.js");

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

logger.add(
  new winston.transports.Console({
    format: combinedFormat,
  })
);

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec))

require('./src/routes/user.route.js')(app)
require('./src/routes/account.route.js')(app)

if (process.env.NODE_ENV == "development") {
  db.sequelize.sync();
}else {
  dbSync()
}

const PORT = process.env.SERVER_PORT || 8080;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
