var ambi = require('node-ambiclimate');
var Service, Characteristic;

module.exports = function(homebridge) {
    Service        = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-ambiclimate", "AmbiClimate", AmbiClimate);
}

function AmbiClimate(log, config) {
    this.log                    = log;
    this.name                   = config.name;
    this.settings               = {};
    this.settings.room_name     = config.roomName,
    this.settings.location_name = config.locationName;
    console.log("Constructor - settings: "+JSON.stringify(this.settings));

    this.client = new ambi(config.clientId, config.clientSecret, config.username, config.password);

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
        console.log("Temperature - settings: "+JSON.stringify(accessory.settings));
        accessory.client.sensor_temperature(accessory.settings, function (err, data) {
            console.log("Temperature - typeof data: "+(typeof data));
            console.log("Temperature - isArray: "+(data.isArray))
            console.log("Temperature - data: " +JSON.stringify(data));
            callback(err, 0);
//            callback(err, data[0].value);
        });
    },
    getCurrentRelativeHumidity: function(callback) {
        var accessory = this;
        console.log("Humidity - settings: "+JSON.stringify(accessory.settings));
        accessory.client.sensor_humidity(accessory.settings, function (err, data) {
            console.log("Humidity - typeof data: "+(typeof data));
            console.log("Humidity - isArray: "+(data.isArray))
            console.log("Humidity - data: " +JSON.stringify(data));
            callback(err, 0);
//            callback(err, data[0].value);
        });
    },
    // Sets the Ambi Climate Mode based on a switch.  If the device is being
    // turned on, change the state of 'Comfort'.  Otherwise turn it off.
    setMode: function(callback) {
        var accessory = this;

        if (accessory.state.on) {
            accessory.client.comfort(accessory.settings, function (err,data) {
                callback(err);
            });
        } else {
            accessory.client.off(accessory.settings, function (err,data) {
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

        return [this.temperatureService,this.humidityService,this.switchService,this.informationService];
    }
}
