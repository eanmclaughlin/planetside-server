/**
 * Created by ean.mclaughlin on 4/26/2016.
 */

var DatabaseQueue = function (PlanetsideDatabase) {
    this.queues = {};
    this.started = false;

    this.saveEvent = function (event) {
        this.started = true;
        if (!this.queues[event.event_name])
            this.queues[event.event_name] = [];
        this.queues[event.event_name].push(event);
    };

    setInterval(() => {
        if (this.started) {
            Object.keys(this.queues).forEach((event_name) => {
                if (this.queues[event_name].length > 0) {
                    PlanetsideDatabase.collections.Events[event_name].insertMany(this.queues[event_name], (err, docs) => {
                        if (err) console.log(err);
                        else {
                            this.queues[event_name] = [];
                        }
                    });
                }
            });
        }
    }, 1000);
};

module.exports = DatabaseQueue;