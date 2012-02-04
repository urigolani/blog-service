/// <reference path="~/Scripts/Namespaces.js" />
/*globals Sys, window, Signals */
(function (window) {
    "use strict";

    // register the script with the window
    window.registerNamespace('ElBlogo');

    ElBlogo.HttpRequestBase = function () {
        /// <summary>
        /// HttpRequestBase
        /// Holds the actual data to be sent over the wire
        /// </summary>
        /// <field name="requestPolicy" type="Object">
        /// The request policy for this request
        /// </field>
        /// <field name="state" type="Object">
        /// A user defined state assigned to this request
        /// </field>
        /// <field name="httpMethod" type="String">
        /// The http method for this request
        /// </field>
        /// <field name="uri" type="String">
        /// The Uri for this request
        /// </field>
        /// <field name="queryString" type="String" mayBeNull="true">
        /// The query string for this request
        /// </field>
        /// <field name="requestBody" type="String" mayBeNull="true">
        /// The body for this request
        /// </field>
        /// <field name="responseType" type="String">
        /// The type of the response. 
        /// Should be one of the following: 'xml', 'html', 'json', 'script', 'text'
        /// </field>
        /// <field name="contentType" type="String">
        /// The request content type
        /// </field>
    };

    // public properties
    ElBlogo.HttpRequestBase.prototype = {
        requestPolicy: null,
        state: null,
        httpMethod: "POST",
        uri: "",
        queryString: null,
        requestBody: null,
        responseType: 'text/xml',
        contentType: 'application/json; charset=utf-8'
    };

}(window));
