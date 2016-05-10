/**
 * Created by Pepper on 5/9/2016.
 */

module.exports = function (app) {
    app.get('*', function (req, res) {
        res.sendFile(__dirname + "/dist/index.html");
    });
};