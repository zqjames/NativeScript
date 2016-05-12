import * as inspectorCommandTypes from "./InspectorBackendCommands.ios";
let inspectorCommands: typeof inspectorCommandTypes = require("./InspectorBackendCommands");
import * as debuggerDomains from "./debugger";
import * as core from "ui/core/view";
import * as frame from "ui/frame";

declare var __inspectorTimestamp;

const frameId = "NativeScriptMainFrameIdentifier";
const loaderId = "Loader Identifier";

let resources_datas = [];

let documentTypeByMimeType = {
    "text/xml": "Document",
    "text/plain": "Document",
    "text/html": "Document",
    "application/xml": "Document",
    "application/xhtml+xml": "Document",
    "text/css": "Stylesheet",
    "text/javascript": "Script",
    "text/ecmascript": "Script",
    "application/javascript": "Script",
    "application/ecmascript": "Script",
    "application/x-javascript": "Script",
    "application/json": "Script",
    "application/x-json": "Script",
    "text/x-javascript": "Script",
    "text/x-json": "Script",
    "text/typescript": "Script"
}

export class Request {

    private _resourceType: string;
    private _data: any;
    private _mimeType: string;

    constructor(private _networkDomainDebugger: NetworkDomainDebugger, private _requestID: string) {
    }

    get mimeType(): string {
        return this._mimeType;
    }

    set mimeType(value: string) {
        if (this._mimeType !== value) {
            this._mimeType = value;

            let resourceType = "Other";

            if (this._mimeType in documentTypeByMimeType) {
                resourceType = documentTypeByMimeType[this._mimeType];
            }

            if (this._mimeType.indexOf("image/") !== -1) {
                resourceType = "Image";
            }

            if (this._mimeType.indexOf("font/") !== -1) {
                resourceType = "Font";
            }

            this._resourceType = resourceType;
        }
    }

    get requestID(): string {
        return this._requestID;
    }

    get hasTextContent(): boolean {
        return [ "Document", "Stylesheet", "Script", "XHR" ].indexOf(this._resourceType) !== -1;
    }

    get data(): any {
        return this._data;
    }

    set data(value: any) {
        if (this._data !== value) {
            this._data = value;
        }
    }

    get resourceType() {
        return this._resourceType;
    }

    set resourceType(value: string) {
        if (this._resourceType !== value) {
                this._resourceType = value;
        }
    }

    public responseReceived(response: inspectorCommandTypes.NetworkDomain.Response): void {
        if (this._networkDomainDebugger.enabled) {
            this._networkDomainDebugger.events.responseReceived(this.requestID, frameId, loaderId, __inspectorTimestamp(), <any>this.resourceType, response);
        }
    }

    public loadingFinished(): void {
        if (this._networkDomainDebugger.enabled) {
            this._networkDomainDebugger.events.loadingFinished(this.requestID, __inspectorTimestamp());
        }
    }

    public requestWillBeSent(request: inspectorCommandTypes.NetworkDomain.Request): void {
        if (this._networkDomainDebugger.enabled) {
            this._networkDomainDebugger.events.requestWillBeSent(this.requestID, frameId, loaderId, request.url, request, __inspectorTimestamp(), { type: 'Script' });
        }
    }
}

@inspectorCommands.DomainDispatcher("Network")
export class NetworkDomainDebugger implements inspectorCommandTypes.NetworkDomain.NetworkDomainDispatcher {
    private _enabled: boolean;
    public events: inspectorCommandTypes.NetworkDomain.NetworkFrontend;

    constructor() {
        this.events = new inspectorCommands.NetworkDomain.NetworkFrontend();
    }

    get enabled(): boolean {
        return this._enabled;
    }

    /**
     * Enables network tracking, network events will now be delivered to the client.
     */
    enable(): void {
        if (debuggerDomains.network) {
            throw new Error("One NetworkDomainDebugger may be enabled at a time.");
        } else {
            debuggerDomains.network = this;
        }
        this._enabled = true;
    }

    /**
     * Disables network tracking, prevents network events from being sent to the client.
     */
    disable(): void {
        if (debuggerDomains.network === this) {
            debuggerDomains.network = null;
        }
        this._enabled = false;
    }

    /**
     * Specifies whether to always send extra HTTP headers with the requests from this page.
     */
    setExtraHTTPHeaders(params: inspectorCommandTypes.NetworkDomain.SetExtraHTTPHeadersMethodArguments): void {
        //
    }

    /**
     * Returns content served for the given request.
     */
    getResponseBody(params: inspectorCommandTypes.NetworkDomain.GetResponseBodyMethodArguments): { body: string, base64Encoded: boolean } {
        var resource_data = resources_datas[params.requestId];
        var body = resource_data.hasTextContent ? NSString.alloc().initWithDataEncoding(resource_data.data, 4).toString() :
                    resource_data.data.base64EncodedStringWithOptions(0);

        if(resource_data) {
             return {
                 body: body,
                 base64Encoded: !resource_data.hasTextContent
             };
        }
    }

    /**
     * Tells whether clearing browser cache is supported.
     */
    canClearBrowserCache(): { result: boolean } {
        return {
            result: false
        };
    }

    /**
     * Clears browser cache.
     */
    clearBrowserCache(): void {
        //
    }

    /**
     * Tells whether clearing browser cookies is supported.
     */
    canClearBrowserCookies(): { result: boolean } {
        return {
            result: false
        };
    }

    /**
     * Clears browser cookies.
     */
    clearBrowserCookies(): void {
        //
    }

    /**
     * Toggles ignoring cache for each request. If <code>true</code>, cache will not be used.
     */
    setCacheDisabled(params: inspectorCommandTypes.NetworkDomain.SetCacheDisabledMethodArguments): void {
        //
    }

    /**
     * Loads a resource in the context of a frame on the inspected page without cross origin checks.
     */
    loadResource(params: inspectorCommandTypes.NetworkDomain.LoadResourceMethodArguments): { content: string, mimeType: string, status: number } {
        return {
            content: "",
            mimeType: "",
            status: 200
        };
    }

    public static idSequence: number = 0;
    create(): Request {
        let id = (++NetworkDomainDebugger.idSequence).toString();
        let resourceData = new Request(this, id);
        resources_datas[id] = resourceData;
        return resourceData;
    }
}

let __domDebugger: DOMDebugger;

class NativeNode implements inspectorCommandTypes.DOMDomain.Node {

    public nodeId: number;
    public nodeType: number;
    public nodeName: string;
    public localName: string;
    public nodeValue: string;
    public childNodeCount: number;
    public children: inspectorCommandTypes.DOMDomain.Node[];
    public documentURL: string;
    public role: string;
    public attributes: string[];

    constructor(view: core.View, nodeType: number) {
        this.nodeId = view._domId;
        this.nodeType = nodeType;
        this.nodeName = view.typeName;
        this.localName = this.nodeName;
        this.nodeValue = "";
        this.childNodeCount = view._childrenCount;
        this.children = [];
        this.documentURL = "";
        view._eachChildView((subview) => {
            this.children.push(new NativeNode(subview, 1));
            return true;
        });
        this.attributes = [];
        view._eachSetProperty((property) => {
            this.attributes.push(property.name);
            this.attributes.push("" + view._getValue(property));
            return true;
        });

        view.style._eachSetProperty((property) => {
            this.attributes.push(property.name);
            this.attributes.push("" + view.style._getValue(property));
            return true;
        });
        this.role = "";

        if (!global.__domDebugger) {
            global.__domDebugger = __domDebugger;
        }
    }
}

@inspectorCommands.DomainDispatcher("DOM")
export class DOMDebugger implements inspectorCommandTypes.DOMDomain.DOMDomainDispatcher { 

    public events: inspectorCommandTypes.DOMDomain.DOMFrontend;

    constructor() {
        this.events = new inspectorCommands.DOMDomain.DOMFrontend();
        __domDebugger = this;
    }

    // Returns the root DOM node to the caller.
    getDocument(): { root: inspectorCommandTypes.DOMDomain.Node } {
       let topframe = frame.topmost();
       let node = null;
       if (topframe) {
           node = new NativeNode(topframe, 9);
       }
       return { root: node };
    }

    // Requests that children of the node with given id are returned to the caller in form of <code>setChildNodes</code> events where not only immediate children are retrieved, but all children down to the specified depth.
    requestChildNodes(params: inspectorCommandTypes.DOMDomain.RequestChildNodesMethodArguments): void {
        console.log("requestChildNodes");
    }

    // Executes <code>querySelector</code> on a given node.
    querySelector(params: inspectorCommandTypes.DOMDomain.QuerySelectorMethodArguments): { nodeId: inspectorCommandTypes.DOMDomain.NodeId } {
        return { nodeId: null };
    }

    // Executes <code>querySelectorAll</code> on a given node.
    querySelectorAll(params: inspectorCommandTypes.DOMDomain.QuerySelectorAllMethodArguments): { nodeIds: inspectorCommandTypes.DOMDomain.NodeId[] } {
        return { nodeIds: [] };
    }

    // Sets node name for a node with given id.
    setNodeName(params: inspectorCommandTypes.DOMDomain.SetNodeNameMethodArguments): { nodeId: inspectorCommandTypes.DOMDomain.NodeId } {
        return { nodeId: null };
    }

    // Sets node value for a node with given id.
    setNodeValue(params: inspectorCommandTypes.DOMDomain.SetNodeValueMethodArguments): void {
        console.log("setNodeValue");
    }

    // Removes node with given id.
    removeNode(params: inspectorCommandTypes.DOMDomain.RemoveNodeMethodArguments): void {
        console.log("removeNode");
    }

    // Sets attribute for an element with given id.
    setAttributeValue(params: inspectorCommandTypes.DOMDomain.SetAttributeValueMethodArguments): void {
        console.log("setAttributeValue");
    }

    // Sets attributes on element with given id. This method is useful when user edits some existing attribute value and types in several attribute name/value pairs.
    setAttributesAsText(params: inspectorCommandTypes.DOMDomain.SetAttributesAsTextMethodArguments): void {
        let topview = frame.topmost();
        let eachChild = function(view: core.View): boolean {
           if (view._domId === params.nodeId) {
               view[params.name] = params.text.replace(params.name + "=\"", "").replace("\"", "");
               return false;
           }
           return view._eachChildView(eachChild);
        };
        topview._eachChildView(eachChild);
    }

    // Removes attribute with given name from an element with given id.
    removeAttribute(params: inspectorCommandTypes.DOMDomain.RemoveAttributeMethodArguments): void {
        console.log("removeAttribute");
    }

    // Returns event listeners relevant to the node.
    getEventListenersForNode(params: inspectorCommandTypes.DOMDomain.GetEventListenersForNodeMethodArguments): { listeners: inspectorCommandTypes.DOMDomain.EventListener[] } {
        return { listeners: [] };
    }

    // Returns a dictionary of accessibility properties for the node.
    getAccessibilityPropertiesForNode(params: inspectorCommandTypes.DOMDomain.GetAccessibilityPropertiesForNodeMethodArguments): { properties: inspectorCommandTypes.DOMDomain.AccessibilityProperties } {
        return { properties: null };
    }

    // Returns node's HTML markup.
    getOuterHTML(params: inspectorCommandTypes.DOMDomain.GetOuterHTMLMethodArguments): { outerHTML: string } {
        return { outerHTML: null };
    }

    // Sets node HTML markup, returns new node id.
    setOuterHTML(params: inspectorCommandTypes.DOMDomain.SetOuterHTMLMethodArguments): void {
        console.log("setOuterHTML");
    }

    // Searches for a given string in the DOM tree. Use <code>getSearchResults</code> to access search results or <code>cancelSearch</code> to end this search session.
    performSearch(params: inspectorCommandTypes.DOMDomain.PerformSearchMethodArguments): { searchId: string, resultCount: number } {
        return { searchId: "a", resultCount: 0 };
    }

    // Returns search results from given <code>fromIndex</code> to given <code>toIndex</code> from the sarch with the given identifier.
    getSearchResults(params: inspectorCommandTypes.DOMDomain.GetSearchResultsMethodArguments): { nodeIds: inspectorCommandTypes.DOMDomain.NodeId[] } {
        return { nodeIds: [] };
    }

    // Discards search results from the session with the given id. <code>getSearchResults</code> should no longer be called for that search.
    discardSearchResults(params: inspectorCommandTypes.DOMDomain.DiscardSearchResultsMethodArguments): void {
        console.log("discardSearchResults");
    }

    // Requests that the node is sent to the caller given the JavaScript node object reference. All nodes that form the path from the node to the root are also sent to the client as a series of <code>setChildNodes</code> notifications.
    requestNode(params: inspectorCommandTypes.DOMDomain.RequestNodeMethodArguments): { nodeId: inspectorCommandTypes.DOMDomain.NodeId } {
        return { nodeId: null };
    }

    // Enters the 'inspect' mode. In this mode, elements that user is hovering over are highlighted. Backend then generates 'inspect' command upon element selection.
    setInspectModeEnabled(params: inspectorCommandTypes.DOMDomain.SetInspectModeEnabledMethodArguments): void {
        console.log("setInspectModeEnabled");
    }

    // Highlights given rectangle. Coordinates are absolute with respect to the main frame viewport.
    highlightRect(params: inspectorCommandTypes.DOMDomain.HighlightRectMethodArguments): void {
        console.log("highlightRect");
    }

    // Highlights given quad. Coordinates are absolute with respect to the main frame viewport.
    highlightQuad(params: inspectorCommandTypes.DOMDomain.HighlightQuadMethodArguments): void {
        console.log("highlightQuad");
    }

    // Highlights all DOM nodes that match a given selector. A string containing a CSS selector must be specified.
    highlightSelector(params: inspectorCommandTypes.DOMDomain.HighlightSelectorMethodArguments): void {
        console.log("highlightSelector");
    }

    // Highlights DOM node with given id or with the given JavaScript object wrapper. Either nodeId or objectId must be specified.
    highlightNode(params: inspectorCommandTypes.DOMDomain.HighlightNodeMethodArguments): void {
        console.log("highlightNode");
    }

    // Hides DOM node highlight.
    hideHighlight(): void {
        console.log("hideHighlight");
    }

    // Highlights owner element of the frame with given id.
    highlightFrame(params: inspectorCommandTypes.DOMDomain.HighlightFrameMethodArguments): void {
        console.log("highlightFrame");
    }

    // Requests that the node is sent to the caller given its path. // FIXME, use XPath
    pushNodeByPathToFrontend(params: inspectorCommandTypes.DOMDomain.PushNodeByPathToFrontendMethodArguments): { nodeId: inspectorCommandTypes.DOMDomain.NodeId } {
        return { nodeId: null };
    }

    // Requests that the node is sent to the caller given its backend node id.
    pushNodeByBackendIdToFrontend(params: inspectorCommandTypes.DOMDomain.PushNodeByBackendIdToFrontendMethodArguments): { nodeId: inspectorCommandTypes.DOMDomain.NodeId } {
        return { nodeId: null };
    }

    // Requests that group of <code>BackendNodeIds</code> is released.
    releaseBackendNodeIds(params: inspectorCommandTypes.DOMDomain.ReleaseBackendNodeIdsMethodArguments): void {
        console.log("releaseBackendNodeIds");
    }

    // Resolves JavaScript node object for given node id.
    resolveNode(params: inspectorCommandTypes.DOMDomain.ResolveNodeMethodArguments): { object: inspectorCommandTypes.RuntimeDomain.RemoteObject } {
       // console.log("RESOLVE NODE");
        return { object: null};
    }

    // Returns attributes for the specified node.
    getAttributes(params: inspectorCommandTypes.DOMDomain.GetAttributesMethodArguments): { attributes: string[] } {
        return { attributes: [] };
    }

    // Moves node into the new container, places it before the given anchor.
    moveTo(params: inspectorCommandTypes.DOMDomain.MoveToMethodArguments): { nodeId: inspectorCommandTypes.DOMDomain.NodeId } {
        return { nodeId: null };
    }

    // Undoes the last performed action.
    undo(): void {
        console.log("undo");
    }

    // Re-does the last undone action.
    redo(): void {
        console.log("redo");
    }

    // Marks last undoable state.
    markUndoableState(): void {
        console.log("markUndoableState");
    }

    // Focuses the given element.
    focus(params: inspectorCommandTypes.DOMDomain.FocusMethodArguments): void {
        console.log("focus");
    }
}

@inspectorCommands.DomainDispatcher("CSS")
export class MyCSSDispatcher implements inspectorCommandTypes.CSSDomain.CSSDomainDispatcher {

    // Enables the CSS agent for the given page. Clients should not assume that the CSS agent has been enabled until the result of this command is received.
    enable(): void {
        console.log("enable");
    }
	// Disables the CSS agent for the given page.
    disable(): void {
        console.log("disable");
    }

	// Returns requested styles for a DOM node identified by <code>nodeId</code>.
    getMatchedStylesForNode(params: inspectorCommandTypes.CSSDomain.GetMatchedStylesForNodeMethodArguments):
       { matchedCSSRules?: inspectorCommandTypes.CSSDomain.RuleMatch[],
         pseudoElements?: inspectorCommandTypes.CSSDomain.PseudoIdMatches[],
         inherited?: inspectorCommandTypes.CSSDomain.InheritedStyleEntry[] } {
        return {};
    }

	// Returns the styles defined inline (explicitly in the "style" attribute and implicitly, using DOM attributes) for a DOM node identified by <code>nodeId</code>.
    getInlineStylesForNode(params: inspectorCommandTypes.CSSDomain.GetInlineStylesForNodeMethodArguments): { inlineStyle?: inspectorCommandTypes.CSSDomain.CSSStyle, attributesStyle?: inspectorCommandTypes.CSSDomain.CSSStyle } {
        return {};
    }

	// Returns the computed style for a DOM node identified by <code>nodeId</code>.
    getComputedStyleForNode(params: inspectorCommandTypes.CSSDomain.GetComputedStyleForNodeMethodArguments): { computedStyle: inspectorCommandTypes.CSSDomain.CSSComputedStyleProperty[] } {
        let style = [];
        let topview = frame.topmost();
        let eachChild = function(view: core.View): boolean {
            if (view._domId === params.nodeId) {
                view.style._eachSetProperty((property) => {
                    style.push({ name: property.name, value: "" + view.style._getValue(property) });
                    return true;
                });
                return false;
            }
            return view._eachChildView(eachChild);
        };
        topview._eachChildView(eachChild);
        return { computedStyle: style };
    }

	// Returns metainfo entries for all known stylesheets.
    getAllStyleSheets(): { headers: inspectorCommandTypes.CSSDomain.CSSStyleSheetHeader[] } {
        return { headers: [] };
    }

	// Returns stylesheet data for the specified <code>styleSheetId</code>.
    getStyleSheet(params: inspectorCommandTypes.CSSDomain.GetStyleSheetMethodArguments): { styleSheet: inspectorCommandTypes.CSSDomain.CSSStyleSheetBody } {
        return { styleSheet: null };
    }

	// Returns the current textual content and the URL for a stylesheet.
    getStyleSheetText(params: inspectorCommandTypes.CSSDomain.GetStyleSheetTextMethodArguments): { text: string } {
        return { text: "" };
    }

	// Sets the new stylesheet text, thereby invalidating all existing <code>CSSStyleId</code>'s and <code>CSSRuleId</code>'s contained by this stylesheet.
    setStyleSheetText(params: inspectorCommandTypes.CSSDomain.SetStyleSheetTextMethodArguments): void {
        console.log("setStyleSheetText");
    }

	// Sets the new <code>text</code> for the respective style.
    setStyleText(params: inspectorCommandTypes.CSSDomain.SetStyleTextMethodArguments): { style: inspectorCommandTypes.CSSDomain.CSSStyle } {
        return { style: null };
    }

	// Modifies the rule selector.
    setRuleSelector(params: inspectorCommandTypes.CSSDomain.SetRuleSelectorMethodArguments): { rule: inspectorCommandTypes.CSSDomain.CSSRule } {
        return { rule: null };
    }

	// Creates a new special "inspector" stylesheet in the frame with given <code>frameId</code>.
    createStyleSheet(params: inspectorCommandTypes.CSSDomain.CreateStyleSheetMethodArguments): { styleSheetId: inspectorCommandTypes.CSSDomain.StyleSheetId } {
        return { styleSheetId: null };
    }

	// Creates a new empty rule with the given <code>selector</code> in a stylesheet with given <code>styleSheetId</code>.
    addRule(params: inspectorCommandTypes.CSSDomain.AddRuleMethodArguments): { rule: inspectorCommandTypes.CSSDomain.CSSRule } {
        return { rule: null };
    }

	// Returns all supported CSS property names.
    getSupportedCSSProperties(): { cssProperties: inspectorCommandTypes.CSSDomain.CSSPropertyInfo[] } {
        return { cssProperties: [] };
    }

	// Returns all supported system font family names.
    getSupportedSystemFontFamilyNames(): { fontFamilyNames: string[] } {
        return { fontFamilyNames: [] };
    }

	// Ensures that the given node will have specified pseudo-classes whenever its style is computed by the browser.
    forcePseudoState(params: inspectorCommandTypes.CSSDomain.ForcePseudoStateMethodArguments): void {
        console.log("forcePseudoState");
    }

	// Returns the Named Flows from the document.
    getNamedFlowCollection(params: inspectorCommandTypes.CSSDomain.GetNamedFlowCollectionMethodArguments): { namedFlows: inspectorCommandTypes.CSSDomain.NamedFlow[] } {
        return { namedFlows: null };
    }
}
