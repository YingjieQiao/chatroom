const niceware = require('niceware');  
const moment = require('moment');      
const utils = require('./utils');
const classes = require('./classes');
const db = require('./db');

const bind = function (wss) {
    const users = {};

    wss.on('connection', async function (ws, req) {
        const username = niceware.generatePassphrase(4).join('-');
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const country = await utils.getCountryCode(ip);
        const timestamp = moment().unix();

        const user = new classes.User(ws, username, ip, country);
        users[username] = user;
        db.startUserSession(user);
        
        // send msg to all users
        ws.send(JSON.stringify({
            type: "WELCOME",
            time: timestamp,
            receiver: user.visible, // visible attributes
        }));

        broadcast(null, JSON.stringify({
            type: "UPDATE_STATE",
            time: timestamp,
            state: { users: Object.values(users).map(user => user.visible) },
        }));

        broadcast(null, JSON.stringify({
            type: "ADMIN_MESSAGE",
            time: timestamp,
            text: `${username} has joined the chat!`,
        }))

        ws.on('message', async function (payload) {
            const timestamp = moment().unix();

            try {
                const text = JSON.parse(payload).text;
                const containsProfanity = await utils.containsProfanity(text);

                if (containsProfanity) {
                    await db.addMessageRecord({
                        sender: user.visible,
                        time: timestamp,
                        visible: false,
                        text: text
                    });

                    ws.send(JSON.stringify({
                        type: "ERROR",
                        time: timestamp,
                        text: `The following message contained profanity and was not sent:\n${text}`,
                    }));
                    return;
                }

                await db.addMessageRecord({
                    sender: user.visible,
                    time: timestamp,
                    visible: true,
                    text: text
                });

                broadcast(user, JSON.stringify({
                    type: "USER_MESSAGE",
                    time: timestamp,
                    sender: user.visible,
                    text: text,
                }))
            }
            catch (e) {
                console.log(e.message);
                return;
            }

        });
    });


    // the disconnection event is fired when a user closes the websocket connection,
    // or when a users client does not respond to ping messages
    wss.on('disconnection', async function (ws) {
        const timestamp = moment().unix();

        // get the user object corresponding to the disconnected websocket connection
        // and delete the user from the users object
        const user = Object.values(users).find((user) => user.ws == ws);
        delete users[user.username];
        if (!user) {
            return;
        }

        db.endUserSession(user);
        delete users[user.username];

        broadcast(null, JSON.stringify({
            type: "UPDATE_STATE",
            time: timestamp,
            state: { users: Object.values(users).map(user => user.visible) },
        }))

        broadcast(null, JSON.stringify({
            type: "ADMIN_MESSAGE",
            time: timestamp,
            text: `${user.username} has left the chat.`,
        }))
    });


    /**
     * Utility Function - Broadcasts text to all users except the sender
     * @param {classes.User} sender classes.Users object. null if message sent from admin.
     * @param {String} text message text.
     */
    const broadcast = function (sender, message) {
        Object.values(users).forEach((user) => {
            if (!sender || sender.ws != user.ws) {
                user.ws.send(message);
            }
        });
    }
};

module.exports = {
    bind,
}