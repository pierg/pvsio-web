/**
 * Display widget
 * @author Patrick Oladimeji
 * @date 10/30/13 22:50:34 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
define(function (require, exports, module) {
    "use strict";
    var Widget = require("./Widget"),
        property = require("util/property"),
        CursoredDisplay = require("widgets/CursoredDisplay"),
        StateParser = require("util/PVSioStateParser"),
        Speaker  = require("widgets/TextSpeaker");
    
    function Display(id) {
        Widget.call(this, id, "display");
        //this.regex = property.call(this);
        //this.predefinedRegex = property.call(this);
        this.displayKey = property.call(this);
        this.cursorName = property.call(this);
        this.auditoryFeedback = property.call(this);
    }

    Display.prototype = Object.create(Widget.prototype);
    Display.prototype.constructor = Display;
    Display.prototype.parentClass = Widget.prototype;

    function coordsToPos(coords) {
        return {x: coords[0], y: coords[1], width: coords[2] - coords[0], height: coords[3] - coords[1]};
    }
    /**
     * state is a JSON object -- the caller should use JSON.parse to transform strings into JSON objects
     * using JSON.parse within this function affects performance, as callers may invoke render many times on the same state,
     * e.g., when multiple display elements need to be rendered.
     */
    Display.prototype.render = function (state) {
        var str = StateParser.resolve(state, this.displayKey());
        var dispVal = StateParser.evaluate(str);
        if (typeof dispVal === "string") {
            dispVal = dispVal.replace(new RegExp("\"", "g"), "");
        }
        var pos = coordsToPos(this.imageMap().attr("coords").split(",").map(function (d) { return +d; }));
        var y = pos.y,
            x = pos.x,
            w = pos.width,
            h = pos.height;
        var text = d3.select("div." + this.id());
        if (!text.empty()) {
            text.remove();
        }
        text = d3.select("#imageDiv").append("div").attr("class", this.id() + " displayWidget");
        ///FIXME CursoredDisplay should be used as a standalone widget
        var cursoredDisplay = (this.cursorName()) ? true : false;
        if (!cursoredDisplay) {
            text.html(dispVal).style("left", x + "px").style("top", y + "px").style("position", "absolute")
                              .style("width", w + "px").style("height", h + "px").style("color", "white")
                              .style("font-size", (parseFloat(h) * 0.8) + "px");

        } else {
            text.style("left", x + "px").style("top", y + "px").style("position", "absolute")
                .style("width", w + "px").style("height", h + "px").style("color", "white")
                .append("canvas").attr("width", w).attr("height", h).attr("id", "display");
            var disp = new CursoredDisplay("display", w, h);
            // parse cursor position
            disp.renderNumber(dispVal.toString(), +state[this.cursorName()]);
        }
        //read out the display if audio is enabled for this display widget
        if (this.auditoryFeedback()) {
            Speaker.speak(dispVal.toString());
        }
    };

    Display.prototype.toJSON = function () {
        return {
            type: this.type(),
            id: this.id(),
            displayKey: this.displayKey(),
            cursorName: this.cursorName(),
            auditoryFeedback: this.auditoryFeedback()
        };
    };
    
    Display.prototype.remove = function () {
        Display.prototype.parentClass.remove.apply(this);
        d3.select("div." + this.id()).remove();
    };
    
    /**
        Updates the location of the display widget with the given position
    */
    Display.prototype.updateLocationAndSize = function (pos) {
        Display.prototype.parentClass.updateLocationAndSize.apply(this, arguments);
        d3.select("div." + this.id()).style("left", pos.x + "px").style("top", pos.y + "px")
            .style("width", pos.width + "px").style("height", pos.height + "px").style("font-size", (pos.height * 0.8) + "px");
        ///FIXME cursored display should be used as a standalone widget
        var cursoredDisplay = (this.cursorName()) ? true : false;
        if (cursoredDisplay) {
            d3.select("div." + this.id() + " canvas#display").style("width", pos.width + "px").style("height", pos.height + "px");
        }
    };

    Display.prototype.updateWithProperties = function (props) {
        Display.prototype.parentClass.updateWithProperties.apply(this, arguments);
        //check if props contains a regex property and use that as displayKey if there is not display key
        if (props.regex && !props.displayKey) {
            this.displayKey(props.regex.split(":=")[0]);
        }
    };
    
    module.exports = Display;
});
