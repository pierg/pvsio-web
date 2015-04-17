/** @module EmuchartsEditor */
/**
 * EmuchartsEditor handles rendering of emuchart diagrams.
 * This is code is a re-engineered version of stateMachine.js implemented in branch emulink-commented
 * @author Paolo Masci
 * @date 14/05/14 5:16:13 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*jshint unused:false*/
define(function (require, exports, module) {
    "use strict";

    var d3 = require("d3/d3"),
        eventDispatcher = require("util/eventDispatcher"),
        Emucharts = require("plugins/emulink/Emucharts"),
        EditorModeUtils = require("plugins/emulink/EmuchartsEditorModes");

    var dbg = false;

    // the emuchart data
    var emucharts;

    // constants for drawing states
    var width  = 900;
    var height = 800;
    var colors = d3.scale.category10();
    var fontSize = 10;
    var defaultWidth = 32;
    var defaultHeight = 32;

    // constants for drawing transitions
    var stroke_width_large = "20px";
    var stroke_width_highlighted = "1.5px";
    var stroke_width_normal = "1px";

    // mouse event vars used for identifying gestures like creating a new transition
    var mousedown = { node: null, path: null };
    var mouseup = { node: null, path: null };
    var mouseover = { node: null, path: null };
    var mousedrag = { node: null, path: null };
    var drag_line; // drag line used when creating new transitions
    var sensitivity = { x: 8, y: 8 };
    // mouseOverControlPoint holds an edge object when the mouse is over the control point of an edge
    var mouseOverControlPoint = null;

    // editor modes
    var MODE = new EditorModeUtils();
    var editor_mode = MODE.BROWSE();

    var _this = null;

    function resetView() {
        d3.select("#ContainerStateMachine svg").select("#InitialTransitions").attr("transform", "translate(0,0) scale(1)");
        d3.select("#ContainerStateMachine svg").select("#Transitions").attr("transform", "translate(0,0) scale(1)");
        d3.select("#ContainerStateMachine svg").select("#States").attr("transform", "translate(0,0) scale(1)");
    }

    var getMouseMovement = function (event) {
        if (_this.mouseMovement.ready === false) {
            _this.mouseMovement.previousScreen.x = event.screenX;
            _this.mouseMovement.currentScreen.x = event.screenX;
            _this.mouseMovement.previousScreen.y = event.screenY;
            _this.mouseMovement.currentScreen.y = event.screenY;
            _this.mouseMovement.ready = true;
            return { x: 0, y: 0 };
        }
        _this.mouseMovement.previousScreen.x = _this.mouseMovement.currentScreen.x;
        _this.mouseMovement.previousScreen.y = _this.mouseMovement.currentScreen.y;
        _this.mouseMovement.currentScreen.x = event.screenX;
        _this.mouseMovement.currentScreen.y = event.screenY;
        return {
            x: (_this.mouseMovement.currentScreen.x - _this.mouseMovement.previousScreen.x),
            y: (_this.mouseMovement.currentScreen.y - _this.mouseMovement.previousScreen.y)
        };
    };

    /**
     * Constructor
     * @memberof EmuchartsEditor
     */
    function EmuchartsEditor(emucharts) {
        _this = this;
        this.d3EventScale = 1;
        this.d3EventTranslate = [0, 0];
        this.mouseMovement = {
            ready: false,
            previousScreen: { x: 0, y: 0 },
            currentScreen: { x: 0, y: 0 }
        };
        this.emucharts = emucharts || new Emucharts();
        this.emucharts.addListener("emuCharts_stateAdded", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_stateRemoved", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_constantAdded", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_variableAdded", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_transitionAdded", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_transitionRenamed", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_transitionRemoved", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_initialTransitionAdded", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_initialTransitionRenamed", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_initialTransitionRemoved", function (event) { _this.fire(event); });
        this.emucharts.addListener("emuCharts_stateRenamed", function (event) { _this.fire(event); });
        this.dragged = false;
        this.SVGdragged = null;
        resetView();
        eventDispatcher(this);
    }


    /**
     * Interface function for setting editor mode
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.set_editor_mode = function (mode) {
        if (mode >= 0) {
            editor_mode = mode;
            var event = {type: "emuCharts_editorModeChanged", mode: editor_mode};
            this.fire(event);
        } else {
            console.log("dbg: warning, unknown editor mode " + mode);
            return;
        }
    };



    /**
     * Utility function for trimming values so that they don't exceed a given range min-max
     * @returns trimmed value
     * @memberof EmuchartsEditor
     */
    function trim(val, min, max) {
        return (val < max) ? ((val > min) ? val : min) : max;
    }
    function inc02(val, max) {
        return (val + 0.2 < max) ? val + 0.2 : val;
    }
    function dec02(val, min) {
        return (val - 0.2 > min) ? val - 0.2 : val;
    }

    /**
     * Interface functions for zooming in and out
     * @returns trimmed value
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.zoomChart = function () {
        if (this.emucharts && !this.emucharts.empty()) {
            d3.select("#ContainerStateMachine svg").select("#States")
                .attr("transform", "translate(" + this.d3EventTranslate + ") scale(" + this.d3EventScale + ")");
            d3.select("#ContainerStateMachine svg").select("#Transitions")
                .attr("transform", "translate(" + this.d3EventTranslate + ") scale(" + this.d3EventScale + ")");
            d3.select("#ContainerStateMachine svg").select("#InitialTransitions")
                .attr("transform", "translate(" + this.d3EventTranslate + ") scale(" + this.d3EventScale + ")");
            d3.select("#ContainerStateMachine svg").select("#dragline")
                .attr("transform", "translate(" + this.d3EventTranslate + ") scale(" + this.d3EventScale + ")");
        }
    };
    EmuchartsEditor.prototype.zoom_in = function () {
        this.d3EventScale = inc02(this.d3EventScale, 4);
        this.zoomChart();
    };
    EmuchartsEditor.prototype.zoom_out = function () {
        this.d3EventScale = dec02(this.d3EventScale, 0.5);
        this.zoomChart();
    };
    EmuchartsEditor.prototype.zoom_reset = function () {
        this.d3EventScale = 1;
        this.zoomChart();
    };


    /**
     * Utility function to generate formatted labels for transitions
     * @returns labels, as a formatted string
     * @memberof EmuchartsEditor
     */
    function labelToString(label) {
        var ans = "";
        if (label.listConditions) {
            label.listConditions.forEach(function (cond) { ans += cond + "; "; });
            ans = " [ " + ans + " ] ";
        }
        if (label.listOfOperations) {
            label.listOfOperations.forEach(function (item) { ans += item + "; "; });
            ans = " { " + ans + " } ";
        }
        return ans;
    }


    /**
     * Utility function to draw edges between nodes
     * @memberof EmuchartsEditor
     */
    var lineFunction = d3.svg.line()
                         .x(function (d) { return d.x; })
                         .y(function (d) { return d.y; })
                        //.interpolate("basic");
                         .interpolate("cardinal");

    var lineFunction_bundle = d3.svg.line()
                         .x(function (d) { return d.x; })
                         .y(function (d) { return d.y; })
                         .interpolate("bundle");


    /**
     * Utility function to obtain control points for edges
     * @params edge
     * @returns vector of control points (3 elements vector)
     * @memberof EmuchartsEditor
     */
    function getControlPoints(edge) {
        var sourceX = edge.source.x;
        var sourceY = edge.source.y;
        var targetX = edge.target.x;
        var targetY = edge.target.y;

        var offset = 0;
        var controlPoint1X = (edge.controlPoint) ? edge.controlPoint.x
                            : (edge.source.id === edge.target.id) ? (targetX + sourceX) / 2 + offset
                            : (targetX + sourceX) / 2 - offset;
        var controlPoint1Y = (edge.controlPoint) ? edge.controlPoint.y
                            : (edge.source.id === edge.target.id) ? (targetY + sourceY) / 2 + offset
                            : (targetY + sourceY) / 2 - offset;

        //var dx = edge.target.x - edge.source.x;
        //var dy = edge.target.y - edge.source.y;
        var dx_target = controlPoint1X - edge.target.x;
        var dy_target = controlPoint1Y - edge.target.y;
        var dx_source = controlPoint1X - edge.source.x;
        var dy_source = controlPoint1Y - edge.source.y;

        var targetWidth  = d3.select("#box_" + edge.target.id).attr("width");
        var targetHeight = d3.select("#box_" + edge.target.id).attr("height");
        var sourceWidth  = d3.select("#box_" + edge.source.id).attr("width");
        var sourceHeight = d3.select("#box_" + edge.source.id).attr("height");
//        var sourceWidth = edge.source.name.length * fontSize;
//        var sourceHeight = edge.source.height;
//        var targetWidth  = edge.target.name.length * fontSize;
//        var targetHeight = edge.target.height;
        var sourceWidth05 = sourceWidth / 2;
        var sourceHeight05 = sourceHeight / 2;
        var targetWidth05 = targetWidth / 2;
        var targetHeight05 = targetHeight / 2;


        // NOTE: SVG has the y axis inverted with respect to the Cartesian y axis
        if (dx_target >= targetWidth05 &&
                dy_target >= -targetHeight05 &&
                dy_target < targetHeight05) {
            //console.log("I");
            targetX += (targetWidth05 < 18) ? 18 : targetWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 - offset;
            }
        } else if (dx_target >= targetWidth05 &&
                dy_target >= targetHeight05) {
            //console.log("II");
            targetY += targetHeight05;
            targetX += (targetWidth05 < 18) ? 18 : targetWidth05;
            if (!edge.controlPoint) {
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_target < targetWidth05 &&
                    dx_target >= -targetWidth05 &&
                    dy_target >= targetHeight05) {
            //console.log("III");
            targetY += targetHeight05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_target < targetWidth05 &&
                    dy_target >= targetHeight / 2) {
            //console.log("IV");
            targetX -= (targetWidth05 < 18) ? 18 : targetWidth05;
            targetY += sourceHeight05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_target < targetWidth05 &&
                    dy_target < targetHeight05 &&
                    dy_target >= -targetHeight05) {
            //console.log("V");
            targetX -= (targetWidth05 < 18) ? 18 : targetWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_target < -targetWidth05 &&
                    dy_target < -targetHeight / 2) {
            //console.log("VI");
            targetX -= (targetWidth05 < 18) ? 18 : targetWidth05;
            targetY -= targetHeight05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_target < targetWidth05 &&
                    dx_target >= -targetWidth05 &&
                    dy_target < -targetHeight05) {
            //console.log("VII");
            targetY -= targetHeight05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_target >= targetWidth05 &&
                    dy_target < -targetHeight05) {
            //console.log("VIII");
            targetY -= targetHeight05;
            targetX += (targetWidth05 < 18) ? 18 : targetWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
            }
        }

        //console.log("dx_source = " + dx_source + " dy_source = " + dy_source);
        if (dx_source >= sourceWidth05 &&
                dy_source >= -sourceHeight05 &&
                dy_source < sourceHeight05) {
            //console.log("I");
            sourceX += (sourceWidth05 < 18) ? 18 : sourceWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 - offset;
            }
        } else if (dx_source >= sourceWidth05 &&
                dy_source >= sourceHeight05) {
            //console.log("II");
            sourceY += sourceHeight05;
            sourceX += (sourceWidth05 < 18) ? 18 : sourceWidth05;
            if (!edge.controlPoint) {
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_source < sourceWidth05 &&
                    dx_source >= -sourceWidth05 &&
                    dy_source >= sourceHeight05) {
            //console.log("III");
            sourceY += sourceHeight05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_source < sourceWidth / 2 &&
                    dy_source >= sourceHeight / 2) {
            //console.log("IV");
            sourceX -= (sourceWidth05 < 18) ? 18 : sourceWidth05;
            sourceY += sourceHeight05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_source < sourceWidth05 &&
                    dy_source < sourceHeight05 &&
                    dy_source >= -sourceHeight05) {
            //console.log("V");
            sourceX -= (sourceWidth05 < 18) ? 18 : sourceWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_source < -sourceWidth05 &&
                    dy_source < -sourceHeight05) {
            //console.log("VI");
            sourceX -= (sourceWidth05 < 18) ? 18 : sourceWidth05;
            sourceY -= sourceHeight05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_source < sourceWidth05 &&
                    dx_source >= -sourceWidth05 &&
                    dy_source < -sourceHeight05) {
            //console.log("VII");
            sourceY -= sourceHeight05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
                controlPoint1Y = (targetY + sourceY) / 2 + offset;
            }
        } else if (dx_source >= sourceWidth05 &&
                    dy_source < -sourceHeight05) {
            //console.log("VIII");
            sourceY -= sourceHeight05;
            sourceX += (sourceWidth05 < 18) ? 18 : sourceWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2 + offset;
            }
        }

        return [{ "x": sourceX, "y": sourceY },
                { "x": controlPoint1X, "y": controlPoint1Y},
                { "x": targetX, "y": targetY }];
    }

    /**
     * Utility function to obtain virtual control points for self-edges
     * @params self-edge
     * @returns vector of control points (5 elements vector)
     * @memberof EmuchartsEditor
     * FIXME: return a structure rather than an array
     * FIXME: merge this function with the other function getControlPoints
     * FIXME: save extra control points so that the cpu time required for rendering is reduced
     */
    function getControlPoints_selfEdge(edge) {
        var sourceX = edge.source.x;
        var sourceY = edge.source.y;
        var targetX = edge.target.x;
        var targetY = edge.target.y;

        var controlPoint1X = (edge.controlPoint) ? edge.controlPoint.x : targetX + edge.target.name.length * fontSize;
        var controlPoint1Y = (edge.controlPoint) ? edge.controlPoint.y : targetY + edge.target.height * 1.4;
        edge.controlPoint = { x: controlPoint1X, y: controlPoint1Y };

        var extraControlPoints = [];
        //var dx = edge.target.x - edge.source.x;
        //var dy = edge.target.y - edge.source.y;
        var dx = edge.target.x - controlPoint1X;
        var dy = edge.target.y - controlPoint1Y;
        var offsetX = (dx < 0) ? -dx : dx;
        var offsetY = (dy < 0) ? -dy : dy;
        offsetX = (offsetX > edge.target.width) ? offsetX : edge.target.width / 2;
        offsetY = (offsetY > edge.target.height) ? offsetY : edge.target.height / 2;
        var targetWidth  = d3.select("#box_" + edge.target.id).attr("width");
        var targetHeight = d3.select("#box_" + edge.target.id).attr("height");
        var targetWidth05  = targetWidth / 2;
        var targetHeight05 = targetHeight / 2;

        // to identify control points, we split the space into four Cartesian quadrants:
        // the source node is at the center of the axes, and the target is in one of the quadrants
        //  II  |  I
        // -----s-----
        // III  |  IV
        // NOTE: SVG has the y axis inverted with respect to the Cartesian y axis
        if (dx >= 0 && dy < 0) {
            // target node is in quadrant I
            //console.log("Quadrant I");
            // for targets in quadrant I, round links draw convex arcs
            // --> place the arrow on the left side of the target
            targetX -= (targetWidth05 < 20) ? 20 : targetWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2;
                controlPoint1Y = (targetY + sourceY) / 2;
            }
            // move the first control point to quadrant II
            sourceY += targetHeight05;
            // create extra control points to avoid stiffy curves
            extraControlPoints[0] = { x: controlPoint1X + offsetX / 2,
                                      y: (offsetY > targetHeight) ?
                                            controlPoint1Y + offsetY / 4
                                            : controlPoint1Y + offsetY / 2 };
            extraControlPoints[1] = { x: (offsetX > targetWidth) ?
                                            controlPoint1X - offsetX / 16
                                            : controlPoint1X - offsetX / 4,
                                      y: controlPoint1Y - offsetY / 2 };
        } else if (dx < 0 && dy < 0) {
            //console.log("Quadrant II");
            // target node is in quadrant II
            // for targets in quadrant I, round links draw concave arcs
            // --> place the arrow at the bottom-right corner of the target
            targetY += targetHeight05;
            if (!edge.controlPoint) {
                controlPoint1Y = (targetY + sourceY) / 2;
            }
            // move the first control point to quadrant III
            sourceX += (targetWidth05 < 20) ? 20 : targetWidth05;
            // create extra control points to avoid stiffy curves
            extraControlPoints[0] = { x: (offsetX > targetWidth) ?
                                            controlPoint1X + offsetX / 16
                                            : controlPoint1X + offsetX / 4,
                                      y: controlPoint1Y - offsetY / 2 };
            extraControlPoints[1] = { x: controlPoint1X - offsetX * 0.6,
                                      y: (offsetY > targetHeight) ?
                                            controlPoint1Y - offsetY / 16
                                            : controlPoint1Y + offsetY / 2};
        } else if (dx < 0 && dy >= 0) {
            //console.log("Quadrant III");
            // target node is in quadrant III
            // for targets in quadrant IV, round links draw concave arcs
            // --> place arrow end on the top-right corner of the target
            targetX += (targetWidth05 < 20) ? 20 : targetWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2;
                controlPoint1Y = (targetY + sourceY) / 2;
            }
            // move the first control point to quadrant IV
            sourceY -= targetHeight05;
            // create extra control points to avoid stiffy curves
            extraControlPoints[0] = { x: controlPoint1X - offsetX / 2,
                                      y: (offsetY > targetHeight) ?
                                            controlPoint1Y - offsetY / 16
                                            : controlPoint1Y - offsetY / 2};
            extraControlPoints[1] = { x: controlPoint1X + offsetX / 16,
                                      y: controlPoint1Y + offsetY / 2 };
        } else if (dx >= 0 && dy >= 0) {
            //console.log("Quadrant IV");
            // target node is in quadrant IV
            // for targets in quadrant IV, round links draw convex arcs
            // --> place arrow end at the top-left corner of the target
            targetY -= targetHeight05;
            // move the first control point to quadrant I so that the self-edge looks round
            sourceX -= (targetWidth05 < 20) ? 20 : targetWidth05;
            if (!edge.controlPoint) {
                controlPoint1X = (targetX + sourceX) / 2;
            }
            // create extra control points to avoid stiffy curves
            extraControlPoints[0] = { x: controlPoint1X - offsetX / 16,
                                      y: controlPoint1Y + offsetY / 2};
            extraControlPoints[1] = { x: controlPoint1X + offsetX / 2,
                                      y: (offsetY > targetHeight) ?
                                            controlPoint1Y - offsetY / 4
                                            : controlPoint1Y - offsetY / 2 };// controlPoint1Y + offsetY / 16 };
        }

        return [{ "x": sourceX, "y": sourceY },
                { "x": extraControlPoints[0].x, "y": extraControlPoints[0].y },
                { "x": controlPoint1X, "y": controlPoint1Y},
                { "x": extraControlPoints[1].x, "y": extraControlPoints[1].y },
                { "x": targetX, "y": targetY }];
    }

    /**
     * Utility function to refresh rendered transitions.
     * @returns reference to the updated svg elements
     * @memberof EmuchartsEditor
     */
    function refreshTransitions(transitions) {
        transitions = transitions ||
            d3.select("#ContainerStateMachine svg").select("#Transitions").selectAll(".transition");
        var label;
        var cpoints;
        // refresh paths and labels
        transitions.selectAll(".path").attr("d", function (edge) {
            // fetch control point
            var cp = null;
            // refresh transition path
            if (edge.target && edge.source) {
                if (edge.target.id === edge.source.id) {
                    cp = getControlPoints_selfEdge(edge);
                    // this is a self-edge
                    // refresh transition label
                    label = d3.select(this.parentNode).select(".tlabel");
                    label.text(function (edge) {
                        return edge.name + labelToString(edge);
                    });
                    // adjust text position
                    label.attr("x", function (edge) {
                        if (edge.target.id === edge.source.id) {
                            // self-edge
                            return (edge.controlPoint) ?
                                    (edge.source.x < edge.controlPoint.x) ? edge.controlPoint.x + 8 : edge.controlPoint.x - 16
                                    : edge.source.x + 32;
                        }
                        // else do nothing -- textpath will take care of placing the text
                        return "";
                    }).attr("y", function (edge) {
                        if (edge.target.id === edge.source.id) {
                            // self-edge
                            return (edge.controlPoint) ?
                                    (edge.source.y < edge.controlPoint.y) ? edge.controlPoint.y + 8 : edge.controlPoint.y - 8
                                    : edge.source.y + 56;
                        }
                        // else do nothing -- textpath will take care of placing the text
                        return "";
                    });
                    // refresh control points
                    cpoints = d3.select(this.parentNode).select(".cpoints");
                    cpoints.attr("cx", cp[2].x).attr("cy", cp[2].y);
                    // refresh path
                    return lineFunction(cp);
                } else {
                    // not a self-edge
                    cp = getControlPoints(edge);
                    // refresh transition label
                    label = d3.select(this.parentNode.lastChild.firstChild);
                    label.text(function (edge) {
                        return edge.name + labelToString(edge);
                    });
                    // refresh control points
                    cpoints = d3.select(this.parentNode).select(".cpoints");
                    // for now we use only the middle control point
                    cpoints.attr("cx", cp[1].x).attr("cy", cp[1].y);
                    // flip path if edge.source.x > edge.target.x
                    if (edge.source.x >= edge.target.x) {
                        var swap = cp[0];
                        cp[0] = cp[2];
                        cp[2] = swap;
                        d3.select(this.parentNode).select(".path")
                            .style("marker-end", "")
                            .style("marker-start", "url(#end-arrow-rotated)");
                    } else {
                        if (d3.select(this).attr("style").indexOf("marker-start") >= 0) {
                            d3.select(this.parentNode).select(".path")
                                .style("marker-end", "url(#end-arrow)")
                                .style("marker-start", "");
                        }
                    }
                    // refresh path
                    return lineFunction(cp);
                }
            }
        });
        return transitions;
    }

    /**
     * Utility function to refresh rendered initial transitions.
     * @returns reference to the updated svg elements
     * @memberof EmuchartsEditor
     */
    function refreshInitialTransitions(transitions) {
        transitions = transitions ||
            d3.select("#ContainerStateMachine svg").select("#Transitions").selectAll(".itransition");
        var label;
        // refresh paths and labels
        transitions.selectAll(".ipath").attr("d", function (edge) {
            // refresh transition label
            label = d3.select(this.parentNode).select(".itlabel");
            label.text(function (edge) {
                return edge.name + labelToString(edge);
            });
            // adjust text position
            label.attr("x", function (edge) {
                return (edge.controlPoint) ? edge.controlPoint.x : edge.target.x + 32;
            }).attr("y", function (edge) {
                return (edge.controlPoint) ? edge.controlPoint.y : edge.target.y - 32;
            });
            // adjust text position
            label.attr("x", function (edge) {
                return edge.target.x - 8;
            }).attr("y", function (edge) {
                return edge.target.y - 44;
            });
            // redraw edge
            return "M" + (edge.target.x - edge.target.width / 2 - 10) + ',' +
                    (edge.target.y - edge.target.width / 2 - 32) + "q 16 8 28 28";
        });
        return transitions;
    }

    /**
     * Utility function for removing transitions from the SVG
     * @returns reference to the updated svg elements
     * @memberof EmuchartsEditor
     */
    function removeTransitions(exitedTransitions) {
        return exitedTransitions
                    .transition().duration(220)
                    .style("stroke-width", stroke_width_large)
                    .style("opacity", 0).remove();
    }

    /**
     * Utility function for creating an empty svg area and definitions
     * @returns reference to the transitions redrawn (svg element)
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.newSVG = function () {
        _this = this;

        // create canvas to be used for exporting svg area as picture
        d3.select("#ContainerStateMachineImage").append("canvas")
            .attr("width", width).attr("height", height)
            .attr("style", "display: none");
        d3.select("#ContainerStateMachineImage").append("div")
            .attr("id", "svgdataurl").attr("style", "display: none");

        // create svg area
        d3.select("#ContainerStateMachine")
            .append("svg")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            //.attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
            .attr("width", width).attr("height", height)
            .style("background", "white")
            .append("svg:defs")
            .append("svg:marker")
            .attr("id", "end-arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 9)
            .attr("markerWidth", 16)
            .attr("markerHeight", 16)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M4,0 L1,-3 L10,0 L1,3 L4,0")
            .attr("fill", "black");


        var arrow_rotated = d3.select("#ContainerStateMachine").select("svg").select("defs")
            .append("svg:marker")
            .attr("id", "end-arrow-rotated")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 1)
            .attr("markerWidth", 16)
            .attr("markerHeight", 16)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M1,0 L10,-3 L6,0 L10,3 L1,0")
            .attr("fill", "black");

        var arrow_rotated_selected = d3.select("#ContainerStateMachine").select("svg").select("defs")
            .append("svg:marker")
            .attr("id", "end-arrow-rotated-selected")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 1)
            .attr("markerWidth", 16)
            .attr("markerHeight", 16)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M1,0 L10,-3 L6,0 L10,3 L1,0")
            .attr("fill", "green");

        var arrow = d3.select("#ContainerStateMachine").select("svg").select("defs")
            // pointer for hiighlighed edges
            .append("svg:marker")
            .attr("id", "end-arrow-selected")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 9)
            .attr("markerWidth", 16)
            .attr("markerHeight", 16)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M4,0 L1,-3 L10,0 L1,3 L4,0")
            .attr("fill", "green");

        var bubble = d3.select("#ContainerStateMachine").select("svg").select("defs")
            // bubble for initial state
            .append("svg:marker")
            .attr("id", "bubble")
            .attr("viewBox", "-5 -5 10 10")
            .attr("refX", -4)
            .attr("markerWidth", 16)
            .attr("markerHeight", 16)
            .attr("orient", "auto");
        bubble.append("svg:circle")
            .attr("r", 4)
            .attr("stroke", "black")
            .attr("fill", "black");
        bubble.append("svg:circle")
            .attr("r", 3.6)
            .attr("stroke", "white")
            .attr("stroke-width", "1");

        var selected_bubble = d3.select("#ContainerStateMachine").select("svg").select("defs")
            // bubble for initial state
            .append("svg:marker")
            .attr("id", "bubble-selected")
            .attr("viewBox", "-5 -5 10 10")
            .attr("refX", -4)
            .attr("markerWidth", 16)
            .attr("markerHeight", 16)
            .attr("orient", "auto");
        selected_bubble.append("svg:circle")
            .attr("r", 4)
            .attr("stroke", "green")
            .attr("fill", "green");
        selected_bubble.append("svg:circle")
            .attr("r", 3.6)
            .attr("stroke", "white")
            .attr("fill", "green")
            .attr("stroke-width", "1");

        d3.select("#ContainerStateMachine").select("svg").select("defs")
            // arrow for drag line
            .append("svg:marker")
            .attr("id", "drag-arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 9)
            .attr("markerWidth", 16)
            .attr("markerHeight", 16)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M4,0 L1,-3 L10,0 L1,3 L4,0")
            .attr("fill", "black");

        drag_line = d3.select("#ContainerStateMachine").select("svg")
            .append("svg:path")
            .attr("id", "dragline")
            .attr("class", "link dragline hidden")
            .attr("d", "M0,0L0,0");

        d3.select("#ContainerStateMachine").select("svg").append("svg:g").attr("id", "InitialTransitions");
        d3.select("#ContainerStateMachine").select("svg").append("svg:g").attr("id", "Transitions");
        d3.select("#ContainerStateMachine").select("svg").append("svg:g").attr("id", "States");

        var zoom = d3.behavior.zoom().scaleExtent([0.5, 4]).on("zoom", function () {
            d3.event.sourceEvent.stopPropagation();
            if (editor_mode === MODE.ADD_TRANSITION() && mousedrag.edge) {
                var m = d3.mouse(d3.select("#ContainerStateMachine svg").select("#States").node());
                // initial transition
                drag_line.attr("d", "M" + mousedrag.edge.x + "," + mousedrag.edge.y +
                                "L" + m[0] + "," + m[1]);
            } else if (editor_mode !== MODE.ADD_TRANSITION() && !mousedrag.node &&
                    editor_mode !== MODE.DELETE() && editor_mode !== MODE.RENAME()) {
                d3.event.sourceEvent.stopPropagation();
                var event = d3.event.sourceEvent;
                if (event.type === "mousemove") {
//                    note: movementX and movementY are not supported by all browser, therefore we are not using them for now
//                    console.log(getMouseMovement(event));
//                    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
//                    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
//                    _this.d3EventTranslate[0] += movementX * d3.behavior.zoom().scale();
//                    _this.d3EventTranslate[1] += movementY * d3.behavior.zoom().scale();
//                    console.log([movementX, movementY]);
                    var movement = getMouseMovement(event);
//                    console.log(movement);
                    _this.d3EventTranslate[0] += movement.x * d3.behavior.zoom().scale();
                    _this.d3EventTranslate[1] += movement.y * d3.behavior.zoom().scale();
                    d3.select("#ContainerStateMachine svg").select("#States")
                        .attr("transform", "translate(" + _this.d3EventTranslate +
                              ") scale(" + _this.d3EventScale + ")");
                    d3.select("#ContainerStateMachine svg").select("#Transitions")
                        .attr("transform", "translate(" + _this.d3EventTranslate +
                              ") scale(" + _this.d3EventScale + ")");
                    d3.select("#ContainerStateMachine svg").select("#InitialTransitions")
                        .attr("transform", "translate(" + _this.d3EventTranslate +
                              ") scale(" + _this.d3EventScale + ")");
                    d3.select("#ContainerStateMachine svg").select("#dragline")
                        .attr("transform", "translate(" + _this.d3EventTranslate +
                              ") scale(" + _this.d3EventScale + ")");
                    if (_this.SVGdragged === null) {
                        _this.SVGdragged = [_this.d3EventTranslate[0], _this.d3EventTranslate[1]];
                    }
//                    if (dbg) { console.log("Drag canvas"); }
                }
            }
        });
        var mouseUp = function () {
            if (editor_mode === MODE.ADD_TRANSITION()) {
                // this is equivalent to drag end
                // remove drag line
                drag_line.classed("hidden", true)
                         .style("marker-end", "")
                         .style("marker-start", "")
                         .attr("d", "M0,0L0,0");
                if (mouseover.node && !mousedrag.node) {
                    // fire event
                    _this.fire({
                        type: "emuCharts_addInitialTransition",
                        source: null,
                        target: mouseover.node
                    });
                }
                mousedrag.edge = null;
            }
            _this.mouseMovement.ready = false;
        };
        var mouseDown = function () {
            if (mouseOverControlPoint === null &&
                    editor_mode === MODE.ADD_TRANSITION()) {
                d3.event.stopPropagation();
                // this is equivalent to drag start for default-initial transitions
                // create an arrow from the selected node to the cursor position
                var m = d3.mouse(d3.select("#ContainerStateMachine svg").select("#States").node());
                if (!mousedrag.edge) {
                    mousedrag.edge = { x: m[0], y: m[1] };
                }
                drag_line.classed("hidden", false)
                    .style("marker-end", "url(#drag-arrow)")
                    .style("marker-start", "url(#bubble)")
                    .attr("d", "M" + m[0] + "," + m[1] +
                                "L" + m[0] + "," + m[1]);
            }
            _this.mouseMovement.ready = false;
        };
        var mouseClick = function () {
            if (editor_mode === MODE.ADD_STATE() && !mouseover.node && !mouseOverControlPoint) {
                if (_this.SVGdragged === null ||
                        (Math.abs(_this.SVGdragged[0] - _this.d3EventTranslate[0]) < sensitivity.x &&
                             Math.abs(_this.SVGdragged[1] - _this.d3EventTranslate[1]) < sensitivity.y)) {
                    d3.event.stopPropagation();
                    var m = d3.mouse(d3.select("#ContainerStateMachine svg").select("#States").node());
                    _this.fire({
                        type: "emuCharts_addState",
                        mouse: m,
                        mouseover: mouseover,
                        preventCreation: editor_mode !== MODE.ADD_STATE()
                    });
                }
            }
            _this.SVGdragged = null;
            _this.mouseMovement.ready = false;
        };
        var mouseMove = function () {
            var m = d3.mouse(d3.select("#ContainerStateMachine svg").node());
//            console.log(m);
//            console.log(event);
            d3.selectAll("#MouseOverlayIcon").style("display", function () {
                if ((this.getAttribute("placeholder") === "addStates" && editor_mode === MODE.ADD_STATE()) ||
                        (this.getAttribute("placeholder") === "addTransitions" && editor_mode === MODE.ADD_TRANSITION()) ||
                        (this.getAttribute("placeholder") === "rename" && editor_mode === MODE.RENAME()) ||
                        (this.getAttribute("placeholder") === "delete" && editor_mode === MODE.DELETE())) {
                    return "block";
                }
                return "none";
            });
            var style = "left: " + (m[0] + 20) + "px; top: " + (m[1] - 10) + "px;";
            var mouseOverlay = d3.select("#MouseOverlay")
                                    .attr("style", style);
        };
        var mouseOut = function () {
            d3.selectAll("#MouseOverlayIcon").style("display", "none");
            _this.mouseMovement.ready = false;
        };
        d3.select("#ContainerStateMachine svg")
            .on("click", mouseClick)
            .on("mousedown", mouseDown)
            .on("mouseup", mouseUp)
            .on("mousemove", mouseMove)
            .on("mouseout", mouseOut)
            .call(zoom);

        // return reference to svg
        return d3.select("#ContainerStateMachine").select("svg");
    };

    /**
     * Utility function for drawing transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.renderTransitions = function () {
        _this = this;
        var svg = d3.select("#ContainerStateMachine").select("svg");

        /**
         * Utility function for drawing transitions
         * @returns a reference to the entered transitions
         */
        var drawTransitions = function (enteredTransitions) {
            enteredTransitions = enteredTransitions.append("svg:g")
                .classed("transition", true)
                .attr("id", function (edge) { return edge.id; });

            // visiblePath is the actual path visible to the user
            var visiblePath = enteredTransitions.append("svg:path").classed("path", true)
                .attr("id", function (edge) { return "path_" + edge.id; })
                .attr("fill", "none")
                .style("stroke", "black")
                .style("stroke-width", stroke_width_normal)
                .style("markerUnits", "userSpaceOnUse")
                .style("marker-end", "url(#end-arrow)");

            // selection path is used to ease selection with the mouse (it's wide)
            var selectionPath = enteredTransitions.append("svg:path").classed("path", true)
                .attr("id", function (edge) {return "selectionPath_" + edge.id; })
                .style("opacity", "0")
                .attr("fill", "none")
                .style("stroke", "grey")
                .style("stroke-width", stroke_width_large)
                .style("markerUnits", "userSpaceOnUse")
                .style("cursor", "pointer");

            // control points are used to adjust the shape of a path
            var controlPoints = enteredTransitions.append("svg:circle").classed("cpoints", true)
                .attr("id", function (edge) {return "cpoints_" + edge.id; })
                .attr("cx", function (edge) {
                    if (edge.source && edge.target && edge.source.id === edge.target.id) {
                        return getControlPoints_selfEdge(edge)[2].x;
                    }
                    return getControlPoints(edge)[1].x;
                })
                .attr("cy", function (edge) {
                    if (edge.source && edge.target && edge.source.id === edge.target.id) {
                        return getControlPoints_selfEdge(edge)[2].y;
                    }
                    return getControlPoints(edge)[1].y;
                })
                .attr("fill", "#fff")
                .style("stroke", "steelblue")
                .style("stroke-width", "1.5px")
                .attr("opacity", 0)
                .attr("r", 10)
                .style("cursor", "move");


            // labels are drawn using both text and textpath
            // the former is for self-edges, the latter for all other edges
            var text = enteredTransitions.append("svg:text").classed("tlabel", true)
                .attr("id", function (d) { return "tlabel_" + d.id; })
                .style("font", (fontSize + "px sans-serif"))
                .style("text-rendering", "optimizeLegibility")
                .style("cursor", "pointer") // change cursor shape
                .attr("x", function (edge) {
                    if (edge.target.id === edge.source.id) {
                        // self-edge
                        return edge.source.x + 32;
                    }
                    // else do nothing -- textpath will take care of placing the text
                    return "";
                })
                .attr("y", function (edge) {
                    if (edge.target.id === edge.source.id) {
                        // self-edge
                        return edge.source.y - 32;
                    }
                    // else do nothing -- textpath will take care of placing the text
                    return "";
                })
                .text(function (edge) {
                    if (edge.target.id === edge.source.id) {
                        // text for self edges is rendered as standard text field
                        return edge.name + labelToString(edge);
                    }
                    // text for other edges is rendered as textpath
                    return "";
                });

            var textPath = enteredTransitions.append("svg:text").classed("tlabel", true)
                .attr("id", function (edge) { return "tlabel_" + edge.id; })
                .style("font", (fontSize + "px sans-serif"))
                .style("text-rendering", "optimizeLegibility")
                .style("text-anchor", "middle")
                .attr("dy", -4)
                .append("textPath")
                .attr("xlink:href", function (edge) { return "#path_" + edge.id; })
                .attr("startOffset", "50%")
                .style("cursor", "pointer") // change cursor shape
                .text(function (edge) {
                    if (edge.target.id === edge.source.id) {
                        // text for self edges is rendered as standard text field
                        return "";
                    }
                    // text for other edges is rendered here
                    return edge.name + labelToString(edge);
                });

            return refreshTransitions(enteredTransitions);
        };
        var mouseOver = function (edge) {
            if (!mousedrag.edge && (!mouseOverControlPoint || mouseOverControlPoint.id === edge)) {
                d3.event.stopPropagation();
                d3.select(this.firstChild)
                    //.style("stroke-width", stroke_width_highlighted)
                    .style("stroke", "green")
                    .style("marker-end", function (edge) {
                        if (edge.source.id === edge.target.id ||
                                edge.source.x < edge.target.x) {
                            return "url(#end-arrow-selected)";
                        } else { return ""; }
                    })
                    .style("marker-start", function (edge) {
                        if (edge.source.id === edge.target.id) {
                            return this.style.markerStart;
                        } else if (edge.source.x < edge.target.x) {
                            return "";
                        } else { return "url(#end-arrow-rotated-selected)"; }
                    });
                d3.select(this.childNodes[2]).attr("opacity", 0.6);
                d3.select(this.children[3]).style("fill", "green");
                d3.select(this.children[4]).style("fill", "green");
            }
            if (dbg) { console.log("Transitions.mouseOver"); }
        };
        var mouseOut = function (edge) {
            if (!mouseOverControlPoint) {
                d3.event.stopPropagation();
                d3.select(this.firstChild)
                    //.style("stroke-width", stroke_width_normal)
                    .style("stroke", "black")
                    .style("marker-end", function (edge) {
                        if (edge.source.id === edge.target.id ||
                                edge.source.x < edge.target.x) {
                            return "url(#end-arrow)";
                        } else { return ""; }
                    })
                    .style("marker-start", function (edge) {
                        if (edge.source.id === edge.target.id) {
                            return this.style.markerStart;
                        } else if (edge.source.x < edge.target.x) {
                            return "";
                        } else { return "url(#end-arrow-rotated)"; }
                    });
                d3.select(this.childNodes[2]).attr("opacity", 0);
                d3.select(this.children[3]).style("fill", "black");
                d3.select(this.children[4]).style("fill", "black");
            } else if (mouseOverControlPoint && mouseOverControlPoint.id === edge.id) {
                var m = d3.mouse(d3.select("#ContainerStateMachine svg").select("#States").node());
                // update selected control point
                var cp = { x: m[0], y: m[1] };
                _this.emucharts.set_controlPoint(mouseOverControlPoint, cp);
                var transitionID = mouseOverControlPoint.id;
                var transitions = d3.select("#ContainerStateMachine")
                                    .select("#Transitions").selectAll(".transition")
                                    .filter(function (transition) { return transition.id === transitionID; });
                // refresh transitions
                return refreshTransitions(transitions);
            }
            if (dbg) { console.log("Transitions.mouseOut"); }
        };
        var mouseClick = function (edge) {
            // stopPropagation is essential here to avoid messing up with state variables of the SVG drag/zoom events
            d3.event.stopPropagation();
            // update mouse variables
            mousedown.edge = edge;
            if (editor_mode === MODE.RENAME()) {
                _this.fire({
                    type: "emuCharts_renameTransition",
                    edge: edge
                });
            } else if (editor_mode === MODE.DELETE()) {
                _this.fire({
                    type: "emuCharts_deleteTransition",
                    edge: edge
                });
            }
            if (dbg) { console.log("Transitions.mouseClick"); }
        };
        var mouseDoubleClick = function (edge) {
            // stopPropagation is essential here to avoid messing up with state variables of the SVG drag/zoom events
            d3.event.stopPropagation();
            if (editor_mode !== MODE.DELETE()) {
                _this.fire({
                    type: "emuCharts_renameTransition",
                    edge: edge
                });
            }
            if (dbg) { console.log("Transitions.mouseDoubleClick"); }
        };
        var dragStart = function (node) {
            if (dbg) { console.log("Transitions.dragStart"); }
            // stopPropagation is essential here to avoid messing up with state variables of the SVG drag/zoom events
            d3.event.sourceEvent.stopPropagation();
        };
        var dragEdge = function (edge) {
            if (mouseOverControlPoint) {
                // stopPropagation is essential here to avoid messing up with state variables of the SVG drag/zoom events
                d3.event.sourceEvent.stopPropagation();
                var m = d3.mouse(d3.select("#ContainerStateMachine svg").select("#States").node());
                // update selected control point
                var cp = { x: m[0], y: m[1] };
                _this.emucharts.set_controlPoint(mouseOverControlPoint, cp);
                var transitionID = mouseOverControlPoint.id;
                var transitions = d3.select("#ContainerStateMachine")
                                    .select("#Transitions").selectAll(".transition")
                                    .filter(function (transition) { return transition.id === transitionID; });
                // refresh transitions
                return refreshTransitions(transitions);
            }
            if (dbg) { console.log("Transitions.dragEdge"); }
        };
        var dragEnd = function (node) {
            if (dbg) { console.log("Transitions.dragEnd"); }
            // stopPropagation is essential here to avoid messing up with state variables of the SVG drag/zoom events
            d3.event.sourceEvent.stopPropagation();
        };



        if (!this.emucharts || !this.emucharts.getEdges()) { return; }
        // create svg element, if needed
        if (svg.empty()) { svg = this.newSVG(); }
        var edges = this.emucharts.getEdges().values();
        if (edges) {
            // create a group of svg elements for transitions, and bind them to data
            var transitions = svg.select("#Transitions").selectAll(".transition")
                                    .data(edges, function (edge) { return edge.id; });
            var enteredTransitions = drawTransitions(transitions.enter());
            var exitedTransitions = removeTransitions(transitions.exit());
            var drag = d3.behavior.drag().origin(function (edge) {
                return edge;
            });
            drag.on("dragstart", dragStart)
                .on("drag", dragEdge)
                .on("dragend", dragEnd);
            enteredTransitions.call(drag)
                .on("mouseover", mouseOver)
                .on("mouseout", mouseOut)
                .on("click", mouseClick)
                .on("dblclick", mouseDoubleClick);

            enteredTransitions.selectAll(".cpoints")
                .on("mousedown", function (d) {
                    if (dbg) { console.log("mouseOverControlPoint"); }
                    mouseOverControlPoint = d;
                }).on("mouseup", function (d) {
                    if (dbg) { console.log("mouseLeavingControlPoint"); }
                    mouseOverControlPoint = null;
                });
        }
    };

    /**
     * Utility function for drawing initial transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.renderInitialTransitions = function () {
        _this = this;
        var svg = d3.select("#ContainerStateMachine").select("svg");

        /**
         * Utility function for drawing transitions
         * @returns a reference to the entered transitions
         */
        var drawInitialTransitions = function (enteredTransitions) {
            enteredTransitions = enteredTransitions.append("svg:g")
                .classed("itransition", true)
                .attr("id", function (edge) { return edge.id; });

            // visiblePath is the actual path visible to the user
            var visiblePath = enteredTransitions.append("svg:path").classed("ipath", true)
                .attr("id", function (edge) { return "ipath_" + edge.id; })
                .attr("fill", "none")
                .style("stroke", "black")
                .style("stroke-width", stroke_width_normal)
                .style("markerUnits", "userSpaceOnUse")
                .style("marker-start", "url(#bubble)")
                .style("marker-end", "url(#end-arrow)");

            // selection path is used to ease selection with the mouse (it's wide)
            var selectionPath = enteredTransitions.append("svg:path").classed("ipath", true)
                .attr("id", function (edge) {return "iselectionPath_" + edge.id; })
                .style("opacity", "0")
                .attr("fill", "none")
                .style("stroke", "grey")
                .style("stroke-width", stroke_width_large)
                .style("markerUnits", "userSpaceOnUse")
                .style("cursor", "pointer");

            // labels are drawn using both text and textpath
            // the former is for self-edges, the latter for all other edges
            var text = enteredTransitions.append("svg:text").classed("itlabel", true)
                .attr("id", function (d) { return "itlabel_" + d.id; })
                .style("font", (fontSize + "px sans-serif"))
                .style("text-rendering", "optimizeLegibility")
                .style("cursor", "pointer") // change cursor shape
                .text(function (edge) {
                    return edge.name + labelToString(edge);
                });

            return refreshInitialTransitions(enteredTransitions);
        };
        var mouseOver = function (edge) {
            d3.select(this.firstChild)
                //.style("stroke-width", stroke_width_highlighted)
                .style("stroke", "green")
                .style("marker-start", "url(#bubble-selected)")
                .style("marker-end", "url(#end-arrow-selected)");
            d3.select(this.children[2]).style("fill", "green");
        };
        var mouseOut = function (edge) {
            //d3.select(this.firstChild).style("stroke-width", stroke_width_normal);
            d3.select(this.firstChild)
                //.style("stroke-width", stroke_width_highlighted)
                .style("stroke", "black")
                .style("marker-start", "url(#bubble)")
                .style("marker-end", "url(#end-arrow)");
            d3.select(this.children[2]).style("fill", "black");
        };
        var mouseClick = function (edge) {
            // update mouse variables
            mousedown.edge = edge;
            if (editor_mode === MODE.RENAME()) {
                _this.fire({
                    type: "emuCharts_renameInitialTransition",
                    edge: edge
                });
            } else if (editor_mode === MODE.DELETE()) {
                _this.fire({
                    type: "emuCharts_deleteInitialTransition",
                    edge: edge
                });
            }
        };
        var mouseDoubleClick = function (edge) {
            if (editor_mode !== MODE.DELETE()) {
                _this.fire({
                    type: "emuCharts_renameInitialTransition",
                    edge: edge
                });
            }
        };


        if (!this.emucharts || !this.emucharts.getInitialEdges()) { return; }
        // create svg element, if needed
        if (svg.empty()) { svg = this.newSVG(); }
        var edges = this.emucharts.getInitialEdges().values();
        if (edges) {
            // create a group of svg elements for transitions, and bind them to data
            var initial_transitions = svg.select("#InitialTransitions").selectAll(".itransition")
                                    .data(edges, function (edge) { return edge.id; });
            var enteredTransitions = drawInitialTransitions(initial_transitions.enter());
            var exitedTransitions = removeTransitions(initial_transitions.exit());
            enteredTransitions
                .on("mouseover", mouseOver)
                .on("mouseout", mouseOut)
                .on("click", mouseClick)
                .on("dblclick", mouseDoubleClick);
        }
    };

    function newBoxWidth(nodeID) {
        return 18 + d3.select("#label_" + nodeID).node().getBoundingClientRect().width;
    }

    /**
     * Utility function to refresh rendered states.
     * @returns reference to the updated svg elements
     * @memberof EmuchartsEditor
     */
    function refreshStates(states) {
        states = states || d3.select("#ContainerStateMachine svg").select("#States").selectAll(".state");

        // refresh labels
        states.select(".state_label").text(function (node) {
            return node.name;
        });
        // refresh box size and position, if needed
        states.select(".state_box").attr("width", function (node) {
            return newBoxWidth(node.id);
        }).attr("x", function (node) {
            return -(newBoxWidth(node.id) / 2);
        });
        // refresh move tool, if needed
        states.select(".state_move").attr("x", function (node) {
            return (newBoxWidth(node.id) / 2) - 18;
        });
        return states;
    }

    /**
     * Utility function for drawing states
     * @returns reference to the updated svg elements
     * @memberof EmuchartsEditor
     */
    function drawStates(enteredStates) {
        function nodeHeight(node) {
            return node.height || defaultHeight;
        }
        function nodeWidth(node) {
            return node.width || defaultWidth;
        }


        enteredStates = enteredStates.append("svg:g").classed("state", true)
            .attr("id", function (node) { return node.id; })
            .attr("transform", function (node) {
                return "translate(" + node.x + ", " + node.y + ") scale(1.0)";
            });
        // draw states (selectAll will automatically iterate for all states)
        var state = enteredStates.append("svg:rect").classed("state_box", true)
            .attr("id", function (node) { return "box_" + node.id; })
            .attr("width", function (node) { return nodeWidth(node); })
            .attr("height", function (node) { return nodeWidth(node); })
            // translate x,y so that the box is centered there
            .attr("x", function (node) { return -(nodeWidth(node) / 2); })
            .attr("y", function (node) { return -(nodeHeight(node) / 2); })
            .attr("rx", 6).attr("ry", 6) // draw rounded corners
            .style("opacity", "0.9") // make the node slightly transparent
            .style("cursor", "pointer") // change cursor shape on mouse over
            .style("fill", function (node) { // fill the box, avoid black
                return (node.id === 0) ? d3.rgb(colors(node.id)).brighter().toString()
                            : colors(node.id);
            })
            .style("stroke", function (node) { // draw a frame around the box
                return d3.rgb(colors(node.id)).darker().toString();
            });
        // draw move tool for boxes
        var moveTool = enteredStates.append("svg:rect").classed("state_move", true)
            .attr("id", function (node) { return "resize_" + node.id; })
            .attr("width", 20).attr("height", 20)
            // place the resize tool at the lower right corner of the box
            .attr("x", function (node) { return nodeWidth(node) / 2 - 18; })
            .attr("y", function (node) { return nodeHeight(node) / 2 - 18; })
            .attr("rx", 2).attr("ry", 2) // draw rouded corners
            .style("stroke", "gray") // set border colour
            .style("stroke-width", "2") // set border size
            .style("fill", "white") // set fill colour
            .style("opacity", "0.4") // make the resize tool slightly transparent
            .style("cursor", "pointer"); // change cursor shape on mouse over
        // draw state names
        var label = enteredStates.append("svg:text").classed("state_label", true)
            .attr("id", function (node) { return "label_" + node.id; })
            .attr("text-anchor", "middle")
            .style("font", (fontSize + "px sans-serif"))
            .style("text-rendering", "optimizeLegibility")
            .text(function (node) { return node.name; });

        return enteredStates;
    }

    /**
     * Utility function for removing states from the SVG
     * @returns reference to the updated svg elements
     * @memberof EmuchartsEditor
     */
    function removeStates(exitedStates) {
        return exitedStates
                    .transition().duration(220)
                    .style("opacity", 0).remove();
    }

    /**
     * Utility function for drawing states
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.renderStates = function () {
        _this = this;
        var svg = d3.select("#ContainerStateMachine").select("svg");

        // mouse event handlers
        var dragStart = function (node) {
            if (dbg) { console.log("State.dragStart"); }
            // stopPropagation is essential here to avoid messing up with state variables of the SVG drag/zoom events
            d3.event.sourceEvent.stopPropagation();
            // update mouse variables
            mousedrag.node = node;
            if (editor_mode === MODE.ADD_TRANSITION()) {
                // create an arrow from the selected node to the cursor position
                drag_line.classed("hidden", false)
                    .style("marker-end", "url(#drag-arrow)")
                    .attr("d", function (node) {
                        var edge = { source: mousedrag.node, target: mousedrag.node };
                        // refresh control points
                        var cp = getControlPoints_selfEdge(edge);
                        // refresh path
                        return lineFunction(cp);
                    });
//                    .attr("d", "M" + mousedrag.node.x + "," + mousedrag.node.y +
//                                "L" + (mousedrag.node.x + d3.mouse(this)[0]) +
//                                "," + (mousedrag.node.y + d3.mouse(this)[1]));
            }
        };
        var dragNode = function (node) {
            // stopPropagation is essential here to avoid messing up with state variables of the SVG drag/zoom events
            d3.event.sourceEvent.stopPropagation();
            if (dbg) { console.log("State.dragNode"); }
            function computeControlPoint(edge) {
                var dx1 = edge.target.x - edge.source.x;
                var dy1 = edge.target.y - edge.source.y;
                var dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                var controlPoint = getControlPoints(edge)[1];
                var dx2 = controlPoint.x - edge.source.x;
                var dy2 = controlPoint.y - edge.source.y;
                var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                var viscosity = (edge.target.id === edge.source.id) ? 1 : 0.8;
                return (dist1 > dist2) ?
                        { x: controlPoint.x + d3.event.dx * dist2 / dist1 * viscosity,
                            y: controlPoint.y + d3.event.dy * dist2 / dist1 * viscosity}
                        : { x: controlPoint.x + d3.event.dx * viscosity,
                              y: controlPoint.y + d3.event.dy * viscosity };
            }

            if (editor_mode !== MODE.ADD_TRANSITION() && editor_mode !== MODE.DELETE() &&
                    editor_mode !== MODE.RENAME()) {
                // update node position
                node.x = node.x + d3.event.dx;
                node.y = node.y + d3.event.dy;
                d3.select(this).attr("stroke-width", 2);
                d3.select(this).attr("transform",
                                     "translate(" + node.x + "," + node.y + ") scale(1.0) ");
//                                     "translate(" + node.x + "," + node.y + ") scale(1.1) ");
                // update all edges connected to this node
                var updatedTransitions = d3.select("#ContainerStateMachine")
                        .select("#Transitions").selectAll(".transition")
                        .filter(function (edge) {
                            if (edge.source.id === node.id) {
                                edge.source.x = node.x;
                                edge.source.y = node.y;
                                edge.controlPoint = computeControlPoint(edge);
                                return true;
                            }
                            if (edge.target.id === node.id) {
                                edge.target.x = node.x;
                                edge.target.y = node.y;
                                edge.controlPoint = computeControlPoint(edge);
                                return true;
                            }
                            return false;
                        });
                refreshTransitions(updatedTransitions);
                var updatedInitialTransitions = d3.select("#ContainerStateMachine")
                        .select("#InitialTransitions").selectAll(".itransition")
                        .filter(function (edge) {
                            var updated = false;
                            if (edge.target.id === node.id) {
                                edge.target.x = node.x;
                                edge.target.y = node.y;
                                updated = true;
                            }
                            return updated;
                        });
                refreshInitialTransitions(updatedInitialTransitions);

            } else if (editor_mode === MODE.ADD_TRANSITION() && mousedrag.node) {
                if (mousedrag.node && mouseover.node && mousedrag.node.id === mouseover.node.id) {
                    drag_line.attr("d", function (node) {
                        var edge = { source: mousedrag.node, target: mousedrag.node };
                        // refresh control points
                        var cp = getControlPoints_selfEdge(edge);
                        // refresh path
                        return lineFunction(cp);
                    });
                } else {
                    drag_line.attr("d", "M" + mousedrag.node.x + "," + mousedrag.node.y +
                                    "L" + (mousedrag.node.x + d3.mouse(this)[0]) +
                                    "," + (mousedrag.node.y + d3.mouse(this)[1]));
                }
            }
        };
        var dragEnd = function (node) {
            if (dbg) { console.log("State.dragEnd"); }
            // stopPropagation is essential here to avoid messing up with state variables of the SVG drag/zoom events
            d3.event.sourceEvent.stopPropagation();
            if (editor_mode === MODE.ADD_TRANSITION()) {
                if (mousedrag.node && mouseover.node) {
                    _this.fire({
                        type: "emuCharts_addTransition",
                        source: mousedrag.node,
                        target: mouseover.node
                    });
                }
                // hide drag arrow & reset mouse vars
                drag_line.classed("hidden", true)
                         .style("marker-end", "")
                         .style("marker-start", "")
                         .attr("d", "M0,0L0,0");
            } else {
                if (mousedrag.node.x === node.x && mousedrag.node.y === node.y) {
                    // click event
                    //console.log("click");
                    if (!_this.dragged) {
                        if (editor_mode === MODE.DELETE() && mouseover.node) {
                            mouseover.node = null;
                            _this.fire({
                                type: "emuCharts_deleteState",
                                node: node
                            });
                        } else if (editor_mode === MODE.RENAME() && mouseover.node) {
                            _this.fire({
                                type: "emuCharts_renameState",
                                node: node
                            });
                        }
                    } else { _this.dragged = false; }
                }
            }
            // update mouse variables
            mousedrag.node = null;
        };
        var mouseOver = function (node) {
            if (mouseOverControlPoint === null) {
                d3.event.stopPropagation();
                // update mouse variables
                mouseover.node = node;
                // highlight node
                d3.select(this).attr("stroke-width", 2);
//                this.setAttribute("transform", this.getAttribute("transform").replace("scale(1.0)", "scale(1.1)"));
                if (editor_mode === MODE.ADD_TRANSITION() && mousedrag.node) {
                    if (mousedrag.node.id !== node.id) {
                        // change colour of drag arrow to give a cue that a mouse release will trigger the creation of a new transition between nodes
                        drag_line.style("stroke", colors(node.id));
                        d3.select("#drag-arrow path").style("fill", colors(node.id));
                    } else {
                        drag_line.style("stroke", "black");
                        d3.select("#drag-arrow path").style("fill", "black");
                    }
                }
            }
        };
        var mouseOut = function (node) {
            if (mouseOverControlPoint === null) {
                d3.event.stopPropagation();
                // update mouse variables
                mouseover.node = null;
                // restore node size
                d3.select(this).attr("stroke-width", 1);
//                this.setAttribute("transform", this.getAttribute("transform").replace("scale(1.1)", "scale(1.0)"));
                if (editor_mode === MODE.ADD_TRANSITION()) {
                    // change colour of drag arrow to the default (black)
                    drag_line.style("stroke", "black");
                    d3.select("#drag-arrow path").style("fill", "black");
                }
            }
        };
        var mouseDoubleClick = function (node) {
            if (editor_mode !== MODE.DELETE()) {
                d3.event.stopPropagation();
                _this.fire({
                    type: "emuCharts_renameState",
                    node: node
                });
            }
        };
        var mouseMove = function (node) {
            if (mouseOverControlPoint) {
                d3.event.stopPropagation();
                //console.log("mouseover control point");
                var m = d3.mouse(d3.select("#ContainerStateMachine svg").select("#States").node());
                // update selected control point
                var cp = { x: m[0], y: m[1] };
                //console.log("(" + m[0] + "," + m[1] + ")");
                _this.emucharts.set_controlPoint(mouseOverControlPoint, cp);
                var transitionID = mouseOverControlPoint.id;
                var transitions = d3.select("#ContainerStateMachine")
                                    .select("#Transitions").selectAll(".transition")
                                    .filter(function (transition) { return transition.id === transitionID; });
                // refresh transitions
                return refreshTransitions(transitions);
            }
        };

        if (!this.emucharts || !this.emucharts.getNodes()) { return; }
        var nodes = this.emucharts.getNodes().values();
        if (nodes) {
            if (svg.empty()) { svg = this.newSVG(); }
            // create a group of svg elements for states, and bind them to data
            var states = svg.select("#States").selectAll(".state")
                            .data(nodes, function (node) { return node.id; });
            var enteredStates = drawStates(states.enter());
            var exitedStates  = removeStates(states.exit());
            var drag = d3.behavior.drag().origin(function (node) {
                return node;
            });
            drag.on("dragstart", dragStart)
                .on("drag", dragNode)
                .on("dragend", dragEnd);
            enteredStates.call(drag)
                .on("mouseover", mouseOver)
                .on("mouseout", mouseOut)
                .on("mousemove", mouseMove)
                .on("dblclick", mouseDoubleClick);
        }
    };


    /**
     * Interface function for rendering the emuchart
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.render = function () {
        this.renderStates();
        this.renderTransitions();
        this.renderInitialTransitions();
        this.refresh();
        return this;
    };

    EmuchartsEditor.prototype.refresh = function () {
        refreshStates();
        refreshTransitions();
        refreshInitialTransitions();
        return this;
    };

    /**
     * Returns a fresh state name
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getFreshStateName = function () {
        return this.emucharts.getFreshStateName();
    };

    /**
     * Returns a fresh transition name
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getFreshTransitionName = function () {
        return this.emucharts.getFreshTransitionName();
    };

    /**
     * Returns a fresh name for initial transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getFreshInitialTransitionName = function () {
        return this.emucharts.getFreshInitialTransitionName();
    };

    /**
     * Returns an array containing the current set of states in the diagram
     * Each states is given as a pair { name, id }
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getStates = function () {
        return this.emucharts.getStates();
    };

    /**
     * Returns an array containing the current set of constants defined in the diagram
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getConstants = function () {
        return this.emucharts.getConstants();
    };

    /**
     * Returns an array containing the current set of variables defined in the diagram
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getVariables = function () {
        return this.emucharts.getVariables();
    };

    /**
     * Returns an array containing the current set of input variables defined in the diagram
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getInputVariables = function () {
        return this.emucharts.getInputVariables();
    };

    /**
     * Returns an array containing the current set of output variables defined in the diagram
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getOutputVariables = function () {
        return this.emucharts.getOutputVariables();
    };

    /**
     * Returns an array containing the current set of local variables defined in the diagram
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getLocalVariables = function () {
        return this.emucharts.getLocalVariables();
    };

    /**
     * Returns an array specifying the supported variable scopes
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getVariableScopes = function () {
        return this.emucharts.getVariableScopes();
    };

    /**
     * Returns an array containing the current set of transitions in the diagram
     * Each transition is given as a 4-tuple { name, id, source, target }
     * where source and target are pairs { name, id }
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getTransitions = function () {
        return this.emucharts.getTransitions();
    };

    /**
     * Returns an array containing the current set of initial transitions in the diagram
     * Each transition is given as a 3-tuple { name, id, target }
     * where target is a pair { name, id }
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.getInitialTransitions = function () {
        return this.emucharts.getInitialTransitions();
    };

    /**
     * utility function to rename transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.rename_transition = function (transitionID, newLabel) {
        this.emucharts.rename_edge(transitionID, newLabel);
        var transitions = d3.select("#ContainerStateMachine")
                        .select("#Transitions").selectAll(".transition")
                        .filter(function (transition) { return transition.id === transitionID; });
        // refresh transitions
        refreshTransitions(transitions);
    };

    /**
     * utility function to rename initial transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.rename_initial_transition = function (transitionID, newLabel) {
        this.emucharts.rename_initial_edge(transitionID, newLabel);
        var itransitions = d3.select("#ContainerStateMachine")
                        .select("#InitialTransitions").selectAll(".itransition")
                        .filter(function (itransition) { return itransition.id === transitionID; });
        // refresh transitions
        refreshInitialTransitions(itransitions);
    };


    /**
     * utility function to rename states
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.rename_state = function (stateID, newLabel) {
        this.emucharts.rename_node(stateID, newLabel);
        // refresh states
        var states = d3.select("#ContainerStateMachine")
            .select("#States").selectAll(".state")
            .filter(function (state) { return state.id === stateID; });
        refreshStates(states);
        // refresh all incoming and outgoing transitions of the renamed state
        var transitions = d3.select("#ContainerStateMachine")
            .select("#Transitions").selectAll(".transition")
            .filter(function (transition) {
                return (transition.target && transition.target.id === stateID) ||
                        (transition.source && transition.source.id === stateID);
            });
        refreshTransitions(transitions);
    };

    /**
     * Interface function for adding states
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.add_state = function (stateName, position) {
        var newNode = { name: stateName };
        if (position) {
            newNode.x = position.x;
            newNode.y = position.y;
        }
        this.emucharts.add_node(newNode);
        return this.renderStates();
    };

    /**
     * Interface function for deleting states and all transitions incoming/outgoing to this state
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.delete_state = function (stateID) {
        _this = this;
        var edges = [];
        if (this.emucharts && this.emucharts.edges) {
            this.emucharts.edges.forEach(function (key) {
                var edge = _this.emucharts.edges.get(key);
                if ((edge.source && edge.source.id === stateID) ||
                        (edge.target && edge.target.id === stateID)) {
                    edges.push(edge.id);
                }
            });
            edges.forEach(function (edge) {
                _this.emucharts.remove_edge(edge);
            });
        }
        var initial_edges = [];
        if (this.emucharts && this.emucharts.initial_edges) {
            this.emucharts.initial_edges.forEach(function (key) {
                var initial_edge = _this.emucharts.initial_edges.get(key);
                if (initial_edge.target && initial_edge.target.id === stateID) {
                    initial_edges.push(initial_edge.id);
                }
            });
            initial_edges.forEach(function (initial_edge) {
                _this.emucharts.remove_initial_edge(initial_edge);
            });
        }

        if (this.emucharts && this.emucharts.nodes) {
            this.emucharts.remove_node(stateID);
        }

        // refresh editor
        this.renderTransitions();
        this.renderInitialTransitions();
        return this.renderStates();
    };

    /**
     * Interface function for deleting transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.delete_transition = function (transitionID) {
        this.emucharts.remove_edge(transitionID);
        return this.renderTransitions();
    };

    /**
     * Interface function for deleting initial transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.delete_initial_transition = function (transitionID) {
        this.emucharts.remove_initial_edge(transitionID);
        return this.renderInitialTransitions();
    };

    /**
     * Interface function for deleting a constant
     * @param constantID is the unique constant identifier
     * @returns true if constant removed successfully; otherwise returns false
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.delete_constant = function (constantID) {
        return this.emucharts.remove_constant(constantID);
    };

    /**
     * Interface function for deleting a variable
     * @param variableID is the unique variable identifier
     * @returns true if variable removed successfully; otherwise returns false
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.delete_variable = function (variableID) {
        return this.emucharts.remove_variable(variableID);
    };

    /**
     * Interface function for adding transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.add_transition = function (transitionName, from, to) {
        var source = this.emucharts.getState(from);
        var target = this.emucharts.getState(to);
        if (source && target) {
            var edge = {
                    name: transitionName,
                    source: source,
                    target: target,
                    controlPoint: null
                };
            var controlPoints = (source.id === target.id) ? getControlPoints_selfEdge(edge) : getControlPoints(edge);
            edge.controlPont = (source.id === target.id) ? controlPoints[2] : controlPoints[1];
            // FIXME: need to adjust the position in the case svg is translated
            this.emucharts.add_edge(edge);
            return this.renderTransitions();
        } else {
            // FIXME: improve interaction & feedback
            alert("invalid nodes");
        }
    };

    /**
     * Interface function for adding initial transitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.add_initial_transition = function (transitionName, to) {
        var target = this.emucharts.getState(to);
        if (target) {
            // FIXME: need to force one initial transition per state
            this.emucharts.add_initial_edge({
                name: transitionName,
                target: target
            });
            return this.renderInitialTransitions();
        } else {
            // FIXME: improve interaction & feedback
            alert("invalid nodes");
        }
    };

    /**
     * Interface function for adding new constant definitions
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.add_constant = function (newConstant) {
        return this.emucharts.add_constant(newConstant);
    };

    /**
     * Interface function for adding new state variables
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.add_variable = function (newVariable) {
        return this.emucharts.add_variable(newVariable);
    };

    /**
     * Interface function for editing constants
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.rename_constant = function (constantID, newData) {
        return this.emucharts.rename_constant(constantID, newData);
    };

    /**
     * Interface function for editing state variables
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.rename_variable = function (variableID, newData) {
        return this.emucharts.rename_variable(variableID, newData);
    };

    /**
     * Interface function for deleting charts
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.delete_chart = function () {
        _this = this;
        if (this.emucharts.constants) {
            this.emucharts.constants.forEach(function (key) {
                _this.emucharts.constants.remove(key);
            });
        }
        if (this.emucharts.variables) {
            this.emucharts.variables.forEach(function (key) {
                _this.emucharts.variables.remove(key);
            });
        }
        var transitions = this.emucharts.getTransitions();
        if (transitions) {
            transitions.forEach(function (transition) {
                _this.delete_transition(transition.id);
            });
        }
        var states = this.emucharts.getStates();
        if (states) {
            states.forEach(function (state) {
                _this.delete_state(state.id);
            });
        }
        return this;
    };

    /**
     * Interface function for checking whether the current chart is empty
     * @memberof EmuchartsEditor
     */
    EmuchartsEditor.prototype.empty_chart = function () {
        return this.emucharts && this.emucharts.nodes && this.emucharts.nodes.empty() &&
                this.emucharts.edges && this.emucharts.edges.empty() &&
                this.emucharts.constants && this.emucharts.constants.empty() &&
                this.emucharts.variables && this.emucharts.variables.empty();
    };

    module.exports = EmuchartsEditor;
});
