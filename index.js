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
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  Accessory = homebridge.platformAccessory;

  // Service, Characteristic, and UUIDGen are from hap-nodejs
  Service        = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen        = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-ambiclimate", "AmbiClimate", AmbiClimatePlatform, true);
}

function AmbiClimatePlatform(log, config, api) {
  this.log                    = log;
  this.api                    = api;

  this.client = new ambi(config.clientId, config.clientSecret, config.username, config.password);

  // Retrieve the list of devices associated with the account
  this.client.devices()
    .then( (response) => {
      for (device in response.data) {
        var accessory = new Accessory(device.room_name, UUIDGen.generate(device.device_id));
        this.settings               = {};
        this.settings.room_name     = device.room_name;
        this.settings.location_name = device.location_name;

        accessory.addService(Service.Fan, accessory.settings.room_name)
          .getCharacteristic(Characteristic.On)
          .on('get', function (callback) {
            this.getActive(function (error, data) {
              callback(error, data);
            }.bind(this));
          }.bind(this));

        accessory.getService(Service.AccessoryInformation)
          .setCharacteristic(Characteristic.Manufacturer, "Ambi Labs")
          .setCharacteristic(Characteristic.Model, "Ambi Climate")
          .setCharacteristic(Characteristic.SerialNumber, device.device_id);

        this.api.registerPlatformAccessories("homebridge-ambiclimate", "AmbiClimate", [accessory]);
      }
    });
}

AmbiClimatePlatform.prototype.getActive = function(callback) {
  this.log("getActive: this.settings - "+this.settings);
  this.client.mode(this.settings)
    .then( (data) => {
      this.log("getActive: Retrieved mode is "+data.mode);
      switch (data.mode) {
        case "Off":
        case "Manual":
          callback(null, Characteristic.Active.INACTIVE);
          break;
        default:
          callback(null, Characteristic.Active.ACTIVE);
          break;
      }
    })
    .catch( (reason) => {
      callback(reason);
    })
}
