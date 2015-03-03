import TKUnit = require("Tests/TKUnit");
import fs = require("file-system");
import xmlModule = require("xml");
import file_access_module = require("file-system/file-system-access");
import types = require("utils/types");
import app = require("application");
import trace = require("trace");

export var traceCategory = "definitionTest";

var ignoredModules = [
    "camera",
    "media-player",
    "ui/pagesNew",
    "ui/scroll-view",
    "ui/slide-out",
    "ui/web-view"];

var whitelist = {
    common: [
        "Function not defined: application:.onLaunch",
        "Function not defined: application:.onSuspend",
        "Function not defined: application:.onResume",
        "Function not defined: application:.onExit",
        "Function not defined: application:.onLowMemory",
    ],
    android: [
        "Variable not defined: application:.ios",
        "Cannot find submodule: utils/utils:ios when searching for utils/utils:ios.collections.jsArrayToNSArray",
        "Cannot find submodule: utils/utils:ios when searching for utils/utils:ios.collections.nsArrayToJSArray",
        "Cannot find submodule: utils/utils:ios when searching for utils/utils:ios.getColor",
        "Cannot find submodule: utils/utils:ios when searching for utils/utils:ios.getActualHeight"],
    ios: [
        "Variable not defined: application:.android",
        "Class not defined: ui/panels/panel:.NativePanel",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.collections.stringArrayToStringSet",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.collections.stringSetToStringArray",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.UNSPECIFIED",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.EXACTLY",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.AT_MOST",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.getMeasureSpecMode",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.getMeasureSpecSize",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.makeMeasureSpec",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.getDisplayMetrics",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.getDisplayDensity",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.getDevicePixels",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.layout.getDeviceIndependentPixels",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.id.home",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.resources.getDrawableId",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.resources.getStringId",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.resources.getId",
        "Cannot find submodule: utils/utils:ad when searching for utils/utils:ad.async", ],
};

interface FuncInfo {
    name: string;
    paramsCount: number
}

export var test_all_public_definitions_are_defined = function () {
    // Read specified CSS file from the current folder and assign it to the specified page
    var path = fs.path.join(fs.knownFolders.currentApp().path, "tns_modules", "Tests", "api.xml");
    
    if (!fs.File.exists(path)) {
        throw new Error("api.xml file not found");
    }

    var fileAccess = new file_access_module.FileSystemAccess();
    var xml: string;
    // Read the XML file.
    fileAccess.readText(path, (text) => {
        xml = text;
    });

    parseAndTest(xml)
};

function applyWhitelist(erros: Array<string>): Array<string> {
    var list = app.android ? whitelist.android : whitelist.ios;
    list = list.concat(whitelist.common);

    return erros.filter((val, index, all) => {
        return list.indexOf(val) < 0;
    });
}

function parseAndTest(xml: string) {
    var count: number = 0;
    var moduleNesting = 0;
    var currentModule = undefined;
    var currentModuleName: string = undefined;

    var subModuleStack = [];
    var functionStack = new Array<FuncInfo>();
    var errors = new Array<string>();

    var getModuleToCheck = function (name: string): Object {
        var moduleToCheck = currentModule;
        for (var i = 0; i < subModuleStack.length; i++) {
            moduleToCheck = moduleToCheck[subModuleStack[i]];
            if (!moduleToCheck) {
                var missingSubmodule = currentModuleName + ":" + subModuleStack.slice(0, i + 1).join(".");
                errors.push("Cannot find submodule: " + missingSubmodule + " when searching for " + getFullName(name));
                return undefined;
            }
        }

        return moduleToCheck;
    }

    var getFullName = function (name: string) {
        if (subModuleStack.length > 0) {
            return currentModuleName + ":" + subModuleStack.join(".") + "." + name;
        }
        else {
            return currentModuleName + ":" + "." + name;
        }
    }

    var getShortName = function (name: string) {
        return name.substring(name.lastIndexOf(":") + 1, name.length);
    }

    var checkFunction = function (info: FuncInfo) {
        if (!info.name) {
            return;
        }

        trace.write("Check function exists: " + getFullName(info.name), traceCategory);
        var moduleToCheck = getModuleToCheck(info.name);
        if (moduleToCheck) {
            var actual = moduleToCheck[info.name];
            if (!types.isFunction(actual)) {
                errors.push("Function not defined: " + getFullName(info.name));
            }
            else if (actual.length !== info.paramsCount) {
                errors.push("Function " + getFullName(info.name) + " expected params: " + info.paramsCount + " actual params: " + actual.length);
            }
        }
    }

    var checkClass = function (className: string) {
        trace.write("Check class exists: " + getFullName(className), traceCategory);
        var moduleToCheck = getModuleToCheck(className);
        if (moduleToCheck) {
            if (!types.isFunction(moduleToCheck[className])) {
                errors.push("Class not defined: " + getFullName(className));
            }
        }
    }

    var checkVar = function (varName: string) {
        trace.write("Check variable exists: " + getFullName(varName), traceCategory);
        var moduleToCheck = getModuleToCheck(varName);
        if (moduleToCheck) {
            if (!types.isDefined(moduleToCheck[varName])) {
                errors.push("Variable not defined: " + getFullName(varName));
            }
        }
    }

    var onEventCallback = function (event: xmlModule.ParserEvent) {
        try {
            switch (event.eventType) {

                case xmlModule.ParserEventType.StartElement:
                    if (event.elementName === "js:module") {
                        var moduleName: string = event.attributes["qname"];

                        if (moduleNesting === 0) {
                            moduleName = moduleName.replace(/&quot;/g, "");
                            if (ignoredModules.indexOf(moduleName) < 0) {
                                currentModuleName = moduleName;
                                trace.write("--- START CHECKING MODULE: " + currentModuleName, traceCategory);
                                currentModule = require(currentModuleName);
                            }
                        }
                        else {
                            moduleName = getShortName(moduleName);
                            //trace.write("Push submodule: " + moduleName);
                            subModuleStack.push(moduleName);
                        }

                        moduleNesting++;
                    }
                    else if (event.elementName === "js:function") {
                        functionStack.push({
                            name: (event.attributes && event.attributes["name"]) ? event.attributes["name"] : undefined,
                            paramsCount: 0
                        });
                    }
                    else if (event.elementName === "js:param" && functionStack.length > 0) {
                        if (!event.attributes || event.attributes["rest"] !== "true") {
                            functionStack[functionStack.length - 1].paramsCount++;
                        }
                    }
                    else if (event.elementName === "js:class" && event.attributes && event.attributes["qname"]) {
                        checkClass(getShortName(event.attributes["qname"]));
                    }

                    else if (event.elementName === "js:var" && event.attributes && event.attributes["name"]) {
                        checkVar(getShortName(event.attributes["name"]));
                    }
                    break;

                case xmlModule.ParserEventType.EndElement:
                    if (event.elementName === "js:module") {
                        moduleNesting--;
                        if (moduleNesting === 0) {
                            trace.write("--- FINISHED CHECKING MODULE: " + currentModuleName, traceCategory);
                            currentModule = undefined;
                            currentModuleName = undefined;
                        }
                        else {
                            var submodule = subModuleStack.pop();
                            //trace.write("Pop submodule: " + submodule);
                        }
                    }
                    else if (event.elementName === "js:function") {
                        checkFunction(functionStack.pop());
                    }

                    break;
            }
        }
        catch (error) {
            errors.push("Error is event callback: " + error.message);
        }
    };

    var onErrorCallback = function (error: Error) {
        errors.push("Error while parsing api.xml: " + error.message);
    };

    var xmlParser = new xmlModule.XmlParser(onEventCallback, onErrorCallback);
    xmlParser.parse(xml);

    errors = applyWhitelist(errors);

    TKUnit.assert(errors.length == 0, errors.join("\n"));
}