/**
 * Created by ean.mclaughlin on 4/27/2016.
 */

var activeSessions = {};

var SessionTracker = function (PlanetsideDatabase) {
    this.startSession = function (character_id) {
        if (!activeSessions[character_id])
            activeSessions[character_id] = {};
    };

    this.endSession = function (event) {
        setTimeout(() => {
            new PlanetsideDatabase.collections.generated.Session(activeSessions[event[character_id]]).save((err, session) => {
                if (err) {
                    console.log("Failed to save session for character", event.character_id);
                    console.log(err);
                }
                else {
                    delete activeSessions[event.character_id];
                }
            });
        }, 1000 * 300);
    };

    this.processEvent = function (event) {
        if (activeSessions[event.character_id]) {
            var character = activeSessions[event.character_id];

            switch (event.event_name) {
                case "Death":
                    if (!character.deaths)
                        character.deaths = [];
                    character.deaths.push(event);
                    break;
                case "AchievementEarned":
                    if (!character.achievements)
                        character.achievements = [];
                    character.achievements.push(event);
                    break;
                case "BattleRankUp":
                    if (!character.rankups)
                        character.rankups = [];
                    character.rankups.push(event);
                    break;
                case "GainExperience":
                    if (!character.experiences)
                        character.experiences = [];
                    character.deaths.push(event);
                    break;
                case "PlayerFacilityCapture":
                    if (!character.facility_captures)
                        character.facility_captures = [];
                    character.facility_captures.push(event);
                    break;
                case "PlayerFacilityDefend":
                    if (!character.facility_defends)
                        character.facility_defends = [];
                    character.facility_defends.push(event);
                    break;
                case "VehicleDestroy":
                    if (!character.vehicle_destroys)
                        character.vehicle_destroys = [];
                    character.vehicle_destroys.push(event);
                    break;
            }
        }
    }
};