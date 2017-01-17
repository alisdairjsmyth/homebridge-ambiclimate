var ambi = require('node-ambiclimate');
var Service, Characteristic;

module.exports = function(homebridge) {
    Service        = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-ambiclimate", "AmbiClimate", AmbiClimate);
}

function AmbiClimate(log, config) {
    this.log                = log;
    this.name               = config.name;
    this.roomName           = config.roomName;
    this.locationName       = config.locationName;
    this.bearerToken        = config.bearerToken;

    // Object to maintain the state of the device.  This is done as there is
    // not official API to get this information.  If the Ambi Climate state is
    // changed through an alternative channel, that change will not be reflected
    // within Homekit
    this.state              = {};
    this.state.on           = false;

    this.temperatureService = new Service.TemperatureSensor(this.name);
    this.humidityService    = new Service.HumiditySensor(this.name);
    this.switchService      = new Service.Switch(this.name);
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
            callback(err, data[0].value);
        });
    },
    getCurrentRelativeHumidity: function(callback) {
        var accessory = this;

        var ac = require('node-ambiclimate');
        var client;

        client = new ac({ bearerToken: accessory.bearerToken});

        var settings = {
            room_name: accessory.roomName,
            location_name: accessory.locationName
        };

        client.sensor_humidity(settings, function (err, data) {
            callback(err, data[0].value);
        });
    },
    // Sets the Ambi Climate Mode based on a switch.  If the device is being
    // turned on, change the state of 'Comfort'.  Otherwise turn it off.
    setMode: function(callback) {
        var accessory = this;

        var ac = require('node-ambiclimate');
        var client;

        client = new ac({ bearerToken: accessory.bearerToken});

        var settings = {
            room_name: accessory.roomName,
            location_name: accessory.locationName
        };

        if (accessory.state.on) {
            client.comfort(settings, function (err,data) {
                callback(err);
            });
        } else {
            client.off(settings, function (err,data) {
                callback(err);
            });
        }
    },

    //
    // Services
    //
    getServices: function () {
        this.temperatureService.getCharacteristic(Characteristic.CurrentTemperature)
            .on('get', function(callback) {
                this.getCurrentTemperature(function(error,data){
                    this.log("Returned temperature: "+ data)
                    callback(error, data);
                }.bind(this));
            }.bind(this));

        this.humidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .on('get', function(callback) {
                this.getCurrentRelativeHumidity(function(error,data){
                    this.log("Returned humidity: "+ data)
                    callback(error, data);
                }.bind(this));
            }.bind(this));

        this.switchService.getCharacteristic(Characteristic.On)
            // Return value maintained within state machine
            .on('get', function(callback) {
                callback(null, this.state.on);
            }.bind(this))
            .on('set', function(value, callback) {
                this.state.on = value;
                this.setMode(function(error,data) {
                    callback(error);
                }.bind(this));
            }.bind(this));

 		this.informationService
			.setCharacteristic(Characteristic.Manufacturer, "Ambi Labs")
			.setCharacteristic(Characteristic.Model, "Ambi Climate")
			.setCharacteristic(Characteristic.SerialNumber, " ");

        return [this.temperatureService,this.humidityService,this.informationService];
    }
}
