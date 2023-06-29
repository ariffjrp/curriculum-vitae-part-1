const db = require('../models')
const { registerSchema, loginSchema, updatePasswordSchema, updateUsernameSchema, deleteAccountSchema } = require('../validations/user.validation.js');
const config = require('../config/auth.config.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

const User = db.user
const RefreshToken = db.refreshToken
const Account = db.account

exports.register = (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Error occcured: ${errorMessage}`)
    return res.status(400).json({ message: errorMessage });
  }
  const { username, email, password, repeatPassword, name } = value;

  if (password !== repeatPassword) {
    logger.warn(`Password dan konfirmasi password tidak sesuai`)
    return res.status(400).json({ message: 'Password dan konfirmasi password tidak sesuai' });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  User.create({
    username: username,
    password: hashedPassword,
    repeatPassword: hashedPassword,
  })
    .then((user) => {
      Account.create({
        name: name,
        email: email,
        userId: user.id,
      })
        .then(() => {
          res.status(201).send({
            message: "User was created successfully!",
          });
        })
        .catch((err) => {
          logger.error(err.message)
          res.status(500).send({
            message: "Failed to create user. Please check application log.",
          });
        });
    })
    .catch((err) => {
      logger.error(err.message)
      res.status(500).send({
        message: "Failed to create user. Please check application log.",
      });
    });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    logger.warn(`Refresh Token is required`);
    return res.status(401).send({
      message: 'Refresh Token is required!'
    });
  }

  try {
    let foundRefreshToken = await RefreshToken.findOne({
      where: {
        token: refreshToken
      }
    });

    if (!foundRefreshToken) {
      logger.warn('Refresh token is not in database!')
      return res.status(400).send({
        message: 'Refresh token is not in database!'
      });
    }

    if (RefreshToken.verifyExpiration(foundRefreshToken)) {
      await RefreshToken.destroy({ where: { id: foundRefreshToken.id } });
      logger.warn('Refresh token has expired, please make a new signin request')
      return res.status(403).send({
        message: 'Refresh token has expired. Please make a new signin request'
      });
    }

    const user = await foundRefreshToken.getUser();
    let newAccessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      config.secret,
      {
        expiresIn: config.jwtExpiration
      }
    );

    return res.status(200).send({
      accessToken: newAccessToken,
      refreshToken: foundRefreshToken.token,
    });
  } catch (err) {
    logger.error(err.message)
    return res.status(500).send({
      message: 'Failed to generate access token. Please check application log.',
    });
  }
};

exports.Login = (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Error occcured: ${errorMessage}`)
    return res.status(400).json({ message: errorMessage });
  }

  User.findOne({
    where : {
      username : req.body.username,
    },
  }).then(async (user) => {
    if (!user) {
      logger.warn('Username is not registered. Check the username again.')
      return res.status(400).send({
        message: "Username is not registered. Check the username again.",
      })
    }

    let passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    )

    if (!passwordIsValid) {
      logger.warn('invalid password!')
      return res.status(401).send({
        message: "invalid Password!"
      })
    }

    let token = jwt.sign({ id: user.id}, config.secret, {
      expiresIn: config.jwtExpiration
    })

    let refreshToken = await RefreshToken.createToken(user);

    res.status(200).send({
      id: user.id,
      username: user.username,
      accessToken: token,
      refreshToken: refreshToken,
    })
  })
  .catch((err) => {
    logger.error(err.message)
    res.status(500).send({
      message: "Failed to login. Please check application log.",
    });
  })
}

exports.updatePassword = (req, res) => {
  const { error } = updatePasswordSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Error occcured: ${errorMessage}`)
    return res.status(400).json({ message: errorMessage });
  }

  const { oldPassword, newPassword, repeatPassword } = req.body;

  if (newPassword !== repeatPassword) {
    logger.warn(`Kata sandi baru dan konfirmasi kata sandi tidak cocok.`)
    return res.status(400).send({
      message: "Kata sandi baru dan konfirmasi kata sandi tidak cocok.",
    });
  }

  User.findOne({
    where: {
      id: req.userId,
    },
  })
    .then((user) => {
      if (!user) {
        logger.warn('Pengguna tidak ditemukan.')
        return res.status(404).send({
          message: "Pengguna tidak ditemukan.",
        });
      }

      const passwordIsValid = bcrypt.compareSync(oldPassword, user.password);

      if (!passwordIsValid) {
        logger.warn('kata sandi lama tidak valid.')
        return res.status(401).send({
          message: "Kata sandi lama tidak valid.",
        });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 8);

      user.update({
        password: hashedPassword,
        repeatPassword: hashedPassword, 
      })
        .then(() => {
          res.status(200).send({
            message: "Kata sandi berhasil diperbarui.",
          });
        })
        .catch((err) => {
          logger.error(err.message)
          res.status(500).send({
            message: "Gagal memperbarui kata sandi. Silakan coba lagi nanti.",
          });
        });
    })
    .catch((err) => {
      logger.error(err.message)
      res.status(500).send({
        message: "Gagal mengambil data pengguna. Harap periksa log aplikasi.",
      });
    });
};

exports.updateUsername = (req, res) => {
  const { error } = updateUsernameSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Error occcured: ${errorMessage}`)
    return res.status(400).json({ message: errorMessage });
  }

  const { newUsername } = req.body;

  // Periksa apakah pengguna dengan username baru sudah ada
  User.findOne({
    where: {
      username: newUsername,
    },
  })
    .then((user) => {
      if (user) {
        logger.warn('Username already exists.')
        return res.status(400).send({
          message: 'Username already exists.',
        });
      }

      // Perbarui username pengguna dalam database
      User.update(
        { username: newUsername },
        {
          where: {
            id: req.userId,
          },
        }
      )
        .then(() => {
          res.status(200).send({
            message: 'Username updated successfully.',
          });
        })
        .catch((err) => {
          logger.error(err.message)
          res.status(500).send({
            message: 'Failed to update username. Please try again later.',
          });
        });
    })
    .catch((err) => {
      logger.error(err.message)
      res.status(500).send({
        message: 'Failed to fetch user data. Please check application logs.',
      });
    });
};

exports.logOut = (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    logger.warn('No token provided!')
    return res.status(401).send({
      message: 'No token provided!'
    });
  }

  res.clearCookie('token'); // Menggunakan res.clearCookie() untuk menghapus cookie

  res.status(200).send({
    message: 'Logout successful!'
  });
};

exports.deleteAccount = (req, res) => {
  const userId = req.userId; // Mendapatkan ID pengguna dari token akses

  const { error } = deleteAccountSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Error occcured: ${errorMessage}`)
    return res.status(400).json({ message: errorMessage });
  }

  const { username } = req.body; // Mendapatkan username dari permintaan

  User.findOne({
    where: {
      id: userId,
    },
    include: [Account], // Menggabungkan model Account
  })
    .then((user) => {
      if (!user) {
        logger.warn('User not found.')
        return res.status(404).send({
          message: 'User not found.',
        });
      }

      // Memverifikasi nama pengguna
      if (user.username !== username) {
        logger.warn('Invalid username. Please enter your username correctly.')
        return res.status(400).send({
          message: 'Invalid username. Please enter your username correctly.',
        });
      }

      User.destroy({
        where: {
          id: userId,
        },
      })
        .then(() => {
          res.status(200).send({
            message: 'Account deleted successfully.',
          });
        })
        .catch((err) => {
          logger.error(err.message)
          res.status(500).send({
            message: 'Failed to delete account. Please try again later.',
          });
        });
    })
    .catch((err) => {
      logger.error(err.message)
      res.status(500).send({
        message: 'Failed to find user. Please try again later.',
      });
    });
};

