module.exports = (sequelize, Sequelize) => {
    const Account = sequelize.define("account", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
      },
      phone: {
        type: Sequelize.STRING,
      },
      birthdate: {
        type: Sequelize.DATEONLY,
      },
      gender: {
        type: Sequelize.STRING,
      },
      bio: {
        type: Sequelize.STRING,
      },
      avatar: {
        type: Sequelize.BLOB,
      },
    });
  
    return Account;
  };
  