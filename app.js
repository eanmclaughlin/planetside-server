var SubscriptionFilter = require('./lib/EventFilter');
var app = require('express')();
var http = require('http').Server(app);
var SocketServer = require('./lib/SocketServer')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

http.listen(3000, function () {
    console.log("listening on :3000");
});
