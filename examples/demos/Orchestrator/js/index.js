/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser:true*/
/*global gip, cmd, require, connectSimulink, WebSocket*/

require.config({
    baseUrl: '../../client/app',
    paths: {
        d3: '../lib/d3',
        stateParser: './util/PVSioStateParser'
    }
});
/**
 * Loading the module PVSioWebClient.
 */
require([
    'PVSioWebClient',
    'stateParser'
], function (PVSioWebClient, stateParser) {
/*
 * Websocket used to communicate with SAPERE
 */
var sapere_websocket;

var orchestratorID = "Orchestrator_ID";

var orchestratorAdded = false;
/*
 * It indicates the state of the socket (the one connecting to Sapere)
 */
var socketClosed;

var d3 = require("d3/d3");



/**
 * @function logOnDiv
 * @description Utility function, sends messages to different div elements in the html page
 * @memberof module:Pacemaker-Simulink
 */
function logOnDiv(msg, logger) {
    var newP = document.createElement("p");
    newP.innerHTML = msg;
    var node = document.getElementById(logger);
    node.appendChild(newP);
    //node.scrollTop = node.scrollHeight;
    $("#" + logger).animate({ scrollTop: $("#" + logger)[0].scrollHeight}, 500);
}

/**
 * @function enable_button
 * @description Binding user interface buttons, in this case there is only the connect button.
 * @memberof module:Pacemaker-Simulink
 */
function enableAddButton() {
    logOnDiv('Button enabled', 'monitor');
    d3.select('.btnAddOrchestrator').on('click', function () {

        if (!orchestratorAdded){
            logOnDiv('Adding Orchestrator', 'monitor');
            var OrchestratorAction = {
                action: "add",
                deviceID: orchestratorID,
                type: "Orchestrator",
                description: "Orchestrator description"
            };
            sapere_websocket.send(JSON.stringify(OrchestratorAction));
        }
        else{
            logOnDiv('Orchestrator already added!', 'monitor');

        }
    });

    d3.select('.btnUpdateOrchestrator').on('click', function () {

        var message = document.getElementById('updateMessage').value;

        logOnDiv('Sending Message '+ message, 'monitor');
        var OrchestratorAction = {
            action: "update",
            orchestratorID: orchestratorID,
            message: message,
        };
        sapere_websocket.send(JSON.stringify(OrchestratorAction));
    });
}


/**
 * @function connectSapere
 * @description Called when clicking the button 'Connect' on the web page.
 * It connects to the Sapere middleware through a new WebSocket.
 * It takes the address from the corresponding field in the html page.
 * @memberof module:Pacemaker-Sapere
 */
var connectSapere = function () {
    /*
     * If websocket is supported by the browser
     */
    if (window.hasOwnProperty('WebSocket')) {
        //var location = document.getElementById('ControllerAddress').value + ':8026';
        //logOnDiv('Trying to estrablish connection with controller at ' + location, 'orchestrator');
        logOnDiv('Trying to estrablish connection with controller at ' + "ws://localhost:8080/websocket/actions", 'monitor');
        //sapere_websocket = new WebSocket('ws://' + location, 'websockets');
        sapere_websocket = new WebSocket('ws://localhost:8080/websocket/actions');

        /*
         * It starts the control process that send the information to Sapere
         */
        sapere_websocket.onopen = function () {
            socketClosed = false;
            //logOnDiv('Controller connected', 'orchestrator');
            logOnDiv('Controller connected', 'monitor');
            //startSensingPacing();

            enableAddButton();

        };
        /*
         * Receive event
         */
        sapere_websocket.onmessage = function (evt) {
            onMessageReceivedSapere(evt);
        };
        /*
         * Close event
         */
        sapere_websocket.onclose = function () {
            socketClosed = true;
            //logOnDiv('Controller disconnected', 'orchestrator');
            logOnDiv('Controller disconnected', 'monitor');
        };
    } else {
        /*
         * The browser doesn't support WebSocket
         */
        alert('WebSocket NOT supported by your Browser!');
    }
};

/**
 * @function onMessageReceivedSapere
 * @description Callback function of sapere websocket <br>
 * Parse the data sent from Sapere and send it to PVS in order to process it
 * @memberof module:Pacemaker-Sapere
 */
function onMessageReceivedSapere(event) {
    var text = event.data;

    // JSON FORMAT
    if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
            replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

        var device = JSON.parse(event.data);

        if (device.action === "add") {
            orchestratorAdded = true;
            logOnDiv('Orchestrator added', 'monitor');
        }
        if (device.action === "remove") {
            orchestratorAdded = false;
            logOnDiv('Orchestrator removed', 'monitor');
        }
        if (device.action === "toggle") {
            var node = document.getElementById(device.deviceID);
            var statusText = node.children[2];
            if (device.status === "ON") {
                node.setAttribute("class", "animated pulse infinite device " + device.type);
                statusText.innerHTML = "Status: " + device.status + " (<a href=\"#\" OnClick=toggleDevice(" + device.deviceID + ")>Turn OFF</a>)";
                cosyAlert("Device " + device.deviceID + " Injected into Sapere", "success", { vPos : 'top', hPos : 'left'});
            } else if (device.status === "OFF") {
                node.setAttribute("class", "animated flip device " + device.type);
                statusText.innerHTML = "Status: " + device.status + " (<a href=\"#\" OnClick=toggleDevice(" + device.deviceID + ")>Turn ON</a>)";
                cosyAlert("Device " + device.deviceID + " Removed from Sapere", "success", { vPos : 'top', hPos : 'left'});
            }
        }
        if (device.action === "update") {

            logOnDiv("FROM:    " + device.from +
                     "\nTYPE:    " + device.type +
                     "\nMESSAGE: \n" + device.message, "monitor");

            //var str = JSON.stringify(device, null, 2);
            //
            //logOnDiv(str, "monitor");

        }


    } // NO JSON
    else{
        logOnDiv(text, "monitor");
    }
}

    connectSapere();
});