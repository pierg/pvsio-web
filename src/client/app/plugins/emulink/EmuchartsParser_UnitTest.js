/** @module EmuchartsParser_UnitTest */
/**
 * EmuchartsParser_UnitTest is a test module for EmuchartsParser
 * @author Paolo Masci
 * @date 06/10/14 2:24:01 PM
 *
 *
 * Specification of the EmuchartsParser module: the object representing the parsed text 
 *      shall have the following characteristics:
 *  - Each object has a type and a value.
 *  - Identifier objects have type 'identifier' and the value is the string representation of the identifier.
 *  - Number objects have type 'number' and the value is the string representation of the number.
 *  - Arithmetic expression objects have type 'expression' and the value is an array of objects.
 *        Objects in the array range over the following types: number, identifier, parentheses, operators.
 *        Arithmetic operators have type 'binop' or 'unaryop', and the value is the string representation of the operator.
 *        Round parentheses have type 'par', and the value is the string representation of the parenthesis.
 *  - Assignment objects have type 'assignment' and the value is a record { identifier, binop, expression }.
 *  - Transition objects have type 'transition' and the value is a record { identifier, cond, actions }.
 *  - Transition condition objects are arithmetic expression.
 *  - Transition actions objects have type 'actions' and the value is an array of objects of type 'assignment'.
 *
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, _, Promise, document, FileReader*/
define(function (require, exports, module) {
    "use strict";
    
    var EmuchartsParser = require("plugins/emulink/EmuchartsParser");
    var parser;
    
    /**
	 * Constructor
	 */
    function EmuchartsParser_UnitTest() {
        parser = new EmuchartsParser();
        return this;
    }
    
    EmuchartsParser_UnitTest.prototype.unitTest = function () {
        var parser = new EmuchartsParser();
        var success = 0, fail = 0, tot = 0;
        var txt, ans;
        var failed = false;
        var summary = "\n------ Unit test for EmuchartsParser -------------------";

        // test 1
        txt = "inc [ display > display + 100 ] { display := display + s }";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += ("\n  Parsing transition name... ");
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "inc") {
            summary += "[ok]";
        } else {
            summary += "[FAIL]";
            failed = true;
        }
        summary += "\n  Parsing transition condition... ";
        if (ans.res && ans.res.val.cond.type === "expression" &&
                ans.res.val.cond.val.length === 5 &&
                ans.res.val.cond.val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val === "display" &&
                ans.res.val.cond.val[1].type === "binop" &&
                ans.res.val.cond.val[1].val === ">" &&
                ans.res.val.cond.val[2].type === "identifier" &&
                ans.res.val.cond.val[2].val === "display" &&
                ans.res.val.cond.val[3].type === "binop" &&
                ans.res.val.cond.val[3].val === "+" &&
                ans.res.val.cond.val[4].type === "number" &&
                ans.res.val.cond.val[4].val === "100") {
            summary += "[ok]";
        } else {
            summary += "[FAIL]";
            failed = true;
        }
        summary += "\n  Parsing transition actions... ";
        if (ans.res && ans.res.val.actions.type === "actions" &&
                ans.res.val.actions.val.length === 1 &&
                ans.res.val.actions.val[0].type === "assignment" &&
                ans.res.val.actions.val[0].val.identifier.type === "identifier" &&
                ans.res.val.actions.val[0].val.identifier.val === "display" &&
                ans.res.val.actions.val[0].val.binop.type === "binop" &&
                ans.res.val.actions.val[0].val.binop.val === ":=" &&
                ans.res.val.actions.val[0].val.expression.type === "expression" &&
                ans.res.val.actions.val[0].val.expression.val.length === 3 &&
                ans.res.val.actions.val[0].val.expression.val[0].type === "identifier" &&
                ans.res.val.actions.val[0].val.expression.val[0].val === "display" &&
                ans.res.val.actions.val[0].val.expression.val[1].type === "binop" &&
                ans.res.val.actions.val[0].val.expression.val[1].val === "+" &&
                ans.res.val.actions.val[0].val.expression.val[2].type === "identifier" &&
                ans.res.val.actions.val[0].val.expression.val[2].val === "s") {
            summary += "[ok]";
            success++;
        } else {
            summary += "[FAIL]";
            failed = true;
        }
        if (failed) {
            console.log(ans.err);
            fail++;
            failed = false;
        }
        console.log(JSON.stringify(ans.res, null, 2));
        
        
        // test 2
        txt = "[ display <= (display + 100) ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "tick" &&
                ans.res.val.actions === null &&
                ans.res.val.cond && ans.res.val.cond.val &&
                ans.res.val.cond.val.length === 7 &&
                ans.res.val.cond.val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val === "display" &&
                ans.res.val.cond.val[1].type === "binop" &&
                ans.res.val.cond.val[1].val === "<=" &&
                ans.res.val.cond.val[2].type === "par" &&
                ans.res.val.cond.val[2].val === "(" &&
                ans.res.val.cond.val[3].type === "identifier" &&
                ans.res.val.cond.val[3].val === "display" &&
                ans.res.val.cond.val[4].type === "binop" &&
                ans.res.val.cond.val[4].val === "+" &&
                ans.res.val.cond.val[5].type === "number" &&
                ans.res.val.cond.val[5].val === "100" &&
                ans.res.val.cond.val[6].type === "par" &&
                ans.res.val.cond.val[6].val === ")") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        
        // test 3
        txt = "{ display := display + 100; step := step * 10; }";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val &&
                ans.res.val.actions &&
                ans.res.val.actions.type === "actions" &&
                ans.res.val.actions.val &&
                ans.res.val.actions.val.length === 2 &&
                ans.res.val.actions.val[0].type === "assignment" &&
                ans.res.val.actions.val[0].val.identifier.type === "identifier" &&
                ans.res.val.actions.val[0].val.identifier.val === "display" &&
                ans.res.val.actions.val[0].val.binop.type === "binop" &&
                ans.res.val.actions.val[0].val.binop.val === ":=" &&
                ans.res.val.actions.val[0].val.expression.type === "expression" &&
                ans.res.val.actions.val[0].val.expression.val.length === 3 &&
                ans.res.val.actions.val[0].val.expression.val[0].type === "identifier" &&
                ans.res.val.actions.val[0].val.expression.val[0].val === "display" &&
                ans.res.val.actions.val[0].val.expression.val[1].type === "binop" &&
                ans.res.val.actions.val[0].val.expression.val[1].val === "+" &&
                ans.res.val.actions.val[0].val.expression.val[2].type === "number" &&
                ans.res.val.actions.val[0].val.expression.val[2].val === "100" &&
                ans.res.val.actions.val[1].type === "assignment" &&
                ans.res.val.actions.val[1].val.identifier.type === "identifier" &&
                ans.res.val.actions.val[1].val.identifier.val === "step" &&
                ans.res.val.actions.val[1].val.binop.type === "binop" &&
                ans.res.val.actions.val[1].val.binop.val === ":=" &&
                ans.res.val.actions.val[1].val.expression.type === "expression" &&
                ans.res.val.actions.val[1].val.expression.val.length === 3 &&
                ans.res.val.actions.val[1].val.expression.val[0].type === "identifier" &&
                ans.res.val.actions.val[1].val.expression.val[0].val === "step" &&
                ans.res.val.actions.val[1].val.expression.val[1].type === "binop" &&
                ans.res.val.actions.val[1].val.expression.val[1].val === "*" &&
                ans.res.val.actions.val[1].val.expression.val[2].type === "number" &&
                ans.res.val.actions.val[1].val.expression.val[2].val === "10") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            console.log("[FAIL]");
            fail++;
        }
        
        // test 4
        txt = "[ display implies (display && -100 => 2.3) ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.cond.val.length === 10 &&
                ans.res.val.cond.val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val === "display" &&
                ans.res.val.cond.val[1].type === "binop" &&
                ans.res.val.cond.val[1].val === "IMPLIES" &&
                ans.res.val.cond.val[2].type === "par" &&
                ans.res.val.cond.val[2].val === "(" &&
                ans.res.val.cond.val[3].type === "identifier" &&
                ans.res.val.cond.val[3].val === "display" &&
                ans.res.val.cond.val[4].type === "binop" &&
                ans.res.val.cond.val[4].val === "&&" &&
                ans.res.val.cond.val[5].type === "unaryop" &&
                ans.res.val.cond.val[5].val === "-" &&
                ans.res.val.cond.val[6].type === "number" &&
                ans.res.val.cond.val[6].val === "100" &&
                ans.res.val.cond.val[7].type === "binop" &&
                ans.res.val.cond.val[7].val === "=>" &&
                ans.res.val.cond.val[8].type === "number" &&
                ans.res.val.cond.val[8].val === "2.3" &&
                ans.res.val.cond.val[9].type === "par" &&
                ans.res.val.cond.val[9].val === ")") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 5
        txt = "[ display != (display && -100 => 2.3) ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.cond.val.length === 10 &&
                ans.res.val.cond.val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val === "display" &&
                ans.res.val.cond.val[1].type === "binop" &&
                ans.res.val.cond.val[1].val === "!=" &&
                ans.res.val.cond.val[2].type === "par" &&
                ans.res.val.cond.val[2].val === "(" &&
                ans.res.val.cond.val[3].type === "identifier" &&
                ans.res.val.cond.val[3].val === "display" &&
                ans.res.val.cond.val[4].type === "binop" &&
                ans.res.val.cond.val[4].val === "&&" &&
                ans.res.val.cond.val[5].type === "unaryop" &&
                ans.res.val.cond.val[5].val === "-" &&
                ans.res.val.cond.val[6].type === "number" &&
                ans.res.val.cond.val[6].val === "100" &&
                ans.res.val.cond.val[7].type === "binop" &&
                ans.res.val.cond.val[7].val === "=>" &&
                ans.res.val.cond.val[8].type === "number" &&
                ans.res.val.cond.val[8].val === "2.3" &&
                ans.res.val.cond.val[9].type === "par" &&
                ans.res.val.cond.val[9].val === ")") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 6
        txt = "[ not display == !display ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.cond.val.length === 5 &&
                ans.res.val.cond.val[0].type === "unaryop" &&
                ans.res.val.cond.val[0].val === "NOT" &&
                ans.res.val.cond.val[1].type === "identifier" &&
                ans.res.val.cond.val[1].val === "display" &&
                ans.res.val.cond.val[2].type === "binop" &&
                ans.res.val.cond.val[2].val === "==" &&
                ans.res.val.cond.val[3].type === "unaryop" &&
                ans.res.val.cond.val[3].val === "!" &&
                ans.res.val.cond.val[4].type === "identifier" &&
                ans.res.val.cond.val[4].val === "display") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }
        
        // test 7
        txt = "[ f(x) == !display ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.cond.val.length === 4 &&
                ans.res.val.cond.val[0].type === "function" &&
                ans.res.val.cond.val[0].val.length === 4 &&
                ans.res.val.cond.val[0].val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val[0].val === "f" &&
                ans.res.val.cond.val[0].val[1].type === "par" &&
                ans.res.val.cond.val[0].val[1].val === "(" &&
                ans.res.val.cond.val[0].val[2].type === "identifier" &&
                ans.res.val.cond.val[0].val[2].val === "x" &&
                ans.res.val.cond.val[0].val[3].type === "par" &&
                ans.res.val.cond.val[0].val[3].val === ")") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 8
        txt = "[ f(x,y) == !display ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.cond.val.length === 4 &&
                ans.res.val.cond.val[0].type === "function" &&
                ans.res.val.cond.val[0].val.length === 6 &&
                ans.res.val.cond.val[0].val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val[0].val === "f" &&
                ans.res.val.cond.val[0].val[1].type === "par" &&
                ans.res.val.cond.val[0].val[1].val === "(" &&
                ans.res.val.cond.val[0].val[2].type === "identifier" &&
                ans.res.val.cond.val[0].val[2].val === "x" &&
                ans.res.val.cond.val[0].val[3].type === "separator" &&
                ans.res.val.cond.val[0].val[3].val === "," &&
                ans.res.val.cond.val[0].val[4].type === "identifier" &&
                ans.res.val.cond.val[0].val[4].val === "y" &&
                ans.res.val.cond.val[0].val[5].type === "par" &&
                ans.res.val.cond.val[0].val[5].val === ")") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        
        // test 9
        txt = "[ f(x+y) == !display ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.cond.val.length === 4 &&
                ans.res.val.cond.val[0].type === "function" &&
                ans.res.val.cond.val[0].val.length === 6 &&
                ans.res.val.cond.val[0].val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val[0].val === "f" &&
                ans.res.val.cond.val[0].val[1].type === "par" &&
                ans.res.val.cond.val[0].val[1].val === "(" &&
                ans.res.val.cond.val[0].val[2].type === "identifier" &&
                ans.res.val.cond.val[0].val[2].val === "x" &&
                ans.res.val.cond.val[0].val[3].type === "binop" &&
                ans.res.val.cond.val[0].val[3].val === "+" &&
                ans.res.val.cond.val[0].val[4].type === "identifier" &&
                ans.res.val.cond.val[0].val[4].val === "y" &&
                ans.res.val.cond.val[0].val[5].type === "par" &&
                ans.res.val.cond.val[0].val[5].val === ")") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 10
        txt = "{ display := 0 }";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.actions.val.length === 1 &&
                ans.res.val.actions.val[0].type === "assignment" &&
                ans.res.val.actions.val[0].val.identifier.type === "identifier" &&
                ans.res.val.actions.val[0].val.identifier.val === "display" &&
                ans.res.val.actions.val[0].val.binop.type === "binop" &&
                ans.res.val.actions.val[0].val.binop.val === ":=" &&
                ans.res.val.actions.val[0].val.expression.type === "expression" &&
                ans.res.val.actions.val[0].val.expression.val.length === 1 &&
                ans.res.val.actions.val[0].val.expression.val[0].type === "number" &&
                ans.res.val.actions.val[0].val.expression.val[0].val === "0") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 11
        txt = "{ display := 0; step := 10 }";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.actions.val.length === 2 &&
                ans.res.val.actions.val[0].type === "assignment" &&
                ans.res.val.actions.val[0].val.identifier.type === "identifier" &&
                ans.res.val.actions.val[0].val.identifier.val === "display" &&
                ans.res.val.actions.val[0].val.binop.type === "binop" &&
                ans.res.val.actions.val[0].val.binop.val === ":=" &&
                ans.res.val.actions.val[0].val.expression.type === "expression" &&
                ans.res.val.actions.val[0].val.expression.val.length === 1 &&
                ans.res.val.actions.val[0].val.expression.val[0].type === "number" &&
                ans.res.val.actions.val[0].val.expression.val[0].val === "0" &&
                ans.res.val.actions.val[1].val.identifier.type === "identifier" &&
                ans.res.val.actions.val[1].val.identifier.val === "step" &&
                ans.res.val.actions.val[1].val.binop.type === "binop" &&
                ans.res.val.actions.val[1].val.binop.val === ":=" &&
                ans.res.val.actions.val[1].val.expression.type === "expression" &&
                ans.res.val.actions.val[1].val.expression.val.length === 1 &&
                ans.res.val.actions.val[1].val.expression.val[0].type === "number" &&
                ans.res.val.actions.val[1].val.expression.val[0].val === "10") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }
        
        // test 12
        txt = "click_off { isOn := false }";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "click_off" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.actions &&
                ans.res.val.actions.type === "actions" &&
                ans.res.val.actions.val &&
                ans.res.val.actions.val.length === 1 &&
                ans.res.val.actions.val[0].type === "assignment" &&
                ans.res.val.actions.val[0].val.identifier.type === "identifier" &&
                ans.res.val.actions.val[0].val.identifier.val === "isOn" &&
                ans.res.val.actions.val[0].val.binop.type === "binop" &&
                ans.res.val.actions.val[0].val.binop.val === ":=" &&
                ans.res.val.actions.val[0].val.expression.type === "expression" &&
                ans.res.val.actions.val[0].val.expression.val.length === 1 &&
                ans.res.val.actions.val[0].val.expression.val[0].type === "constant" &&
                ans.res.val.actions.val[0].val.expression.val[0].val === "false") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 13
        txt = "click_off";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "click_off") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 14
        txt = "{ display := display + 1; }";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "tick") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 15
        txt = "click_off :=";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Test with illegal transition... ";
        if (!ans.res && ans.err) {
            summary += "[ok]\nError message is:";
            summary += "\n" + ans.err;
            success++;
        } else {
            console.log("Error: parser does not report error for illegal transition expression");
            summary += "[FAIL]";
            fail++;
        }
        
        // test 16
        txt = "login [ S_state.correct == true ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "login" &&
                ans.res.val.cond.type === "expression" &&
                ans.res.val.cond.val &&
                ans.res.val.cond.val.length === 3 &&
                ans.res.val.cond.val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val === "S_state.correct" &&
                ans.res.val.cond.val[1].type === "binop" &&
                ans.res.val.cond.val[1].val === "==" &&
                ans.res.val.cond.val[2].type === "constant" &&
                ans.res.val.cond.val[2].val === "true") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }
        
        // test 17
        txt = "login [ S_state.d1.correct == true ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "login" &&
                ans.res.val.cond.type === "expression" &&
                ans.res.val.cond.val &&
                ans.res.val.cond.val.length === 3 &&
                ans.res.val.cond.val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val === "S_state.d1.correct" &&
                ans.res.val.cond.val[1].type === "binop" &&
                ans.res.val.cond.val[1].val === "==" &&
                ans.res.val.cond.val[2].type === "constant" &&
                ans.res.val.cond.val[2].val === "true") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 18
        txt = "login [ correct(S_state) == true ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "login" &&
                ans.res.val.cond.type === "expression" &&
                ans.res.val.cond.val &&
                ans.res.val.cond.val.length === 3 &&
                ans.res.val.cond.val[0].type === "function" &&
                ans.res.val.cond.val[0].val.length === 4 &&
                ans.res.val.cond.val[0].val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val[0].val === "correct" &&
                ans.res.val.cond.val[0].val[1].type === "par" &&
                ans.res.val.cond.val[0].val[1].val === "(" &&
                ans.res.val.cond.val[0].val[2].type === "identifier" &&
                ans.res.val.cond.val[0].val[2].val === "S_state" &&
                ans.res.val.cond.val[0].val[3].type === "par" &&
                ans.res.val.cond.val[0].val[3].val === ")") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 19
        txt = "login [ correct(d1((S_state))) == true ]";
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "login" &&
                ans.res.val.cond.type === "expression" &&
                ans.res.val.cond.val &&
                ans.res.val.cond.val.length === 3 &&
                ans.res.val.cond.val[0].type === "function" &&
                ans.res.val.cond.val[0].val.length === 4 &&
                ans.res.val.cond.val[0].val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val[0].val === "correct" &&
                ans.res.val.cond.val[0].val[1].type === "par" &&
                ans.res.val.cond.val[0].val[1].val === "(" &&
                ans.res.val.cond.val[0].val[2].type === "function" &&
                ans.res.val.cond.val[0].val[2].val.length === 6 &&
                ans.res.val.cond.val[0].val[2].val[0].type === "identifier" &&
                ans.res.val.cond.val[0].val[2].val[0].val === "d1" &&
                ans.res.val.cond.val[0].val[2].val[1].type === "par" &&
                ans.res.val.cond.val[0].val[2].val[1].val === "(" &&
                ans.res.val.cond.val[0].val[2].val[2].type === "par" &&
                ans.res.val.cond.val[0].val[2].val[2].val === "(" &&
                ans.res.val.cond.val[0].val[2].val[3].type === "identifier" &&
                ans.res.val.cond.val[0].val[2].val[3].val === "S_state" &&
                ans.res.val.cond.val[0].val[2].val[4].type === "par" &&
                ans.res.val.cond.val[0].val[2].val[4].val === ")" &&
                ans.res.val.cond.val[0].val[2].val[5].type === "par" &&
                ans.res.val.cond.val[0].val[2].val[5].val === ")" &&
                ans.res.val.cond.val[0].val[3].type === "par" &&
                ans.res.val.cond.val[0].val[3].val === ")") {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }
        
        // test 20
        txt = [ { name: "pump.device.screen.val" } ];
        summary += "\n\nTest " + (++tot) + ": '" +
                    JSON.stringify(txt).replace(new RegExp("\"", "g"), "") + "'";
        ans = parser.parseVariables(txt);
        console.log(ans);
        summary += "\n  Parsing variable names... ";
        if (ans.res) {
            if (ans.res.pump && ans.res.pump.type === "selector" &&
                    ans.res.pump.children.device && ans.res.pump.children.device.type === "selector" &&
                    ans.res.pump.children.device.children.screen &&
                    ans.res.pump.children.device.children.screen.type === "selector" &&
                    ans.res.pump.children.device.children.screen.children.val &&
                    ans.res.pump.children.device.children.screen.children.val.type === "variable" &&
                    ans.res.pump.children.device.children.screen.children.val.val.name ===  "val") {
                summary += "[ok]";
                success++;
            } else {
                console.log(ans.err);
                summary += "[FAIL]";
                fail++;
            }
            console.log(JSON.stringify(ans.res, null, 2).replace(new RegExp("\"", "g"), ""));
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 21
        txt = [ { name: 'pump.device1', type: 'A', value: 'initA' },
                { name: 'pump.device2', type: 'B', value: 'initB'} ];
        summary += "\n\nTest " + (++tot) + ": '" +
                    JSON.stringify(txt).replace(new RegExp("\"", "g"), "") + "'";
        ans = parser.parseVariables(txt);
        console.log(ans);
        summary += "\n  Parsing variable names... ";
        if (ans.res) {
            if (ans.res.pump && ans.res.pump.type === "selector" &&
                    ans.res.pump.children.device1 && ans.res.pump.children.device1.type === "variable" &&
                    ans.res.pump.children.device1.val.name === "device1" &&
                    ans.res.pump.children.device2 && ans.res.pump.children.device2.type === "variable" &&
                    ans.res.pump.children.device2.val.name === "device2") {
                summary += "[ok]";
                success++;
            } else {
                console.log(ans.err);
                summary += "[FAIL]";
                fail++;
            }
            console.log(JSON.stringify(ans.res, null, 2).replace(new RegExp("\"", "g"), ""));
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }
                
        // test 21
        txt = [ { name: 'children.val', type: 'A', value: 'initA' },
                { name: 'children.type', type: 'B', value: 'initB'} ];
        summary += "\n\nTest " + (++tot) + ": '" +
                    JSON.stringify(txt).replace(new RegExp("\"", "g"), "") + "'";
        ans = parser.parseVariables(txt);
        console.log(ans);
        summary += "\n  Parsing variable names... ";
        if (ans.res) {
            if (ans.res.children && ans.res.children.type === "selector" &&
                    ans.res.children.children.val && ans.res.children.children.val.type === "variable" &&
                    ans.res.children.children.val.val.name === "val" &&
                    ans.res.children.children.type && ans.res.children.children.type.type === "variable" &&
                    ans.res.children.children.type.val.name === "type") {
                summary += "[ok]";
                success++;
            } else {
                console.log(ans.err);
                summary += "[FAIL]";
                fail++;
            }
            console.log(JSON.stringify(ans.res, null, 2).replace(new RegExp("\"", "g"), ""));
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        // test 22
        txt = 'click_off { display := "On" }';
        summary += "\n\nTest " + (++tot) + ": '" + txt + "'";
        ans = parser.parseTransition(txt);
        console.log(ans);
        summary += "\n  Parsing transition... ";
        if (ans.res && ans.res.type === "transition" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.identifier.val === "click_off" &&
                ans.res.val.identifier.type === "identifier" &&
                ans.res.val.actions &&
                ans.res.val.actions.type === "actions" &&
                ans.res.val.actions.val &&
                ans.res.val.actions.val.length === 1 &&
                ans.res.val.actions.val[0].type === "assignment" &&
                ans.res.val.actions.val[0].val.identifier.type === "identifier" &&
                ans.res.val.actions.val[0].val.identifier.val === "display" &&
                ans.res.val.actions.val[0].val.binop.type === "binop" &&
                ans.res.val.actions.val[0].val.binop.val === ":=" &&
                ans.res.val.actions.val[0].val.expression.type === "expression" &&
                ans.res.val.actions.val[0].val.expression.val.length === 1 &&
                ans.res.val.actions.val[0].val.expression.val[0].type === "constant" &&
                ans.res.val.actions.val[0].val.expression.val[0].val === '"On"') {
            summary += "[ok]";
            success++;
        } else {
            console.log(ans.err);
            summary += "[FAIL]";
            fail++;
        }

        
        summary += "\n\n--------------------------------------------------------";
        summary += "\n Success: " + success + "/" + tot;
        summary += "\n Fail   : " + fail + "/" + tot;
        summary += "\n--------------------------------------------------------\n";
        return summary;
    };
   
    
    module.exports = EmuchartsParser_UnitTest;
});