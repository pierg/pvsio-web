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

    /*
     * It indicates the state of the socket (the one connecting to Sapere)
     */
    var socketClosed;
    
    var d3 = require("d3/d3");

	var client = PVSioWebClient.getInstance();
    //create a collapsible panel using the pvsiowebclient instance
    var imageHolder = client.createCollapsiblePanel({
        parent: "#content",
        headerText: "Simulation of Masimo Radical 7 PulseOx.",
        showContent: true,
        isDemo: true
    }).style("position", "relative");
    //insert the html into the panel (note that this could have used templates or whatever)
    imageHolder.html('<img src="radical-7.png" usemap="#prototypeMap"/>').attr("id", "prototype");
    
    var content = imageHolder.append("div").style("position", "absolute").style("top", "0px").style("left", "600px")
					.style("height", "460px").style("width", "400px").attr("class", "dbg");

    content = imageHolder.append("div").style("position", "absolute").style("top", "40px").style("left", "850px")
        .style("height", "460px").style("width", "400px").attr("id", "sapere_response_log").attr("class", "dbg");
        
    //append a div that will contain the canvas elements

    var w = 120, h = 20;

    //spo2
    var spo2 = new SingleDisplay("spo2",
                                 { top: 54, left: 164, height: 36, width: 50 },
                                 { parent: "prototype", font: "Times", fontColor: "red", backgroundColor: "black" });
    var spo2_label = new SingleDisplay("spo2_label",
                                 { top: 86, left: 164, height: 10, width: 50 },
                                 { parent: "prototype", font: "Times", fontColor: "red", backgroundColor: "black" });
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
        } else {
            spo2.hide();
            spo2_label.hide();
            spo2_max.hide();
            spo2_min.hide();
        }
    }
    
    
    /**
        function to handle when an output has been received from the server after sending a guiAction
        if the first parameter is truthy, then an error occured in the process of evaluating the gui action sent
    */
    function onMessageReceived(err, event) {
        function prettyprintState(str) {
            var state = stateParser.parse(str);
            return JSON.stringify(state, null, " ");
        }
        if (!err) {
            client.getWebSocket().lastState(event.data);
            var dbg = prettyprintState(event.data.toString());
            d3.select(".dbg").node().innerHTML = new Date() + "<br>" + dbg.split("\n").join("<br>") + "<br><br>" + d3.select(".dbg").node().innerHTML;

            sapere_websocket.send(dbg);

            var res = event.data.toString();
            if (res.indexOf("(#") === 0) {
                res = stateParser.parse(event.data.toString());
				if (res) {
                    render_spo2(res);
                }
            }
        } else { console.log(err); }
	}
    	
    d3.select(".btn_on").on("click", function () {
		client.getWebSocket()
            .sendGuiAction("click_btn_on(" + client.getWebSocket().lastState() + ");", onMessageReceived);
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
            logOnDiv('Adding Device', 'sapere_response_log');
            var DeviceAction = {
                action: "add",
                name: "Radical",
                type: "Monitor",
                description: "Radical monitor description"
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
            sapere_websocket = new WebSocket('ws://localhost:8080/WebsocketHome/actions');

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
    function onMessageReceivedSapere(evt) {
        //var message_received = prettyprintReceivedData(evt.data);
        var message_received = evt.data;
        console.log('Message received from Sapere: ' + message_received);
        logOnDiv('<-RECEIVED<br>' + message_received, 'sapere_response_log');
        if (!socketClosed) {
            //pvsio_websocket.sendGuiAction('alaris_tick(10)( ' + message_received + ' )( ' + prettyprintPVSioOutput(pvsio_websocket.lastState()) + ' );', onMessageReceivedPVSio);
            //logOnDiv('  <<<<<<<<<<<<<<<<    SENT TO PVSio                   ' + '<' + 'br>' + 'alaris_tick(10)( ' + message_received + ' )( ' + prettyprintPVSioOutput(pvsio_websocket.lastState()) + ' );', 'orchestrator');
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
