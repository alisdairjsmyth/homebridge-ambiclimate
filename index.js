var ambi = require('node-ambiclimate');
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory(
        'homebridge-ambiclimate',
        'Ambi Climate',
        AmbiAccessory
    );
}

function AmbiAccessory(log, config) {
    this.log          = log;
    this.name         = config['name'];
    this.roomName     = config['roomName'];
    this.locationName = config['locationName'];
    this.bearerToken  = config['bearerToken'];

    this.service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
            maxValue: 100,
            minValue: 0,
            minStep: 0.1
        })
        .on('get', this.getCurrentTemperature.bind(this));

    this.service
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .setProps({
            maxValue: 100,
            minValue: 0,
            minStep: 0.1
        })
        .on('get', this.getCurrentRelativeHumidity.bind(this));
}

AmbiAccessory.prototype.getCurrentTemperature = function(callback) {
    var accessory = this;

    var ac = require('node-ambiclimate');
    var client;

    client = new ac({ bearerToken: accessory.bearerToken});

    var settings = {
        room_name: accessory.roomName,
        location_name: accessory.locationName
    };

    client.sensor_temperature(settings, function (err, data) {
        if (!err) {
            callback(null, data.value);
        }
        else {
            callback(err);
        }
    });
}

AmbiAccessory.prototype.getCurrentRelativeHumidity = function(callback) {
    var accessory = this;

    var ac = require('node-ambiclimate');
    var client;

    client = new ac({ bearerToken: accessory.bearerToken});

    var settings = {
        room_name: accessory.roomName,
        location_name: accessory.locationName
    };

    client.sensor_humidity(settings, function (err, data) {
        if (!err) {
            callback(null, data.value);
        }
        else {
            callback(err);
        }
    });
}

AmbiAccessory.prototype.getServices = function() {
    return [this.service];
}
