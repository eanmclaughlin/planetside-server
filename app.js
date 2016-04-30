var app = require('express')();
var http = require('http').Server(app);
var config = require('./config/default.json');

var AlertTracker = require('./lib/AlertTracker');
var PlanetsideDatabase = new (require('planetside-database'))(config.database);
var SocketServer = require('./lib/SocketServer')(http, PlanetsideDatabase, AlertTracker);


app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

http.listen(3000, function () {
    console.log("listening on :3000");
});
