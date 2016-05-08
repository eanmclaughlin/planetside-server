/**
 * Created by Pepper on 4/30/2016.
 */

var charZoneCache = {};

var PopulationTracker = function (PlanetsideDatabase) {
        this.processEvent = function (event) {
            if (event.event_name === 'PlayerLogout') {
                if (charZoneCache[event.character_id])
                    delete charZoneCache[event.character_id];
                PlanetsideDatabase.collections.Generated.OnlinePlayer.remove({character_id: event.character_id}, (err) => {
                    if (err) console.log(err);
                });
            }
            else if (event.event_name === 'PlayerLogin') {
                charZoneCache[event.character_id] = false;

                var loginPlayer = {
                    character_id: event.character_id,
                    world_id: event.world_id,
                    login: event.timestamp
                };

                if (event.character) {
                    if (event.character.faction_id)
                        loginPlayer.faction_id = event.character.faction_id;
                    if (event.character.outfit && event.character.outfit.outfit_id)
                        loginPlayer.outfit_id = event.character.outfit.outfit_id;
                }

                PlanetsideDatabase.collections.Generated.OnlinePlayer.collection.insert(loginPlayer, (err) => {
                    if (err) console.log(err);
                })
            }
            else if (event.character_id) {
                if (charZoneCache.hasOwnProperty(event.character_id)) {
                    if (event.zone) {
                        if (charZoneCache[event.character_id] != event.zone_id) {
                            charZoneCache[event.character_id] = event.zone_id;

                            PlanetsideDatabase.collections.Generated.OnlinePlayer.update({character_id: event.character_id}, {$set: {zone_id: event.zone_id}}, (err) => {
                                if (err) console.log(err);
                            });
                        }
                    }
                }
                else {
                    charZoneCache[event.character_id] = false;
                    var onlinePlayer = {
                        character_id: event.character_id,
                        world_id: event.world_id,
                        login: event.timestamp
                    };

                    if (event.character) {
                        if (event.character.faction_id)
                            onlinePlayer.faction_id = event.character.faction_id;
                        if (event.character.outfit && event.character.outfit.outfit_id)
                            onlinePlayer.outfit_id = event.character.outfit.outfit_id;
                    }

                    if (event.zone_id) {
                        charZoneCache[event.character_id] = event.zone_id;
                        onlinePlayer.zone_id = event.zone_id;
                    }

                    PlanetsideDatabase.collections.Generated.OnlinePlayer.collection.insert(onlinePlayer, (err) => {
                        if (err) console.log(err);
                    })
                }
            }
        };

        this.getPopulationForWorld = function (world_id) {
            return this.getFullPopulation().then((pops) => {
                return pops[world_id];
            })
        };

        this.getFullPopulation = function () {
            var factions = PlanetsideDatabase.collections.Locals.Faction,
                zoneCache = PlanetsideDatabase.collections.Locals.Zone,
                worlds = PlanetsideDatabase.collections.Locals.World;

            return PlanetsideDatabase.collections.Generated.OnlinePlayer.aggregate([
                {
                    $group: {
                        _id: {
                            world: '$world_id',
                            faction: '$faction_id',
                            zone: '$zone_id'
                        },
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]).exec().then(function (result) {
                var pops = {
                    global: {
                        total: 0
                    },
                    worlds: {}
                };

                result.forEach((res) => {
                    var world = worlds[res._id.world].name.en,
                        count = res.count;

                    if (res._id.faction)
                        faction = factions[res._id.faction].name.en;
                    else
                        faction = 'Unknown';

                    if (zoneCache[res._id.zone])
                        zone = zoneCache[res._id.zone].name.en;
                    else
                        zone = 'Koltyr';

                    pops.global.total += count;
                    if (!pops.global[faction]) pops.global[faction] = 0;
                    pops.global[faction] += count;

                    if (!pops.worlds[world])
                        pops.worlds[world] = {
                            total: 0,
                            zones: {}
                        };

                    if (!pops.worlds[world][faction]) pops.worlds[world][faction] = 0;
                    pops.worlds[world][faction] += count;
                    pops.worlds[world].total += count;

                    if (!pops.worlds[world].zones[zone])
                        pops.worlds[world].zones[zone] = {
                            total: 0
                        };

                    if (!pops.worlds[world].zones[zone][faction]) pops.worlds[world].zones[zone][faction] = 0;
                    pops.worlds[world].zones[zone][faction] += count;
                    pops.worlds[world].zones[zone].total += count;
                });

                return pops;
            });
        }
    }
    ;

module.exports = PopulationTracker;
