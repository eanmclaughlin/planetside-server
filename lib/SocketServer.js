/**
 * Created by ean.mclaughlin on 4/25/2016.
 */
var socketio = require('socket.io');
var config = require('../config/default.json');
var PlanetsideSocket = new (require('planetside-websocket'))();
var PlanetsideDatabase = new (require('planetside-database'))();
var EventFilter = require('./EventFilter');

PlanetsideSocket.on('open', function () {
    PlanetsideSocket.send(JSON.stringify(config.ps2websocket.default));
});


var SocketServer = function (express, opts) {
    this.io = socketio(express);
    this.live = this.io.of('/live');

    this.live.on('connection', (client) => {
        client.on('subscribe', (newSub) => {
            if (client.subscription)
                client.subscription.subscribe(JSON.parse(newSub));
            else
                client.subscription = new EventFilter(JSON.parse(newSub));
        })
    });

    PlanetsideSocket.on('event', (event) => {
        if (PlanetsideDatabase.collections.Events[event.event_name]) {
            var model = new PlanetsideDatabase.collections.Events[event.event_name](event);
            model.fill('world');
            var modelObj = model.toObject({virtuals: true});
            modelObj.received = modelObj.received.getTime();
            var filter = getEventFilterData(modelObj);

            Object.keys(this.live.sockets).forEach((socket) => {
                if (this.live.sockets[socket].subscription && this.live.sockets[socket].subscription.match(filter)) {
                    this.live.sockets[socket].emit('event', modelObj);
                }
            })
        }
    });
};

function getEventFilterData(event) {
    var filterData = {};

    if (event.world_id) {
        if (!filterData.worlds)
            filterData.worlds = [];
        filterData.worlds.push(event.world_id);
    }

    if (event.zone_id) {
        if (!filterData.zones)
            filterData.zones = [];
        filterData.zones.push(event.zone_id);
    }

    if (event.character_id) {
        if (!filterData.characters)
            filterData.characters = [];
        filterData.characters.push(event.character_id);
    }
    if (event.character && event.character.outfit_id) {
        if (!filterData.outfits)
            filterData.outfits = [];
        filterData.outfits.push(event.character.outfit_id);
    }

    if (event.attacker_character_id) {
        if (!filterData.characters)
            filterData.characters = [];
        filterData.characters.push(event.attacker_character_id);

    }
    if (event.attacker && event.attacker.outfit_id) {
        if (!filterData.outfits)
            filterData.outfits = [];
        filterData.outfits.push(event.attacker.outfit_id);
    }

    if (event.attacker_weapon_id) {
        if (!filterData.weapons)
            filterData.weapons = [];
        filterData.weapons.push(event.attacker_weapon_id);
    }

    if (event.vehicle_id) {
        if (!filterData.vehicles)
            filterData.vehicles = [];
        filterData.vehicles.push(event.vehicle_id);
    }
    if (event.attacker_vehicle_id) {
        if (!filterData.vehicles)
            filterData.vehicles = [];
        filterData.vehicles.push(event.attacker_vehicle_id);
    }

    if (event.achievement_id) {
        if (!filterData.achievements)
            filterData.achievements = [];
        filterData.achievements.push(event.achievement_id);
    }

    if (event.experience_id) {
        if (!filterData.experience_events)
            filterData.experience_events = [];
        filterData.experience_events.push(event.experience_id);
    }

    if (event.event_name) {
        if (!filterData.events)
            filterData.events = [];
        filterData.events.push(event.event_name);
    }

    if (event.facility_id) {
        if (!filterData.facilities)
            filterData.facilities = [];
        filterData.facilities.push(event.facility_id);
    }

    return filterData;
}

module.exports = SocketServer;