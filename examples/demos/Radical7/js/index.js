/**
 * 
 * @author Paolo Masci, Patrick Oladimeji
 * @date 27/03/15 20:30:33 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, document, PVSioWebClient */
require.config({
    baseUrl: "../../client/app",
    paths: {
        d3: "../lib/d3",
		"pvsioweb": "plugins/prototypebuilder",
        "imagemapper": "../lib/imagemapper",
        "text": "../lib/text",
        "lib": "../lib",
        "cm": "../lib/cm",
        stateParser: './util/PVSioStateParser'
    }
});

require(["pvsioweb/Button", "widgets/SingleDisplay", "widgets/DoubleDisplay", "widgets/TripleDisplay", "widgets/LED", "widgets/CursoredDisplay", "plugins/graphbuilder/GraphBuilder", "stateParser", "PVSioWebClient"], function (Button, SingleDisplay, DoubleDisplay, TripleDisplay, LED, CursoredDisplay, GraphBuilder, stateParser, PVSioWebClient) {
    "use strict";


    /*
     * Websocket used to communicate with SAPERE
     */
    var sapere_websocket;

    var deviceID = "Radical_ID";

    var deviceAdded = false;
    /*
     * It indicates the state of the socket (the one connecting to Sapere)
     */
    var socketClosed;
    
    var d3 = require("d3/d3");

	var client = PVSioWebClient.getInstance();
    //create a collapsible panel using the pvsiowebclient instance
    var imageHolder = client.createCollapsiblePanel({
        parent: "#content",
        headerText: "Simulation of Masimo Radical 7 PulseOximeter",
        showContent: true,
        isDemo: true
    }).style("position", "relative");
    //insert the html into the panel (note that this could have used templates or whatever)
    imageHolder.html('<img src="radical-7.png" usemap="#prototypeMap"/>').attr("id", "prototype");
    
    var content = imageHolder.append("div").style("position", "absolute").style("top", "20px").style("left", "600px")
					.style("height", "186px").style("width", "400px").attr("class", "dbg");
    
    //append a div that will contain the canvas elements
    var tick = null;
    var start_tick = null, stop_tick = null;

    //spo2
    var spo2 = new SingleDisplay("spo2",
                                 { top: 54, left: 164, height: 36, width: 50 },
                                 { parent: "prototype", font: "Times" });
    var spo2_label = new SingleDisplay("spo2_label",
                                 { top: 86, left: 164, height: 10, width: 50 },
                                 { parent: "prototype", font: "Times" });
    var spo2_alarm = new SingleDisplay("spo2_alarm",
                                 { top: 48, left: 214, height: 12, width: 12 },
                                 { parent: "prototype", align: "left", fontColor: "red" });
    var spo2_max = new SingleDisplay("spo2_max",
                                 { top: 68, left: 214, height: 8, width: 20 },
                                 { parent: "prototype", align: "left" });
    var spo2_min = new SingleDisplay("spo2_min",
                                 { top: 76, left: 214, height: 8, width: 20 },
                                 { parent: "prototype", align: "left" });

    function evaluate_spo2(str) {
        var v = +str;
        if (str.indexOf("/") >= 0) {
            var args = str.split("/");
            v = +args[0] / +args[1];
        }
        return (v < 10) ? v.toFixed(1).toString() : v.toFixed(0).toString();
    }
    function evaluate_spo2range(str) {
        var v = +str;
        if (str.indexOf("/") >= 0) {
            var args = str.split("/");
            v = +args[0] / +args[1];
        }
        return (v < 0) ? "--" : v.toFixed(1).toString();
    }
    
    
    function render_spo2(res) {
        if (res.isOn === "TRUE") {
            spo2.render(evaluate_spo2(res.spo2));
            spo2_label.render("%" + res.spo2_label.replace(/\"/g, ""));
            spo2_max.render(evaluate_spo2range(res.spo2_max));
            spo2_min.render(evaluate_spo2range(res.spo2_min));
            start_tick();
        } else {
            spo2.hide();
            spo2_label.hide();
            spo2_max.hide();
            spo2_min.hide();
            stop_tick();
        }
    }
    
    function render_alarms(res, message) {
        if (res.isOn === "TRUE") {
            if (res.spo2_alarm === "off") {
                spo2_alarm.hide();
            }
            else {
                // ALARM ON
                var DeviceAction = {
                    action: "update",
                    deviceID: deviceID,
                    message: message
                };
                sapere_websocket.send(JSON.stringify(DeviceAction));

                if (res.spo2_alarm === "alarm") {
                    spo2_alarm.renderGlyphicon("glyphicon-bell");
                } else if (res.spo2_alarm === "mute") {
                    spo2_alarm.renderGlyphicon("glyphicon-mute");
                }
            }
        } else {
            spo2_alarm.hide();
        }
    }


    function prettyprintState(str) {
        var state = stateParser.parse(str);
        return JSON.stringify(state, null, " ");
    }

    /**
        function to handle when an output has been received from the server after sending a guiAction
        if the first parameter is truthy, then an error occured in the process of evaluating the gui action sent
    */
    function onMessageReceived(err, event) {

        if (!err) {
            client.getWebSocket().lastState(event.data);
            var dbg = prettyprintState(event.data.toString());
            var message = new Date() + "<br>" + dbg.split("\n").join("<br>") + "<br><br>" + d3.select(".dbg").node().innerHTML;
            d3.select(".dbg").node().innerHTML = message;

            //var DeviceAction = {
            //    action: "update",
            //    deviceID: deviceID,
            //    message: message,
            //};
            //sapere_websocket.send(JSON.stringify(DeviceAction));

            var res = event.data.toString();
            if (res.indexOf("(#") === 0) {
                res = stateParser.parse(event.data.toString());
				if (res) {
                    render_spo2(res);
                    render_alarms(res, event.data.toString());
                }
            }
        } else { console.log(err); }
	}
    
    
    //--- tick function -------------------
    start_tick = function () {
        if (!tick) {
            tick = setInterval(function () {
                client.getWebSocket()
                        .sendGuiAction("tick(" + client.getWebSocket().lastState() + ");", onMessageReceived);
            }, 2000);
        }
    };
    
    stop_tick = function () {
        if (tick) {
            clearInterval(tick);
            tick = null;
        }
    };
    
    	
    d3.select(".btn_on").on("click", function () {
        stop_tick();
		client.getWebSocket()
            .sendGuiAction("click_btn_on(" + client.getWebSocket().lastState() + ");", onMessageReceived);
        start_tick();
    });
    
    d3.select("#submit_spo2_sensor_data").on("click", function () {
        var data = d3.select("#spo2_sensor_data").node().value;
        if (data) {
            stop_tick();
            client.getWebSocket()
                .sendGuiAction("spo2_sensor_data(" + data + ")(" + client.getWebSocket().lastState() + ");", onMessageReceived);
            start_tick();
        }
    });




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
    function enableAddButton() {
        logOnDiv('Button enabled', 'sapere_response_log');
        d3.select('.btnAddDevice').on('click', function () {

            if (!deviceAdded){
                logOnDiv('Adding Device', 'sapere_response_log');
                var DeviceAction = {
                    action: "add",
                    deviceID: deviceID,
                    type: "Monitor",
                    description: "Radical monitor description"
                };
                sapere_websocket.send(JSON.stringify(DeviceAction));
            }
            else{
                logOnDiv('Device already added!', 'sapere_response_log');

            }
        });

        d3.select('.btnUpdateDevice').on('click', function () {

            var message = document.getElementById('updateMessage').value;

            logOnDiv('Sending Message '+ message, 'sapere_response_log');
            var DeviceAction = {
                action: "update",
                deviceID: deviceID,
                message: message,
            };
            sapere_websocket.send(JSON.stringify(DeviceAction));
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
            logOnDiv('Trying to estrablish connection with controller at ' + "localhost:8026/websockets/alaris", 'sapere_response_log');
            //sapere_websocket = new WebSocket('ws://' + location, 'websockets');
            sapere_websocket = new WebSocket('ws://localhost:8080/websocket/actions');

            /*
             * It starts the control process that send the information to Sapere
             */
            sapere_websocket.onopen = function () {
                socketClosed = false;
                //logOnDiv('Controller connected', 'orchestrator');
                logOnDiv('Controller connected', 'sapere_response_log');
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
                logOnDiv('Controller disconnected', 'sapere_response_log');
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
    function onMessageReceivedSapere(event) {
        var text = event.data;

        // JSON FORMAT
        if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
                replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
                replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

            var device = JSON.parse(event.data);

            if (device.action === "remove") {
                logOnDiv('Device removed', 'sapere_response_log');
                deviceAdded = false;
            }
            if (device.action === "add") {
                logOnDiv('Device added', 'sapere_response_log');
                deviceAdded = true;
            }


        } // NO JSON
        else{
            logOnDiv(text, "sapere_response_log");
        }
    }


    // TODO: need to understand how to use Buttons
//    var btn_on = new Button("btn_on");
//    btn_on.recallRate(250);
//    btn_on.evts("click");
//    btn_on.functionText("btn_on");
//    var region_btn_on = d3.select(".btn_on");
//    btn_on.element(region_btn_on);
//    btn_on.createImageMap(client.getWebSocket(), onMessageReceived);


    //register event listener for websocket connection from the client
	client.addListener('WebSocketConnectionOpened', function (e) {
		console.log("web socket connected");
		//start pvs process
		client.getWebSocket().startPVSProcess({name: "main.pvs", demoName: "Radical7/pvs"}, function (err, event) {
            client.getWebSocket().sendGuiAction("init(0);", onMessageReceived);
			d3.select(".demo-splash").style("display", "none");
            d3.select(".content").style("display", "block");
            connectSapere();
		});
	}).addListener("WebSocketConnectionClosed", function (e) {
		console.log("web socket closed");
	}).addListener("processExited", function (e) {
		var msg = "Warning!!!\r\nServer process exited. See console for details.";
		console.log(msg);
	});
	
	client.connectToServer();
	
});
