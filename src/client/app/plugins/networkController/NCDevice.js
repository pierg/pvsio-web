/**
 *
 * @author Piergiuseppe Mallozzi
 * @date 14/05/2015 11:33 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/

/*global define, Promise*/
define(function (require, exports, module) {
    "use strict";

    var eventDispatcher = require("util/eventDispatcher");

    /**
     * @function NetworkController
     * @description Constructor.
     * @param device {!Object} This object describes the device. It has the following fields:<br>
     *     <li>id </li>
     *     <li>type </li>
     *     <li>description (optional) </li>
     * @param opt {Object} It contains the url of NC endpoint <br>
     *     <li>url </li>
     * @memberof module:NetworkController
     * @instance
     */
    function NCDevice(device, opt) {
        opt = opt || {};
        this.url = opt.url || "ws://localhost:8080/NetworkController/actions";
        this.deviceID = device.id;
        this.deviceType = device.type;
        this.deviceDescription = device.description || (device.type + "" + device.id);
        eventDispatcher(this);
        _this = this;
        return this;
    }


    var nc_websocket_device;
    var deviceAdded = false;
    var deviceON = false;
    var _this;

    NCDevice.prototype.connect = function () {
        return new Promise(function (resolve, reject) {
            nc_websocket_device = new WebSocket(_this.url);
            /*
             * It starts the control process that send the information to NC
             */
            nc_websocket_device.onopen = function () {
                console.log(">> Connected to ICE Network Controller!");
                addDevice();
                resolve();
            };

            nc_websocket_device.onmessage = onMessageReceivedNCDevice;
            /*
             * Close event
             */
            nc_websocket_device.onclose = function () {
                console.log(">> Disconnected from ICE Network Controller (" + _this.url + ")");
                nc_websocket_device = null;
                reject({ code: "CLOSED" });
            };
            /*
             * Connection failed
             */
            nc_websocket_device.onerror = function () {
                console.log("!! Unable to connect to ICE Network Controller (" + _this.url + ")");
                nc_websocket_device = null;
                reject({ code: "ERROR" });
            };
        });
    };

    var addDevice = function() {
        if (!deviceAdded) {
            console.log("-> adding " + _this.deviceID);
            var SupervisorAction = {
                action: "add",
                deviceID: _this.deviceID,
                type: _this.deviceType,
                description: _this.deviceDescription
            };
            nc_websocket_device.send(JSON.stringify(SupervisorAction));
        }
        else {
            console.log("!! " + _this.deviceID + " already added !!")
        }
    };


    NCDevice.prototype.turnON = function(to, message) {
        if(!deviceON){
            var DeviceAction = {
                action: "turnON",
                deviceID: _this.deviceID,
            };
            nc_websocket_device.send(JSON.stringify(DeviceAction));
        }
        else{
            console.log("!!! Device already ON !!! ");
        }
    };

    NCDevice.prototype.turnOFF = function(to, message) {
        if(deviceON){
            var DeviceAction = {
                action: "turnOFF",
                deviceID: _this.deviceID,
            };
            nc_websocket_device.send(JSON.stringify(DeviceAction));
        }
        else{
            console.log("!!! Device already OFF !!! ");

        }
    };

    NCDevice.prototype.sendControlData = function(to, message) {
        if(_this.deviceType === "Supervisor"){
            console.log("-> " + message + "\n - " + to);
            var payload = {
                to: to,
                msg: message
            };
            var DeviceAction = {
                action: "orchestrate",
                deviceID: _this.deviceID,
                message: payload
            };
            nc_websocket_device.send(JSON.stringify(DeviceAction));
        }
        else{
            console.log("!!! Attention, this function is reserved to Devices with type 'Supervisor' !!! ");
            console.log("!!! Use sendDataUpdate instead !!! ");
        }
    };

    NCDevice.prototype.sendDataUpdate = function (message) {
        if(_this.deviceType != "Supervisor") {
            console.log("-> " + message);
            var DeviceAction = {
                action: "update",
                deviceID: _this.deviceID,
                message: message
            };
            nc_websocket_device.send(JSON.stringify(DeviceAction));
        }
        else{
            console.log("!!! Attention, this function is reserved to Devices different from 'Supervisor' !!! ");
            console.log("!!! Use sendControlData instead !!! ");        }
    };

    function isJSON(text){
        try {
            var c = JSON.parse(text);
            return true;
        }
        catch (err) {
            return false;
        }
    }

    //if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
    //        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
    //        replace(/(?:^|:|,)(?:\s*\[)+/g, ''))){
    //    return true;
    //}
    //else{
    //    return false;
    //}

    /**
     * Callback function when a message is received from the nc websocket
     * @param event
     */
    var onMessageReceivedNCDevice = function(event) {

        var text = event.data;

        // JSON FORMAT
        if (isJSON(text)) {

            var payload = JSON.parse(event.data);

            if (payload.action === "add") {
                deviceAdded = true;
                console.log("<- " + _this.deviceID + " added to NC");
            }
            if (payload.action === "remove") {
                deviceAdded = false;
                console.log("<- " + _this.deviceID + " removed from NC");
            }
            if (payload.action === "on") {
                deviceON = true;
                console.log("<- " + _this.deviceID + " is now turned ON");
            }
            if (payload.action === "off") {
                deviceON = false;
                console.log("<- " + _this.deviceID + " is now switched OFF");
            }

            /**
             * Update message from another device subscribed to
             */
            if (payload.action === "update") {
                // orchestrate message
                if(isJSON(payload.message)){
                    var content = JSON.parse(payload.message);
                    // filtering destination device
                    if(content.to === _this.deviceID){
                        console.log("<- orchestrate message from: " + payload.from);
                        _this.fire({
                            type: "orchestrate",
                            from: payload.from,
                            message: content.msg
                        });
                    }
                }
                else{
                    console.log("<- update message from: " + payload.from);
                    _this.fire({
                        type: "update",
                        from: payload.from,
                        message: payload.message
                    });
                }
            }

            /**
             * Orchestrate message from a Supervisor
             */
            if (payload.action === "orchestrate") {

                if(payload.message.to === _this.deviceID){
                    console.log("<- update message from: " + payload.from);
                    _this.fire({
                        type: "update",
                        from: payload.from,
                        message: payload.message
                    });
                }
            }
        }
        // NO JSON
        else {
            console.log(text);
        }
    };

    module.exports = NCDevice;

});