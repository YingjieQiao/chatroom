const noop = function () { };

const heartbeat = function () {
    this.heartbeat.isAlive = true;
}

const bind = function (wss) {
    wss.on('connection', function connection(ws) {
        ws.heartbeat = { isAlive: true };
        ws.on('pong', heartbeat);
        ws.on('close', () => { wss.emit('disconnection', ws) });
    })

    const interval = setInterval(function ping() {
        wss.clients.forEach(function each(ws) {
            if (ws.heartbeat.isAlive === false) {
                wss.emit('disconnection', ws);
                ws.terminate();
                return;
            };

            ws.heartbeat.isAlive = false;
            ws.ping(noop);
        });
    }, 1000);

    wss.on('close', function close() {
        clearInterval(interval);
    });
}

module.exports = {
    bind,
}
