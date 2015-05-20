/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser:true*/
/*global require*/

require.config({
    baseUrl: '../../client/app',
    paths: {
        d3: '../lib/d3',
        stateParser: './util/PVSioStateParser',
        NCDevice: 'plugins/networkController/NCDevice',
        NCMonitor: 'plugins/networkController/NCMonitor'
    }
});
/**
 * Loading the module PVSioWebClient.
 */
require([
    'PVSioWebClient',
    'stateParser',
    'NCDevice',
    'NCMonitor'
], function (PVSioWebClient, stateParser, NCDevice, NCMonitor) {

    var deviceID = "Supervisor_ID";
    var deviceType = "Supervisor";
    var deviceDescription = "Supervisor";

    var client;
    var d3 = require("d3/d3");
    var tick = null;

    var ncDevice = new NCDevice({id: deviceID, type: deviceType});
    ncDevice.addListener("update", parseNCMessage);
    ncDevice.addListener("connected", start_tick);

    var ncMonitor = new NCMonitor({});

    function parseNCMessage(event){
        var res = stateParser.parse(event.message);
        client.getWebSocket()
            .sendGuiAction("update_spo2(" + res.spo2 + ")" +
            "(" + client.getWebSocket().lastState() + ");",
            onMessageReceived);
    }


    function start_tick () {
        if (!tick) {
            tick = setInterval(function () {
                client.getWebSocket()
                    .sendGuiAction("tick(" + client.getWebSocket().lastState() + ");", onMessageReceived);
            }, 2000);
        }
    }

    function stop_tick () {
        if (tick) {
            clearInterval(tick);
            tick = null;
        }
    }

    function logOnDiv(msg, logger) {
        var p = $("<p>", {class: "console_element"});
        p.html(msg);
        $("#" + logger)
            .append(p)
            .animate({scrollTop: $("#" + logger)[0].scrollHeight}, 500);
    }


    /**
     function to handle when an output has been received from the server after sending a guiAction
     if the first parameter is truthy, then an error occured in the process of evaluating the gui action sent
     */
    function onMessageReceived(err, event) {
        if (!err) {
            logOnDiv(event.data.toString(), "monitor");

            var res = stateParser.parse(event.data.toString());
            if (res.pump.input.cmd.trim() === "pause"){
                console.log("pause pump");
                ncDevice.sendControlData("Alaris", "click_btn_pause");
            }
        } else { console.log(err); }
    }


    /*
     * Get client instance and the websocket it uses to communicate with the server
     */
    client = PVSioWebClient.getInstance();
    
    function startNCEE() {
        var msg = "Starting ICE Network Controller...";
        console.log(msg);
        return new Promise(function (resolve, reject) {
            client.getWebSocket().send({ type: "startNCEE" }, function(err) {
                if (!err) {
                    msg = "ICE Network Controller started successfully!";
                    console.log(msg);
                    resolve(msg);
                } else {
                    msg = "Error while starting ICE Network Controller (" + JSON.stringify(err) + ")";
                    console.log(msg);
                    reject(err);
                }
            });
        });
    }
    function stopNCEE() {
        var msg = "Stopping ICE Network Controller...";
        console.log(msg);
        return new Promise(function (resolve, reject) {
            client.getWebSocket().send({ type: "stopNCEE" }, function(err) {
                if (!err) {
                    msg = "ICE Network Controller stopped.";
                    console.log(msg);
                    resolve(msg);
                } else {
                    msg = "Error while stopping ICE Network Controller (" + JSON.stringify(err) + ")";
                    console.log(msg);
                    reject(err);
                }
            });
        });
    }
    
    //function init() {
    //    d3.select("#startICENetwork").on("click", startNCEE);
    //    d3.select("#stopICENetwork").on("click", stopNCEE);
    //}

    /*
     * Register event listener for websocket connection to the server.
     */
    client.addListener('WebSocketConnectionOpened', function () {
        console.log('web socket connected');
        logOnDiv('PVSio Web Socket connected', 'monitor');
        /*
         * Start the PVS Process for the pacemaker
         */
        client.getWebSocket().startPVSProcess({
            name: 'main.pvs',
            demoName: 'PCA-Interlock-App/pvs'
        }, function (err) {
            if (!err) {
                logOnDiv('PVS Process started', 'monitor');
                
                // start ICE Network Controller (NCEE) & connect ICE supervisor to it
                //startNCEE().then(function (res) {
                //    connectToNC();
                //}).catch(function (err) {
                //    connectNC();
                //    console.log(err);
                //});
                
                // initialise PVS model
                client.getWebSocket().sendGuiAction(client.getWebSocket().lastState() + ';', function () {});
            } else {
                console.log(err);
            }
        });
        //init();
    }).addListener('WebSocketConnectionClosed', function () {
        logOnDiv('PVS Process closed', 'monitor');
        console.log('web socket closed');
    }).addListener('processExited', function () {
        var msg = 'Warning!!!\r\nServer process exited. See console for details.';
        console.log(msg);
    });
    /*
     * Initiate connection to the server
     */
    logOnDiv('Connecting to the PVSio server...', 'monitor');
    client.connectToServer();

    ncDevice.connect();
    ncMonitor.connect();
});