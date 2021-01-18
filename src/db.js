const { Sequelize, DataTypes } = require('sequelize');
const moment = require('moment');
const classes = require('./classes');

const DATABASE_URL = process.env.DATABASE_URL || 'sqlite::memory';

const sequelize = new Sequelize(DATABASE_URL, {
    dialectOptions: {
        ssl: true
    }
});

const UserSession = sequelize.define('Session', {
    username: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    ip: {
        type: DataTypes.STRING,
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    start_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.INTEGER,
    }
}, {
    timestamps: false,
});

const UserMessage = sequelize.define('Message', {
    sender: {
        type: DataTypes.STRING,
        references: { model: UserSession, key: 'username' },
    },
    visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    time: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    text: {
        type: DataTypes.STRING(4096),
        allowNull: false,
    }
}, {
    timestamps: false
});

/**
 * Adds a new user session record
 * @param {classes.User} user 
 */
const startUserSession = async function (user) {
    await UserSession.create({
        ...user,
        start_time: moment().unix(),
    });
}

/**
 * Updates the user session record with the end time
 * @param {classes.User} user 
 */
const endUserSession = async function (user) {
    await UserSession.update({ end_time: moment().unix() },
        { where: { username: user.username } });
}

/**
 * Add a new messsage record
 * @param {classes.UserMessage} message 
 */
const addMessageRecord = async function (message) {
    await UserMessage.create({
        ...message,
        sender: message.sender.username,
    })
}

sequelize.sync();

module.exports = {
    startUserSession,
    endUserSession,
    addMessageRecord,
};