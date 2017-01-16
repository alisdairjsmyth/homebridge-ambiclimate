# homebridge-ambiclimate
[![npm version](https://badge.fury.io/js/homebridge-ambiclimate.svg)](https://badge.fury.io/js/homebridge-ambiclimate)

[Ambi Climate](https://www.ambiclimate.com/) plugin for [homebridge](https://www.npmjs.com/package/homebridge).  This plugin presently supports:
* Current Temperature (implementation of Temperature Sensor Service)
* Current Relative Humidity (Implementation of Humidity Sensor Service)
as such each physical device appears within Homekit Apps as two logical devices with the same name.

## Installation

    npm install -g homebridge-ambiclimate

This plugin augments a pre-existing implementation of [homebridge](https://www.npmjs.com/package/homebridge).  Refer to [nfarina/homebridge](https://www.npmjs.com/package/homebridge) for installation instructions.

A bearer token is mandatory to use the Ambi Climate API.  A new token can be obtained in the [Ambi Dev Portal](https://api.ambiclimate.com/) by following the steps on the Quick Start page.

Update your homebridge configuration file (as below).

## Configuration

    "accessories" : [
        {
            "accessory": "AmbiClimate",
            "name": "<Name for Accessory>",
            "roomName": "<Name of Ambi Climate Device>",
            "locationName": "<Name of Ambi Climate Location>"
            "bearerToken": "<Ambi Climate Bearer Token>"
        }
    ]

Separate homebridge accessories can be defined for each Ambi Climate device to be controlled.  
* `accessory`: Must be "AmbiClimate"
* `name`: Can be anything, this will be the name of the Accessory within HomeKit Apps
* `room_name`: Must match the value within the Ambi Climate App
* `location_name`: Must match the value within the Ambi Climate App
* `bearerToken`: The token value obtained from Ambi Dev Portal

## To Do
* Refactor to a Platform plugin.  This is predicated on Ambi Labs exposing a capability in their public API to retrieve all devices installed in a given location.
* Implement Thermostat Service (rather than Temperature Sensor).  This is predicated on Ambi Labs exposing a capability in their public API to get current state for each device.
* Implement Fan Service. This is predicaed on Ambi Labs exposing a capability in their public API to get and set fan state.
