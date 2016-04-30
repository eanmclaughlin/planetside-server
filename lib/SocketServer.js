/**
 * Created by ean.mclaughlin on 4/25/2016.
 */
var socketio = require('socket.io');
var config = require('../config/default.json');
var EventFilter = require('./EventFilter');
var Promise = require('bluebird');
var PlanetsideSocket = new (require('planetside-websocket'))({service_id: 's:conneryopsnight'});

var DatabaseQueue;
var CensusCache;

PlanetsideSocket.on('open', function () {
    PlanetsideSocket.send(JSON.stringify(config.ps2websocket.default));
});

var SocketServer = function (express, PlanetsideDatabase, AlertTracker, opts) {
    DatabaseQueue = new (require('./DatabaseQueue'))(PlanetsideDatabase);
    CensusCache = new (require('./CensusCache'))(PlanetsideDatabase);
    this.io = socketio(express);
    this.live = this.io.of('/live');

    this.live.on('connection', (client) => {
        client.on('subscribe', (addSub) => {
            console.log('client sub', addSub);
            addSub = JSON.parse(addSub);
            if (client.subscription)
                client.subscription.subscribe(addSub);
            else
                client.subscription = new EventFilter(addSub);
        });

        client.on('unsubscribe', (removeSub) => {
            removeSub = JSON.parse(removeSub);
            if (client.subscription)
                client.subscription.unsubscribe(removeSub);
        });
    });

    PlanetsideSocket.on('event', (event) => {
        if (PlanetsideDatabase.collections.Events[event.event_name]) {
            // DatabaseQueue.saveEvent(event);

            CensusCache.processEvent(event).then((filledEvent) => {
                // AlertTracker.processEvent(filledEvent);
                // SessionTracker.processEvent(filledEvent);
                var filter = getEventFilterData(filledEvent);
                Object.keys(this.live.sockets).forEach((socket) => {
                    if (this.live.sockets[socket].subscription && this.live.sockets[socket].subscription.match(filter)) {
                        this.live.sockets[socket].emit('event', filledEvent);
                    }
                })
            })
        }
    });

    PlanetsideSocket.on('heartbeat', (data) => {
    })
};

function getEventFilterData(event) {
    var temp = Object.assign({}, event);
    Object.keys(temp).forEach((value)=> {
        if (temp[value])
            temp[value] = temp[value].toString();
    });

    var filterData = {};

    if (temp.world_id) {
        if (!filterData.worlds)
            filterData.worlds = [];
        filterData.worlds.push(temp.world_id);
    }

    if (temp.zone_id) {
        if (!filterData.zones)
            filterData.zones = [];
        filterData.zones.push(temp.zone_id);
    }

    if (temp.character_id) {
        if (!filterData.characters)
            filterData.characters = [];
        filterData.characters.push(temp.character_id);
    }
    if (temp.character && temp.character.outfit_id) {
        if (!filterData.outfits)
            filterData.outfits = [];
        filterData.outfits.push(temp.character.outfit_id);
    }

    if (temp.attacker_character_id) {
        if (!filterData.characters)
            filterData.characters = [];
        filterData.characters.push(temp.attacker_character_id);

    }
    if (temp.attacker && temp.attacker.outfit_id) {
        if (!filterData.outfits)
            filterData.outfits = [];
        filterData.outfits.push(temp.attacker.outfit_id);
    }

    if (temp.attacker_weapon_id) {
        if (!filterData.weapons)
            filterData.weapons = [];
        filterData.weapons.push(temp.attacker_weapon_id);
    }

    if (temp.vehicle_id) {
        if (!filterData.vehicles)
            filterData.vehicles = [];
        filterData.vehicles.push(temp.vehicle_id);
    }
    if (temp.attacker_vehicle_id) {
        if (!filterData.vehicles)
            filterData.vehicles = [];
        filterData.vehicles.push(temp.attacker_vehicle_id);
    }

    if (temp.achievement_id) {
        if (!filterData.achievements)
            filterData.achievements = [];
        filterData.achievements.push(temp.achievement_id);
    }

    if (temp.experience_id) {
        if (!filterData.experience_temps)
            filterData.experience_temps = [];
        filterData.experience_temps.push(temp.experience_id);
    }

    if (temp.event_name) {
        if (!filterData.events)
            filterData.events = [];
        filterData.events.push(temp.event_name);
    }

    if (temp.facility_id) {
        if (!filterData.facilities)
            filterData.facilities = [];
        filterData.facilities.push(temp.facility_id);
    }

    return filterData;
}

module.exports = SocketServer;