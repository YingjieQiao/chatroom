// db models

class User {
    /**
     * Creates a User object.
     * @param {WebSocket} ws WebSocket object associated with the user
     * @param {String} username Name assigned to the user
     * @param {String} ip IP address of the user
     * @param {String} country ISO-3166 2-character country code of the user
     */
    constructor(ws, username, ip, country) {
        this.ws = ws;
        this.username = username;
        this.ip = ip;
        this.country = country;
    }

    /**
     * Returns the visible attributes of the User object
     */
    get visible() {
        return {
            username: this.username,
            country: this.country,
        }
    }
}


module.exports = {
    User,
};
