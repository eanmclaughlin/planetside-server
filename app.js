var app = require('express')();
var http = require('http').Server(app);
var config = require('./config/default.json');

var PlanetsideDatabase = new (require('planetside-database'))(config.database);

var AlertTracker = new (require('./lib/AlertTracker'))(PlanetsideDatabase);
var PopulationTracker = new (require('./lib/PopulationTracker'))(PlanetsideDatabase);

var SessionTracker;

var SocketServer = require('./lib/SocketServer')(http, PlanetsideDatabase, AlertTracker, PopulationTracker);


app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

http.listen(3000, function () {
    console.log("listening on :3000");
});
