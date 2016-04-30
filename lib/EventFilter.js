/**
 * Created by ean.mclaughlin on 4/25/2016.
 */

var SubscriptionFilter = function (subscription) {
    this.currentSub = subscription || {};
};

SubscriptionFilter.prototype.match = function (eventFilterData) {
    var filterMatch = false;
    for (filterCategory in this.currentSub) {
        if (eventFilterData[filterCategory]) {
            if(this.currentSub[filterCategory].indexOf('all') >= 0){
                filterMatch = true;
                return filterMatch;
            }
            eventFilterData[filterCategory].forEach(filterItem => {
                if (this.currentSub[filterCategory].indexOf(filterItem) >= 0)
                    filterMatch = true;
            })
        }
    }
    return filterMatch;
};

SubscriptionFilter.prototype.unsubscribe = function (removeFilter) {
    for (filterCategory in removeFilter) {
        if (this.currentSub[filterCategory])
            this.currentSub[filterCategory] = this.currentSub[filterCategory].filter(sub => removeFilter[filterCategory].indexOf(sub) < 0);
    }
};

SubscriptionFilter.prototype.subscribe = function (addFilter) {
    for (filterCategory in addFilter) {
        if (this.currentSub[filterCategory]) {
            this.currentSub[filterCategory] = this.currentSub[filterCategory].concat(addFilter[filterCategory])
        }
        else {
            this.currentSub[filterCategory] = addFilter[filterCategory];
        }
    }
};

module.exports = SubscriptionFilter;