var ambi = require('node-ambiclimate');
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-ambiclimate", "AmbiClimate", AmbiClimate);
}

function AmbiClimate(log, config) {
    this.log          = log;
    this.name         = config.name;
    this.roomName     = config.roomName;
    this.locationName = config.locationName;
    this.bearerToken  = config.bearerToken;
    this.temperatureService = new Service.TemperatureSensor(this.name);
    this.humidityService    = new Service.HumiditySensor(this.name);
    this.informationService = new Service.AccessoryInformation();
}

AmbiClimate.prototype = {
    getCurrentTemperature: function(callback) {
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
    },
    getCurrentRelativeHumidity = function(callback) {
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
    },
    //
    // Services
    //
    getServices: function () {
        this.temperatureService.getCharacteristic(Characteristic.CurrentTemperature)
            .on('get', this.getCurrentTemperature.bind(this));

        this.humidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .on('get', this.getCurrentRelativeHumidity.bind(this));

// this.thermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)

// this.thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)

// this.thermostatService.getCharacteristic(Characteristic.TargetTemperature)

// this.thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)

 		this.informationService
			.setCharacteristic(Characteristic.Manufacturer, "Ambi Labs")
			.setCharacteristic(Characteristic.Model, "Ambi Climate")
			.setCharacteristic(Characteristic.SerialNumber, " ");

        return [this.temperatureService,this.humidityService,this.informationService];
    }
}
