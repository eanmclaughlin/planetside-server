/**
 * Created by ean.mclaughlin on 4/25/2016.
 */
var AlertTracker = function (PlanetsideDatabase) {
    this.currentAlerts = {};
    this.getAlert = function (world, zone) {
        if (this.currentAlerts[world] && this.currentAlerts[world][zone])
            return this.currentAlerts[world][zone];
    };

    this.startAlert = function (event) {
        console.log("Started alert on world", event.world_id, "zone", event.zone_id);
        if (!this.currentAlerts[event.world_id])
            this.currentAlerts[event.world_id] = {};
        this.currentAlerts[event.world_id][event.zone_id] = {
            world: event.world_id,
            zone: event.zone_id,
            online: 0,
            participated: 0,
            start: {
                time: event.timestamp,
                vs_control: event.faction_vs,
                tr_control: event.faction_tr,
                nc_control: event.faction_nc
            },
            characters: {},
            outfits: {},
            facility_events: []
        };
    };

    this.endAlert = function (event) {
        if (this.currentAlerts[event.world_id] && this.currentAlerts[event.world_id][event.zone_id]) {
            this.currentAlerts[event.world_id][event.zone_id].end = {
                time: event.timestamp,
                vs_control: event.faction_vs,
                tr_control: event.faction_tr,
                nc_control: event.faction_nc
            };

            new PlanetsideDatabase.collections.generated.Alert(this.currentAlerts[event.world_id][event.zone_id]).save((err, alert) => {
                if (err)
                    console.log('Failed to save alert', event.world_id, event.zone_id, err);
                else
                    delete this.currentAlerts[event.world_id][event.zone_id];
            })
        }
    };

    function ensureCharacter(character_id, associatedAlert) {
        if (!associatedAlert.characters[character_id]) {
            associatedAlert.characters[character_id] = {
                outfit_id: "",
                ranks: 0,
                kills: 0,
                deaths: 0,
                headshots: 0,
                weapons: {},
                vehicles: {},
                facilities: {},
                experience_events: {},
                achievements: {}
            };

            associatedAlert.participated++;
        }
    }

    function ensureOutfit(outfit_id, associatedAlert) {
        if (!associatedAlert.outfits[outfit_id]) {
            associatedAlert.outfits[outfit_id] = {
                outfit_id: "",
                ranks: 0,
                kills: 0,
                deaths: 0,
                headshots: 0,
                weapons: {},
                vehicles: {},
                facilities: {},
                experience_events: {},
                achievements: {}
            }
        }
    }

    this.processEvent = function (event) {
        Object.keys(event).forEach((value)=> {
            if (!typeof event[value] === 'object')
                event[value] = event[value].toString();
        });

        if (event.event_name == "MetagameEvent") {
            if (event.metagame_event_state == 135)
                this.startAlert(event);
            else if (event.metagame_event_state == 138)
                this.endAlert(event);
        }
            
        else if (this.getAlert(event.world_id, event.zone_id)) {
            var associatedAlert = this.getAlert(event.world_id, event.zone_id);
            if (event.character_id) {
                ensureCharacter(event.character_id, associatedAlert);
                if (event.character && event.character.outfit && event.character.outfit_id) {
                    ensureOutfit(event.character.outfit.outfit_id, associatedAlert);
                }
            }
            if (event.attacker_character_id) {
                ensureCharacter(event.attacker_character_id, associatedAlert);
                if (event.attacker && event.attacker.outfit && event.attacker.outfit_id) {
                    ensureOutfit(event.attacker.outfit.outfit_id, associatedAlert);
                }
            }
            this[event.event_name](event, associatedAlert);
        }
    };

    this.AchievementEarned = function (event, alert) {
        var character = alert.characters[event.character_id];

        if (!character.achievements[event.achievement_id]) {
            character.achievements[event.achievement_id] = {
                achievement_id: event.achievement_id,
                count: 0
            };
        }

        character.achievements[event.achievement_id].count++;

        if (event.character && event.character.outfit && event.character.outfit.outfit_id) {
            if (!alert.outfits[event.character.outfit.outfit_id].achievements[event.achievement_id]) {
                alert.outfits[event.character.outfit.outfit_id].achievements[event.achievement_id] = {
                    achievement_id: event.achievement_id,
                    count: 0
                };
            }

            alert.outfits[event.character.outfit.outfit_id].achievements[event.achievement_id].count++;
        }
    };

    this.BattleRankUp = function (event, alert) {
        alert.characters[event.character_id].rankups++;
    };

    this.Death = function (event, alert) {
        var character = alert.characters[event.character_id],
            attacker = alert.characters[event.attacker_character_id],
            weaponId = event.weapon_id;
        var attacker_outfit_id;
        var character_outfit_id;

        if (event.character && event.character.outfit && event.character.outfit.outfit_id)
            character_outfit_id = event.character.outfit.outfit_id;
        if (event.attacker && event.attacker.outfit && event.attacker.outfit.outfit_id)
            attacker_outfit_id = event.attacker.outfit.outfit_id;

        character.deaths++;
        attacker.kills++;
        if (event.is_headshot)
            attacker.headshots++;

        if (weaponId) {
            if (!attacker.weapons[weaponId]) {
                attacker.weapons[weaponId] = {
                    weapon_id: weaponId,
                    kills: 0,
                    deaths: 0,
                    headshots: 0
                };
            }

            if (!character.weapons[weaponId]) {
                character.weapons[weaponId] = {
                    weapon_id: weaponId,
                    kills: 0,
                    deaths: 0,
                    headshots: 0
                };
            }

            attacker.weapons[weaponId].kills++;
            if (event.is_headshot)
                attacker.weapons[weaponId].headshots++;
            character.weapons[weaponId].deaths++;
        }

        var vehicleId = event.vehicle_id;
        if (vehicleId) {
            if (!attacker.vehicles[vehicleId]) {
                attacker.vehicles[vehicleId] = {
                    vehicle_id: vehicleId,
                    destroyed: 0,
                    lost: 0,
                    kills_with: 0,
                    deaths_to: 0
                }
            }
            attacker.vehicles[vehicleId].kills_with++;

            if (!character.vehicles[vehicleId]) {
                character.vehicles[vehicleId] = {
                    vehicle_id: vehicleId,
                    destroyed: 0,
                    lost: 0,
                    kills_with: 0,
                    deaths_to: 0
                }
            }
            character.vehicles[vehicleId].deaths_to++;

            if (attacker_outfit_id) {
                if (!alert.outfits[attacker_outfit_id].vehicles[vehicleId]) {
                    alert.outfits[attacker_outfit_id].vehicles[vehicleId] = {
                        vehicle_id: vehicleId,
                        destroyed: 0,
                        lost: 0,
                        kills_with: 0,
                        deaths_to: 0
                    }
                }

                alert.outfits[attacker_outfit_id].vehicles[vehicleId].kills_with++;
            }
            if (character_outfit_id) {
                if (!alert.outfits[character_outfit_id].vehicles[vehicleId]) {
                    alert.outfits[character_outfit_id].vehicles[vehicleId] = {
                        vehicle_id: vehicleId,
                        destroyed: 0,
                        lost: 0,
                        kills_with: 0,
                        deaths_to: 0
                    }
                }

                alert.outfits[character_outfit_id].vehicles[vehicleId].deaths_to++;
            }
        }
    };

    this.FacilityControl = function (event, alert) {
        alert.facility_events.push(event);

        if (alert.outfits[event.outfit_id]) {
            if (!alert.outfits[event.outfit_id].facilities[event.facility_id]) {
                alert.outfits[event.outfit_id].facilities[event.facility_id] = {
                    facility_id: event.facility_id,
                    captures: 0,
                    defenses: 0
                }
            }
            var facility = alert.outfits[event.outfit_id].facilities[event.facility_id];
            if (event.old_faction_id == event.new_faction_id) {
                facility.defenses++;
                alert.outfits[event.outfit_id].defenses++;
            }
            if (event.old_faction_id != event.new_faction_id) {
                facility.captures++;
                alert.outfits[event.outfit_id].captures++;
            }
        }
    };

    this.GainExperience = function (event, alert) {
        if (!alert.characters[event.character_id].experience_events[event.experience_id]) {
            alert.characters[event.character_id].experience_events[event.experience_id] = {
                event_id: event.experience_id,
                count: 0
            };
        }

        alert.characters[event.character_id].experience_events[event.experience_id].count++;

        if (event.character && event.character.outfit && event.character.outfit.outfit_id) {
            if (!alert.outfits[event.character.outfit.outfit_id].experience_events[event.experience_id]) {
                alert.outfits[event.character.outfit.outfit_id].experience_events[event.experience_id] = {
                    event_id: event.experience_id,
                    count: 0
                }
            }

            alert.outfits[event.character.outfit.outfit_id].experience_events[event.experience_id].count++;
        }
    };

    this.PlayerFacilityCapture = function (event, alert) {
        if (!alert.characters[event.character_id].facilities[event.facility_id]) {
            alert.characters[event.character_id].facilities[event.facility_id] = {
                facility_id: event.facility_id,
                captures: 0,
                defenses: 0
            };
        }

        alert.characters[event.character_id].facilities[event.facility_id].captures++;
    };

    this.PlayerFacilityDefend = function (event, alert) {
        if (!alert.characters[event.character_id].facilities[event.facility_id]) {
            alert.characters[event.character_id].facilities[event.facility_id] = {
                facility_id: event.facility_id,
                captures: 0,
                defenses: 0
            };
        }

        alert.characters[event.character_id].facilities[event.facility_id].defenses++;
    };

    this.VehicleDestroy = function (event, alert) {
        if (!alert.characters[event.character_id].vehicles[event.vehicle_id]) {
            alert.characters[event.character_id].vehicles[event.vehicle_id] = {
                vehicle_id: event.vehicle_id,
                destroyed: 0,
                lost: 0,
                deaths_to: 0,
                kills_with: 0
            }
        }
        if (!alert.characters[event.attacker_character_id].vehicles[event.vehicle_id]) {
            alert.characters[event.attacker_character_id].vehicles[event.vehicle_id] = {
                vehicle_id: event.vehicle_id,
                destroyed: 0,
                lost: 0,
                deaths_to: 0,
                kills_with: 0
            }
        }

        alert.characters[event.character_id].vehicles[event.vehicle_id].lost++;
        alert.characters[event.attacker_character_id].vehicles[event.vehicle_id].destroyed++;

        if (event.character && event.character.outfit && event.character.outfit.outfit_id) {
            if (!alert.outfits[event.character.outfit.outfit_id].vehicles[event.vehicle_id]) {
                alert.outfits[event.character.outfit.outfit_id].vehicles[event.vehicle_id] = {
                    vehicle_id: event.vehicle_id,
                    lost: 0,
                    destroyed: 0,
                    deaths_to: 0,
                    kills_with: 0
                };
            }
            alert.outfits[event.character.outfit.outfit_id].vehicles[event.vehicle_id].lost++;
        }
        if (event.attacker && event.attacker.outfit && event.attacker.outfit.outfit_id) {
            if (!alert.outfits[event.attacker.outfit.outfit_id].vehicles[event.vehicle_id]) {
                alert.outfits[event.attacker.outfit.outfit_id].vehicles[event.vehicle_id] = {
                    vehicle_id: event.vehicle_id,
                    lost: 0,
                    destroyed: 0,
                    deaths_to: 0,
                    kills_with: 0
                };
            }
            alert.outfits[event.attacker.outfit.outfit_id].vehicles[event.vehicle_id].destroyed++;
        }
    };

    //TODO manage total participated/current participating
    this.PlayerLogin = function (event, alert) {
    };

    this.PlayerLogout = function (event, alert) {
    };
};

module.exports = AlertTracker;