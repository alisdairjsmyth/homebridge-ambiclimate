/**
 * MIT License
 *
 * Copyright (c) 2017 Alisdair Smyth
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
**/
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
    this.on                     = {};
    this.on.mode                = (typeof config.onMode != "undefined") : config.onMode ? "Default";
    this.on.value               = (typeof config.onValue != "undefined") : config.onValue ? 0;
    this.off                    = {};
    this.off.mode               = (typeof config.offMode != "undefined") : config.offMode ? "Default";
    this.off.value              = (typeof config.offValue != "undefined") : config.offValue ? 0;

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

        accessory.client.sensor_temperature(accessory.settings, function (err, data) {
            (err) ? callback(err, data) : callback(err, data[0].value);
        });
    },
    getCurrentRelativeHumidity: function(callback) {
        var accessory = this;

        accessory.client.sensor_humidity(accessory.settings, function (err, data) {
            (err) ? callback(err, data) : callback(err, data[0].value);
        });
    },
    // Sets the Ambi Climate Mode based on a switch.
    setMode: function(callback) {
        var accessory = this;
        var settings  = accessory.settings;

        function setAmbiMode (state) {
          switch (state.mode) {
            case "Comfort":
              accessory.log("Putting into comfort mode");
              accessory.client.comfort(settings, function (err,data) {
                  callback(err);
              });
              break;
            case "Off":
              accessory.log("Turning off");
              accessory.client.off(settings, function (err,data) {
                  callback(err);
              });
              break;
            case "Away_Temperature_Upper":
              accessory.log("Putting into away temperature upper mode");
              settings.value = state.value;
              accessory.client.away_temperature_upper(settings, function (err,data) {
                  callback(err);
              });
              break;
            case "Away_Temperature_Lower":
              accessory.log("Putting into away temperature lower mode");
              settings.value = state.value;
              accessory.client.away_temperature_lower(settings, function (err,data) {
                  callback(err);
              });
              break;
            case "Away_Humidity_Upper":
              accessory.log("Putting into away humidity upper mode");
              settings.value = state.value;
              accessory.client.away_humidity_upper(settings, function (err,data) {
                  callback(err);
              });
              break;
            case "Temperature":
              accessory.log("Putting into temperature mode");
              settings.value = state.value;
              accessory.client.temperature(settings, function (err,data) {
                  callback(err);
              });
              break;
            default:
              if (accessory.state.on) {
                accessory.log("Putting into comfort mode");
                accessory.client.comfort(accessory.settings, function (err,data) {
                    callback(err);
                });
              } else {
                accessory.log("Turning off");
                accessory.client.off(accessory.settings, function (err,data) {
                    callback(err);
                });
              }
              break;
          }
        }

        if (accessory.state.on) {
          setAmbiMode(accessory.on)
        } else {
          setAmbiMode(accessory.off)
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
