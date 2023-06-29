const sequelize = require("../config/db.config.js");
const Sequelize = require("sequelize");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../models/user.model.js")(sequelize, Sequelize)
db.refreshToken = require("../models/refreshToken.model.js")(sequelize, Sequelize)
db.account = require("../models/account.model.js")(sequelize, Sequelize)

db.refreshToken.belongsTo(db.user, {
  foreignKey: "userId",
  targetKey: "id",
});
db.user.hasOne(db.refreshToken, {
  foreignKey: "userId",
  targetKey: "id",
});
db.account.belongsTo(db.user, {
  foreignKey: 'userId',
  targetKey: 'id',
  onDelete: 'CASCADE',
});
db.user.hasOne(db.account, {
  foreignKey: 'userId',
  targetKey: 'id',
});


module.exports = db;