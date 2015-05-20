var sapere_websocket = new WebSocket("ws://localhost:8080/NetworkController/monitor");
sapere_websocket.onmessage = onMessageReceivedSapere;


/**
 * Callback function when a message is received from the sapere_handler network_controller
 * @param event
 */
function onMessageReceivedSapere(event) {

    var data = event.data;

    // JSON FORMAT
    if (tryJSON(data)) {

        data = tryJSON(data);

        /**
         * Notifies when a device has been successfully added to Sapere
         */
        if (data.action === "add") {
            if (data.type == "Supervisor") {
                printSupervisor(data);
            }
            else {
                printDeviceElement(data);
            }
            console.log("           add: " + data.deviceID);
        }

        /**
         * Notifies when a device has been successfully removed from Sapere
         */
        if (data.action === "remove") {
            $("#" + data.deviceID).remove();
            console.log("           rmv: " + data.deviceID);
        }

        /**
         * Notifies when a device has been successfully activated or deactivated
         */
        if (data.action === "toggle") {
            var container_div = $("#" + data.deviceID);
            var status_span = container_div.find(".device_status");

            if (data.status === "ON") {
                container_div.removeClass("tada");
                status_span.html("<b>Status:</b> " + data.status + " (<a href=\"#!\" class=\"toggle_switch\" OnClick=toggleDevice(" + data.deviceID + ")>Turn OFF</a>)");
            } else if (data.status === "OFF") {
                container_div.addClass("tada");
                status_span.html("<b>Status:</b> " + data.status + " (<a href=\"#!\" class=\"toggle_switch\" OnClick=toggleDevice(" + data.deviceID + ")>Turn ON</a>)");
            }
        }

        /**
         * Notifies when a publish-agent has been injected into the LSA space in Sapere.
         * Every publish-agent is is strictly connected to the device it publishes the data for.
         */
        if (data.action === "publish") {
            if ($("#" + data.deviceID + "-pub-" + data.publishKey).length == 0) {
                var container_div = $("#" + data.deviceID);
                var agents_span = container_div.find(".agents_block");

                var circle_div = $("<div>", {
                    id: data.deviceID + "-pub-" + data.publishKey,
                    class: "agent_publish " + " animated bounceInUp"
                });
                var circle_figure = $("<div>", {
                    id: data.deviceID + "-pubC-" + data.publishKey,
                    class: "circle-publish " + " animated bounceInUp device tooltip",
                    title: data.deviceID + " publishing as " + data.publishKey
                });
                circle_figure.tooltipster({
                    animation: 'fade',
                    delay: 0,
                    theme: 'tooltipster-default',
                    touchDevices: false,
                    trigger: 'hover'
                });
                agents_span.append(circle_div);
                circle_div.append(circle_figure);
            }
        }

        /**
         * Notifies when a subscribe-agent has been injected into the LSA space in Sapere.
         * A device could have multiple subscribe-sapere_handler. For example the Supervisor has a subscribe-agent for every device.
         */
        if (data.action === "subscribe") {
            if ($("#" + data.deviceID + "-sub-" + data.subscribingKey).length == 0) {
                var container_div = $("#" + data.deviceID);
                var agents_span = container_div.find(".agents_block");

                var circle_div = $("<div>", {
                    id: data.deviceID + "-sub-" + data.subscribingKey,
                    class: "agent_subscribe " + " animated bounceInUp"
                });
                var circle_figure = $("<div>", {
                    id: data.deviceID + "-subC-" + data.subscribingKey,
                    class: "circle-subscribe" + " animated bounceInUp device tooltip",
                    title: data.deviceID + " subscribed to " + data.subscribingKey
                });
                circle_figure.tooltipster({
                    animation: 'fade',
                    delay: 0,
                    theme: 'tooltipster-default',
                    touchDevices: false,
                    trigger: 'hover'
                });
                agents_span.append(circle_div);
                circle_div.append(circle_figure);
            }
        }

        /**
         * Notifies when a publish-agent has been removed from the LSA space in Sapere.
         */
        if (data.action === "publish-remove") {
            var container_div = $("#" + data.deviceID);
            var agents_span = container_div.find(".agents_block");
            var circle_div = agents_span.find("#" + data.deviceID + "-pub-" + data.publishKey);
            var circle_figure = agents_span.find("#" + data.deviceID + "-pubC-" + data.publishKey);

            circle_figure.connections('remove');
            circle_div.removeClass("bounceInUp").addClass("bounceOutDown");
            circle_div.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
                function (e) {
                    circle_div.remove();
                });
        }

        /**
         * Notifies when a subscribe-agent has been removed from the LSA space in Sapere.
         */
        if (data.action === "subscribe-remove") {
            var container_div = $("#" + data.deviceID);
            var agents_span = container_div.find(".agents_block");
            var circle_div = agents_span.find("#" + data.deviceID + "-sub-" + data.subscribingKey);
            var circle_figure = agents_span.find("#" + data.deviceID + "-subC-" + data.subscribingKey);

            circle_figure.connections('remove');
            circle_div.removeClass("bounceInUp").addClass("bounceOutDown");
            circle_div.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
                function (e) {
                    circle_div.remove();
                });
        }

        /**
         * Notifies when a two sapere_handler have bonded so are exchanging data.
         */
        if (data.action === "bond-update") {
            var divPub = $('#' + data.publisher_ID + '-pub-' + data.key);
            var divSub = $('#' + data.subscriber_ID + '-sub-' + data.key);

            divPub.removeClass("bounceInUp");
            divPub.addClass("tada");
            setTimeout(function () {
                divPub.removeClass("tada");
                divSub.removeClass("bounceInUp");
                divSub.addClass("tada");
                setTimeout(function () {
                    divSub.removeClass("tada");
                }, 500);
            }, 500);

            // Re-draw the connection TODO: better connection managment
            var nodePub = '#' + data.publisher_ID + '-pubC-' + data.key;
            var nodeSub = '#' + data.subscriber_ID + '-subC-' + data.key;

            $(nodeSub).connections('remove');
            $(nodeSub).connections({
                to: nodePub,
                class: 'connection',
            });
            var connections = $('connection');
            setInterval(function() { connections.connections('update') }, 1000);
        }

        /**
         * Notifies when a two sapere_handler have bonded so are exchanging data.
         */
        if (data.action === "bond-added") {

            var nodePub = '#' + data.publisher_ID + '-pubC-' + data.key;
            var nodeSub = '#' + data.subscriber_ID + '-subC-' + data.key;

            $(nodeSub).connections('remove');
            $(nodeSub).connections({
                to: nodePub,
                class: 'connection',
            });
            var connections = $('connection');
            setInterval(function() { connections.connections('update') }, 1000);

        }

        /**
         * Sends the whole LSASpace of Sapere
         */
        if (data.action === "lsaspace") {
            printLSASpace(data.space, "monitor");
        }

    }
// NO JSON
    else {
        console.log(data);
    }

}


/**
 * Sends a remove message to Sapere
 * @param element
 */
function removeDevice(element) {
    var id = element.getAttribute("id");
    var DeviceAction = {
        action: "remove",
        deviceID: id
    };
    sapere_websocket.send(JSON.stringify(DeviceAction));
}

/**
 * Sends a toggle message to Sapere
 * @param element
 */
function toggleDevice(element) {
    var id = element.getAttribute("id");
    var DeviceAction = {
        action: "toggle",
        deviceID: id
    };
    sapere_websocket.send(JSON.stringify(DeviceAction));
}

function toggleDevicebyID(id) {
    var DeviceAction = {
        action: "toggle",
        deviceID: id
    };
    sapere_websocket.send(JSON.stringify(DeviceAction));
}



function tryJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);

        if (o && typeof o === "object" && o !== null) {
            return o;
        }
    }
    catch (e) { }

    return false;
};

