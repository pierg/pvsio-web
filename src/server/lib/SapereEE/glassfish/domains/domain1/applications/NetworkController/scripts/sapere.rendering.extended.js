function logOnDiv(msg, logger) {
    var p = $("<p>", {class: "console_element"});
    p.html(msg);
    $("#" + logger)
        .append(p)
        .animate({scrollTop: $("#" + logger)[0].scrollHeight}, 500);
}

function printLSASpace(msg, logger) {
    var jsonMsg = JSON.parse(msg);
    var LSAtreeDiv = $("#LSAtree");
    LSAtreeDiv.html("");
    $.each(jsonMsg, function(index,jsonObject){
        var div = $("<div>", {class: "sapere_node grid_3"});
        var node = new PrettyJSON.view.Node({
            el:div,
            data:jsonObject
        });
        node.expandAll();
        LSAtreeDiv.append(div);
    });
}

function printStructures(msg, logger) {
    var jsonMsg = JSON.parse(msg);
    var StructureTree = $("#StructureTree");
    StructureTree.html("");
    $.each(jsonMsg, function(index,jsonObject){
        var div = $("<div>", {class: "sapere_node grid_3"});
        var node = new PrettyJSON.view.Node({
            el:div,
            data:jsonObject
        });
        node.expandAll();
        StructureTree.append(div);
    });
}

function printDeviceElement(data) {
    var container = $("#devices");
    var child = $("<div>", {id: data.deviceID, class: data.type + " animated bounceInUp device"});
    child.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
        function (e) {
            printConnectionsSapere();
        });

    var id;
    var type;
    var status;
    var description;
    var remove;
    var agents;

    id = $("<span>", {class: "device_id"}).html(data.deviceID);
    type = $("<span>", {class: "device_type"}).html("<b>Type:</b> " + data.type);
    if (data.status === "ON") {
        status = $("<span>", {class: "device_status"}).html("<b>Status:</b> " + data.status + " (<a href=\"#!\" class=\"toggle_switch\" OnClick=toggleDevice(" + data.deviceID + ")>Turn OFF</a>)");
    } else if (data.status === "OFF") {
        status = $("<span>", {class: "device_status"}).html("<b>Status:</b> " + data.status + " (<a href=\"#!\" class=\"toggle_switch\" OnClick=toggleDevice(" + data.deviceID + ")>Turn ON</a>)");
    }
    ;
    description = $("<span>", {class: "device_description"}).html("<b>Comments:</b> " + data.description);
    remove = $("<span>", {class: "device_remove"}).html("<a href=\"#!\" class=\"remove_switch\" OnClick=removeDevice(" + data.deviceID + ")>Remove device</a>");
    agents = $("<span>", {class: "agents_block device_agents"});

    child.append(id).append(type).append(status).append(description).append(remove).append(agents);
    container.append(child);

}

function printSupervisor(data) {
    var container = $("#supervisor");
    var child = $("<div>", {id: data.deviceID, class: data.type + " animated bounceInUp device"});
    child.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
        function (e) {
            printConnectionsSapere();
        });

    var id;
    var type;
    var status;
    var remove;
    var agents;

    id = $("<span>", {class: "device_id", style: "margin-top: 20px"}).html(data.deviceID);
    type = $("<span>", {class: "device_type"}).html("<b>Type:</b> " + data.type);
    if (data.status === "ON") {
        status = $("<span>", {class: "device_status"}).html("<b>Status:</b> " + data.status + " (<a href=\"#!\" class=\"toggle_switch\" OnClick=toggleDevice(" + data.deviceID + ")>Turn OFF</a>)");
    } else if (data.status === "OFF") {
        status = $("<span>", {class: "device_status"}).html("<b>Status:</b> " + data.status + " (<a href=\"#!\" class=\"toggle_switch\" OnClick=toggleDevice(" + data.deviceID + ")>Turn ON</a>)");
    }
    remove = $("<span>", {class: "device_remove"}).html("<a href=\"#!\" class=\"remove_switch\" OnClick=removeDevice(" + data.deviceID + ")>Remove device</a>");
    agents = $("<span>", {class: "agents_block supervisor_agents"});

    child.append(id).append(type).append(status).append(remove).append(agents);
    container.append(child);

}

function printConnectionsSapere(){

    var connections = $('connection');
    setInterval(function() { connections.connections('update') }, 50);

    $('.device').connections('remove');
    $('.device').connections({
        to: $('#sapere'),
        class: 'channel'
    });

}