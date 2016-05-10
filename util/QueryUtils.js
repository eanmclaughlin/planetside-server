/**
 * Created by ean.mclaughlin on 4/28/2016.
 */
"use strict";
var Census = new (require('planetside-census'))();

module.exports.retrieveCharacter = function (character_id) {
    var query = new Census.CensusQuery();
    query.join(new Census.JoinQuery("outfit_member_extended").at("outfit"));
    query.where("character_id", character_id);

    return query.get("character").then((data)=> {
        if (data && data.returned)
            return data.character_list[0];
        return new Error('no character found for ID ' + character_id);
    }).catch((error) => {
        throw error;
    });
};

module.exports.retrieveOutfit = function (outfit_id) {
    var query = new Census.CensusQuery();
    query.where("outfit_id", outfit_id);

    return query.get("outfit").then((data) => {
        if (data && data.returned)
            return data.outfit_list[0];
        return new Error('Outfit not found for id ' + outfit_id);
    }).catch((error) => {
        throw error;
    });
};

module.exports.retrieveWeaponAsItem = function (weapon_item_id) {
    var query = new Census.CensusQuery();
    query.where('item_id', weapon_item_id);

    return query.get('item').then((data) => {
        if (data && data.returned)
            return data.item_list[0];
        return new Error('No item found for ' + weapon_item_id);
    }).catch((error) => {
        throw error;
    });
};

module.exports.retrieveExperienceEvent = function (experience_id) {
    var query = new Census.CensusQuery();
    query.where("experience_id", experience_id);
    return query.get("experience").then(function (data) {
        if (data && data.returned)
            return data.experience_list[0];
        return new Error("No experience event found for id " + experience_id);
    }).catch((error) => {
        throw error;
    })
};

module.exports.retrieveFacility = function (facility_id) {
    var query = new Census.CensusQuery();

    query.where("facility_id", facility_id);

    return query.get("map_region").then(function (data) {
        if (data && data.returned)
            return data.map_region_list[0];
        return new Error("No facility found for id " + facility_id);
    }).catch((error) => {
        throw error;
    });
};

module.exports.retrieveAchievement = function (achievement_id) {
    var query = new Census.CensusQuery();
    query.where('achievement_id', achievement_id);

    return query.get('achievement').then((data) => {
        if (data && data.returned)
            return data.achievement_list[0];
        return new Error('No achievement found for id ' + achievement_id);
    }).catch((error) => {
        throw error;
    })
};