const db = require('../models');
const { logger } = require('../utils/logger');
const User = db.user

const checkDuplicateUsername = (req, res, next) => {
    if (!req.body.username) return next();
    User.findOne({
        where: {
            username: req.body.username,
        },
    }).then((user) => {
        if (user) {
            logger.warn('Failed! Username is already in use!')
            res.status(400).send({
              message: "Failed! Username is already in use!",
            });
            return;
          }
          next();
    });
};

const verifyUser = {
    checkDuplicateUsername: checkDuplicateUsername,
};
  
module.exports = verifyUser;