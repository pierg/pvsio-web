/**
 * Created by piergiuseppe on 4/13/15.
 */
var sapere_websocket = new WebSocket("ws://localhost:8080/SapereEE/monitor");
sapere_websocket.onmessage = onMessageReceivedSapereMonitor;

/**
 * Callback function when a message is received from the sapere websocket
 * @param event
 */
function onMessageReceivedSapereMonitor(event) {

    var text = event.data;

    // JSON FORMAT
    if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
            replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

        var data = JSON.parse(event.data);

        /**
         * Notifies when a device has been successfully added to Sapere
         */
        if (data.action === "add") {
            if($("#" + data.deviceID).length == 0){
                if (data.type == "Supervisor") {
                    //printSupervisor(data);
                }
                else {
                    printDeviceElement(data);
                }
            }
        }

        /**
         * Notifies when a device has been successfully removed from Sapere
         */
        if (data.action === "remove") {
            device_div = $("#" + data.deviceID);
            device_div.removeClass("bounceInUp").addClass("bounceOutDown");
            device_div.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
                function (e) {
                    device_div.remove();
                    printConnectionsSapere();
                });
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
            //var container_div = $("#" + data.deviceID);
            //var agents_span = container_div.find(".agents_block");
            //
            //var circle_div = $("<div>", {
            //    id: data.deviceID + "-pub-" + data.publishKey,
            //    class: "agent_publish " + " animated bounceInUp"
            //});
            //var circle_figure = $("<div>", {
            //    id: data.deviceID + "-pubC-" + data.publishKey,
            //    class: "circle-publish " + " animated bounceInUp device tooltip",
            //    title: data.deviceID + " publishing as " + data.publishKey
            //});
            //circle_figure.tooltipster({
            //    animation: 'fade',
            //    delay: 0,
            //    theme: 'tooltipster-default',
            //    touchDevices: false,
            //    trigger: 'hover'
            //});
            //agents_span.append(circle_div);
            //circle_div.append(circle_figure);
        }

        /**
         * Notifies when a subscribe-agent has been injected into the LSA space in Sapere.
         * A device could have multiple subscribe-agents. For example the Supervisor has a subscribe-agent for every device.
         */
        if (data.action === "subscribe") {
            //var container_div = $("#" + data.deviceID);
            //var agents_span = container_div.find(".agents_block");
            //
            //var circle_div = $("<div>", {
            //    id: data.deviceID + "-sub-" + data.subscribingKey,
            //    class: "agent_subscribe " + " animated bounceInUp"
            //});
            //var circle_figure = $("<div>", {
            //    id: data.deviceID + "-subC-" + data.subscribingKey,
            //    class: "circle-subscribe" + " animated bounceInUp device tooltip",
            //    title: data.deviceID + " subscribed to " + data.subscribingKey
            //});
            //circle_figure.tooltipster({
            //    animation: 'fade',
            //    delay: 0,
            //    theme: 'tooltipster-default',
            //    touchDevices: false,
            //    trigger: 'hover'
            //});
            //agents_span.append(circle_div);
            //circle_div.append(circle_figure);
        }

        /**
         * Notifies when a publish-agent has been removed from the LSA space in Sapere.
         */
        if (data.action === "publish-remove") {
            //var container_div = $("#" + data.deviceID);
            //var agents_span = container_div.find(".agents_block");
            //var circle_div = agents_span.find("#" + data.deviceID + "-pub-" + data.publishKey);
            //var circle_figure = agents_span.find("#" + data.deviceID + "-pubC-" + data.publishKey);
            //
            //circle_figure.connections('remove');
            //circle_div.removeClass("bounceInUp").addClass("bounceOutDown");
            //circle_div.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
            //    function (e) {
            //        circle_div.remove();
            //    });
        }

        /**
         * Notifies when a subscribe-agent has been removed from the LSA space in Sapere.
         */
        if (data.action === "subscribe-remove") {
        //    var container_div = $("#" + data.deviceID);
        //    var agents_span = container_div.find(".agents_block");
        //    var circle_div = agents_span.find("#" + data.deviceID + "-sub-" + data.subscribingKey);
        //    var circle_figure = agents_span.find("#" + data.deviceID + "-subC-" + data.subscribingKey);
        //
        //    circle_figure.connections('remove');
        //    circle_div.removeClass("bounceInUp").addClass("bounceOutDown");
        //    circle_div.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
        //        function (e) {
        //            circle_div.remove();
        //        });
        }

        /**
         * Notifies when a two agents have bonded so are exchanging data.
         */
        if (data.action === "bond") {
            //var divPub = $('#' + data.publisher_ID + '-pub-' + data.key);
            //var divSub = $('#' + data.subscriber_ID + '-sub-' + data.key);
            //
            //var nodePub = '#' + data.publisher_ID + '-pubC-' + data.key;
            //var nodeSub = '#' + data.subscriber_ID + '-subC-' + data.key;
            //
            //$(nodeSub).connections('remove');
            //$(nodeSub).connections({
            //    to: nodePub,
            //    class: 'connection'
            //});
            //
            //divPub.removeClass("bounceInUp");
            //divPub.addClass("tada");
            //setTimeout(function () {
            //    divPub.removeClass("tada");
            //
            //    divSub.removeClass("bounceInUp");
            //    divSub.addClass("tada");
            //    setTimeout(function(){
            //        divSub.removeClass("tada");
            //    }, 500);
            //}, 500);
        }

        /**
         * Sends the whole LSASpace of Sapere
         */
        if (data.action === "lsaspace") {
            //printLSASpace(data.space, "monitor");
        }


    }
    // NO JSON
    else {
        console.log(text);
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

function toggleDevicebyID(id){
    var DeviceAction = {
        action: "toggle",
        deviceID: id
    };
    sapere_websocket.send(JSON.stringify(DeviceAction));
}