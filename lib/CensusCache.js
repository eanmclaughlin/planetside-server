/**
 * Created by ean.mclaughlin on 4/28/2016.
 */
var QueryUtils = require('../util/QueryUtils');
var Promise = require('bluebird');

var CensusCache = function (PlanetsideDatabase) {
    var Census = PlanetsideDatabase.collections.Census;
    var pendingRequests = {
        outfits: {},
        characters: {},
        items: {},
        achievements: {},
        experiences: {},
        facilities: {}
    };

    this.processEvent = function (event) {
        // var fillFields = getFillFields(event);

        if (event.world_id)
            event.world = PlanetsideDatabase.collections.Locals.World[event.world_id];
        if (event.zone_id)
            event.zone = PlanetsideDatabase.collections.Locals.Zone[event.zone_id] || {name: {en: 'Koltyr'}};

        if (event.facility_id && event.facility_id > 0) {
            event.facility = this.findOrRetrieveFacility(event.facility_id);
        }

        if (event.achievement_id) {
            event.achievement = this.findOrRetrieveAchievement(event.achievement_id);
        }
        if (event.experience_id) {
            event.experience = this.findOrRetrieveExperience(event.experience_id);
        }

        if (event.character_id) {
            event.character = this.findOrRetrieveCharacter(event.character_id);
        }
        if (event.attacker_character_id) {
            event.attacker = this.findOrRetrieveCharacter(event.attacker_character_id);
        }

        if (event.vehicle_id) {
            event.character_vehicle = PlanetsideDatabase.collections.Locals.Vehicle[event.vehicle_id];
        }
        if (event.attacker_vehicle_id) {
            event.attacker_vehicle = PlanetsideDatabase.collections.Locals.Vehicle[event.attacker_vehicle_id];
        }

        if (event.attacker_weapon_id) {
            event.attacker_weapon = this.findOrRetrieveItem(event.attacker_weapon_id);
        }

        if (event.character_loadout_id) {
            event.character_loadout = PlanetsideDatabase.collections.Locals.Loadout[event.character_loadout_id];
        }
        if (event.attacker_loadout_id) {
            event.attacker_loadout = PlanetsideDatabase.collections.Locals.Loadout[event.attacker_loadout_id];
        }

        if (event.previous_faction >= 0) {
            event.previous = PlanetsideDatabase.collections.Locals.Faction[event.previous_faction];
        }
        if (event.triggering_faction >= 0) {
            event.triggering = PlanetsideDatabase.collections.Locals.Faction[event.triggering_faction];
        }
        if (event.new_faction_id >= 0) {
            event.new_faction = PlanetsideDatabase.collections.Locals.Faction[event.new_faction_id];
        }
        if (event.old_faction_id >= 0) {
            event.old_faction = PlanetsideDatabase.collections.Locals.Faction[event.old_faction_id];
        }
        if (event.faction_id >= 0) {
            event.faction = PlanetsideDatabase.collections.Locals.Faction[event.faction_id];
        }

        if (event.outfit_id) {
            event.outfit = this.findOrRetrieveOutfit(event.outfit_id);
        }

        if (event.metagame_event_id) {
            event.metagame_event = PlanetsideDatabase.collections.Locals.MetagameEvent[event.metagame_event_id];
        }
        if (event.metagame_event_state) {
            event.metagame_state = PlanetsideDatabase.collections.Locals.MetagameEventState[event.metagame_event_state];
        }


        return Promise.props(event);
    };

    this.findOrRetrieveOutfit = function (outfit_id) {
        return Census.Outfit.findOne({outfit_id: outfit_id}).lean().exec().then(function (outfit) {
            if (!outfit) return Promise.reject('No outfit found in DB for id ' + outfit_id + ', retrieving.');

            return outfit;
        }).catch(function () {
            if (pendingRequests.outfits[outfit_id])
                return pendingRequests.outfits[outfit_id];
            else {
                var apiPromise = QueryUtils.retrieveOutfit(outfit_id).then(function (outfit) {
                    Census.Outfit.create(outfit, (err) => {
                        if (err) console.log(err);
                    });

                    return outfit;
                });

                pendingRequests.outfits[outfit_id] = apiPromise;
                return apiPromise;
            }
        });
    };

    this.findOrRetrieveCharacter = function (character_id) {
        return Census.Character.findOne({character_id: character_id}).lean().exec().then(function (character) {
            if (!character)
                return Promise.reject('No character found in DB for id ' + character_id + ', retrieving.');

            return character;
        }).then(function (character) {
            character.faction = PlanetsideDatabase.collections.Locals.Faction[character.faction_id];
            return character;
        }).catch(function () {
            if (pendingRequests.characters[character_id])
                return pendingRequests.characters[character_id];
            else {
                var apiPromise = QueryUtils.retrieveCharacter(character_id).then(function (retrievedCharacter) {
                    Census.Character.create(retrievedCharacter, (err) => {
                        if (err) console.log(err);
                    });

                    return retrievedCharacter;
                }).then(function (character) {
                    character.faction = PlanetsideDatabase.collections.Locals.Faction[character.faction_id];
                    return character;
                });

                pendingRequests.characters[character_id] = apiPromise;
                return apiPromise;
            }
        });
    };

    this.findOrRetrieveItem = function (item_id) {
        return Census.Item.findOne({item_id: item_id}).lean().exec().then(function (item) {
            if (!item) return Promise.reject('No item found in DB for id ' + item_id + ', retrieving.');

            return item;
        }).then(function (item) {
            item.faction = PlanetsideDatabase.collections.Locals.Faction[item.faction_id];
            return item;
        }).catch(function () {
            if (pendingRequests.items[item_id])
                return pendingRequests.items[item_id];
            else {
                var apiPromise = QueryUtils.retrieveWeaponAsItem(item_id).then(function (item) {
                    Census.Item.create(item, (err) => {
                        if (err) console.log(err);
                    });

                    return item;
                }).then(function (item) {
                    item.faction = PlanetsideDatabase.collections.Locals.Faction[item.faction_id];
                    return item;
                });

                pendingRequests.items[item_id] = apiPromise;
                return apiPromise;
            }
        });
    };

    this.findOrRetrieveAchievement = function (achievement_id) {
        return Census.Achievement.findOne({achievement_id: achievement_id}).exec().then(function (achievement) {
            if (!achievement) return Promise.reject('No achievement found in DB for id ' + achievement_id + ', retrieving.');

            return achievement;
        }).catch(function () {
            if (pendingRequests.achievements[achievement_id])
                return pendingRequests.achievements[achievement_id];
            else {
                var apiPromise = QueryUtils.retrieveAchievement(achievement_id).then(function (retrievedAchievement) {
                    Census.Achievement.create(retrievedAchievement, (err) => {
                        if (err) console.log(err);
                    });
                    return retrievedAchievement;
                });

                pendingRequests.achievements[achievement_id] = apiPromise;
                return apiPromise;
            }
        });
    };

    this.findOrRetrieveExperience = function (experience_id) {
        return Census.Experience.findOne({experience_id: experience_id}).lean().exec().then(function (experience) {
            if (!experience) return Promise.reject('No experience found in DB for id ', experience_id + ', retrieving.');

            return experience;
        }).catch(function () {
            if (pendingRequests.experiences[experience_id])
                return pendingRequests.experiences[experience_id];
            else {
                var apiPromise = QueryUtils.retrieveExperienceEvent(experience_id).then(function (retrieveExperience) {
                    Census.Experience.create(retrieveExperience, (err) => {
                        if (err) console.log(err);
                    });

                    return retrieveExperience;
                });

                pendingRequests.experiences[experience_id] = apiPromise;
                return apiPromise
            }
        });
    };

    this.findOrRetrieveFacility = function (facility_id) {
        return Census.Facility.findOne({facility_id: facility_id}).lean().exec().then(function (facility) {
            if (!facility) return Promise.reject('No facility found in DB for id ' + facility_id + ', retrieving.');

            return facility;
        }).then(function (facility) {
            facility.zone = PlanetsideDatabase.collections.Locals.Zone[facility.zone_id];
            return facility;
        }).catch(function () {
            if (pendingRequests.facilities[facility_id])
                return pendingRequests.facilities[facility_id];
            else {
                var apiPromise = QueryUtils.retrieveFacility(facility_id).then(function (retrievedFacility) {
                    Census.Facility.create(retrievedFacility, (err) => {
                        if (err) console.log(err);
                    });

                    return retrievedFacility;
                });

                pendingRequests.facilities[facility_id] = apiPromise;
                return apiPromise
            }
        });
    };
};

function getFillFields(event) {
    var fields = ['world', 'zone'];

    switch (event.event_name) {
        case "AchievementEarned":
            fields.push('character');
            fields.push('achievement');
            break;
        case "BattleRankUp":
            fields.push('character');
            break;
        case "ContinentLock":
        case "ContinentUnlock":
            fields.push('current');
            fields.push('previous');
            fields.push('metagame_event');
            break;
        case "Death":
            fields.push('attacker');
            fields.push('character');
            fields.push('attacker_loadout');
            fields.push('character_loadout');
            fields.push('attacker_vehicle');
            fields.push('character_vehicle');
            fields.push('attacker_weapon');
            break;
        case "FacilityControl":
            fields.push('facility');
            fields.push('new_faction');
            fields.push('old_faction');
            fields.push('outfit');
            break;
        case "GainExperience":
            fields.push('character');
            fields.push('experience');
            fields.push('character_loadout');
            break;
        case "MetagameEvent":
            fields.push('event');
            fields.push('state');
            break;
        case "PlayerFacilityCapture":
        case "PlayerFacilityDefend":
            fields.push('character');
            fields.push('facility');
            fields.push('outfit');
            break;
        case "PlayerLogin":
        case "PlayerLogout":
            fields.push('character');
            break;
        case "VehicleDestroy":
            fields.push('attacker');
            fields.push('character');
            fields.push('attacker_loadout');
            fields.push('attacker_vehicle');
            fields.push('character_vehicle');
            fields.push('facility');
            fields.push('faction');
            break;
        default:
            break;
    }

    return fields.join(' ');
}

module.exports = CensusCache;