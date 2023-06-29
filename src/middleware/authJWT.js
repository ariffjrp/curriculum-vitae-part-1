const jwt = require('jsonwebtoken');
const config = require('../config/auth.config.js');
const { logger } = require('../utils/logger.js');
const { TokenExpiredError } = jwt

const catchError = (err, res) => {
    if (err instanceof TokenExpiredError ){
        logger.warn('Unauthorized! Access Token was expired!')
        res.status(401).send({
            message: "Unauthorized! Access Token was expired!",
        })
    }
    logger.warn('Unauthorized! Access Token')
    res.status(401).send({ message: "Unauthorized! Access Token"})
}

const verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token']

    if (!token) {
         logger.warn('No token provided!')
        return res.status(403).send({
            message: "No token provided!",
        })
    }
    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            logger.error("Token verification error:", err); // Tambahkan log di sini
            return catchError(err, res);
        }
        req.userId = decoded.id;
        next();
    })
}

const authJwt = {
    verifyToken: verifyToken,
}

module.exports = authJwt
