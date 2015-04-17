///**
// *
// * @author Paolo Masci, Patrick Oladimeji
// * @date 27/03/15 20:30:33 PM
// */
///*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
///*global define, d3, require, $, brackets, document, PVSioWebClient */
//require.config({
//    baseUrl: '../../client/app',
//    paths: {
//        d3: '../lib/d3',
//        stateParser: './util/PVSioStateParser'
//    }
//});
///**
// * Loading the module PVSioWebClient.
// */
//require([
//    'PVSioWebClient',
//    'stateParser'
//], function (PVSioWebClient, stateParser) {
//    'use strict';
//
//
//    var socketClosed;
//    var sapere_websocket;
//


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
        node.scrollTop = node.scrollHeight;
        //$("#" + logger).animate({ scrollTop: $("#" + logger)[0].scrollHeight}, 500);
    }

    /**
     * @function enable_button
     * @description Binding user interface buttons, in this case there is only the connect button.
     * @memberof module:Pacemaker-Simulink
     */
    //function enableAddButton() {
    //    logOnDiv('Button enabled', 'orchestrator');
    //    d3.select('.btnAddDevice').on('click', function () {
    //        logOnDiv('Adding Device', 'orchestrator');
    //        var DeviceAction = {
    //            action: "add",
    //            name: "Radical",
    //            type: "Monitor",
    //            description: "Radical monitor description"
    //        };
    //        sapere_websocket.send(JSON.stringify(DeviceAction));
    //    });
    //}


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
            logOnDiv('Trying to estrablish connection with controller at ' + "ws://localhost:8080/websocket/orchestrator", 'orchestrator');

            sapere_websocket = new WebSocket('ws://localhost:8080/websocket/orchestrator');

            /*
             * It starts the control process that send the information to Sapere
             */
            sapere_websocket.onopen = function () {
                socketClosed = false;
                //logOnDiv('Controller connected', 'orchestrator');
                logOnDiv('Controller connected', 'orchestrator');
                //startSensingPacing();

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
                logOnDiv('Controller disconnected', 'orchestrator');
                stop_sensing_pacing();
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
    function onMessageReceivedSapere(evt) {
        //var message_received = prettyprintReceivedData(evt.data);
        var message_received = evt.data;
        console.log('Message received from Sapere: ' + message_received);
        logOnDiv('<-RECEIVED<br>' + message_received, 'orchestrator');
        if (!socketClosed) {
        }
    }


	
//});
