// ==UserScript==
// @name         Facebook creepy aria-alt viewer
// @namespace    http://janehacker.org
// @version      0.1
// @description  Display the contents of the aria-label or alt attribute of images on Facebook
// @author       Jane Hacker
// @include      *://www.facebook.com/*
// @grant        none
// @run-at document-end
// ==/UserScript==

// For the curious, ARIA = Accessible Rich Internet Applications

(function() {
    'use strict';

    // Settings
    document.fcaavSettings = {
        intervalLastRun:     0,
        intervalStorage:     undefined,
        modifiedMarkerClass: "aria-alt-revealed",

        // Settings Filter 1
        hideOwnProfileIcon:  true,
        honorAriaHidden:     true, // Don't show the text if a parent anchor tag has `aria-hidden="true"` attribute

        showBoringResults:   false, // Show text snipits that say things like "No photo description available"
        onlyShowImgMayContain: false,

        styleDeclarations: [
            "position: absolute",
            "top: 0",
            "background-color: hotpink !important",
            "line-height: normal",
            "margin: 5px",
            "text-align: center",
            "padding: 2px 5px",
            "border-radius: 7px",
            "border: 1px solid white",
            "font-size: 12pt",
            "z-index: 100",
            "overflow: hidden"
        ],

        classStyles: {
            "scaledImageFitWidth": "width: fit-content",
            "scaledImageFitHeight": "width: fit-content",
            "spotlight": "width: unset",
            _default: "width: max-content"
        },

        collapsed: {
            width: "12px",
            height: "17px",
            text: "+",
            normalText: "X",
            class: "collapsable"
        }
    };

    var pageContentChanged = false;

    // Check if the page has changed
    document.body.addEventListener("DOMSubtreeModified", function() {
        pageContentChanged = true;

        // Work around for full interval clear
        if(document.fcaavSettings.intervalLastRun + 1000 < Date.now()) {
            document.fcaavSettings.intervalStorage = setInterval(revealAriaAlt, 200);
        }
    });


    function revealAriaAlt() {
        // Work around for full interval clear
        document.fcaavSettings.intervalLastRun = Date.now();

        if (pageContentChanged) {
            //Get img tags from page, and put them in an array
            var imgArray = Array.prototype.slice.call(document.getElementsByTagName('img'));

            // Filter out img tags with the `aria-label` or `alt` attribute
            while(0 < imgArray.length) {
                var testImg = imgArray.pop();

                // Build the text element
                var attrText = "";

                if(attrText = filterAttributes(testImg)) {
                    // Mark the img tag is being modified
                    testImg.className += " " + document.fcaavSettings.modifiedMarkerClass;

                    testImg.parentNode.appendChild(buildLabelElement(testImg, attrText));
                }
            }

            pageContentChanged = false;
        }
    }


    function filterAttributes(tImg) {
        // Filter out if marked as having already been modified
        if(tImg.className.match(document.fcaavSettings.modifiedMarkerClass)) {
           return false;
        }

        // Extract attributes
        var altAttr = tImg.getAttribute('alt');
        var ariaAttr = tImg.getAttribute('aria-label');

        if((document.fcaavSettings.honorAriaHidden || document.fcaavSettings.hideOwnProfileIcon) && settingsFilter1(tImg)) {
            return false;
        }

        if(document.fcaavSettings.showBoringResults) {
            return ariaAttr ? ariaAttr : altAttr;
        }
        else {
            if(ariaAttr && !ariaAttr.match("No photo description available")) {
                return ariaAttr;
            }

            if(altAttr) {
                if(document.fcaavSettings.onlyShowImgMayContain && !altAttr.match("Image may contain:")) {
                    return false;
                }

                return altAttr;
            }
        }
    }


    function settingsFilter1(tImg) {
        // Climb up DOM until `a`
        var maxClimb = 5;
        var climbCount = 0;

        var currElement = tImg;

        while(++climbCount < maxClimb) {
            // If we hit an anchor tag, and check it for the `aria-hidden` attribute
            if("A" == currElement.tagName) {
                if(document.fcaavSettings.honorAriaHidden && "true" === currElement.getAttribute('aria-hidden')) {
                    return true;
                }

                if(document.fcaavSettings.hideOwnProfileIcon) {
                    var ariaLabel = currElement.getAttribute('aria-label');

                    if(ariaLabel && ariaLabel.match("Profile of")) {
                        return true;
                    }
                }
            }

            currElement = currElement.parentElement;
        }

        return false;
    }


    function buildLabelElement(tImg, aTxt) {
        var textDiv = document.createElement("DIV");

        // CSS Builder
        var cssText = "";

        var styleDeclarations = document.fcaavSettings.styleDeclarations;

        var useDefaultStyle = true;

        for(var classStyle in document.fcaavSettings.classStyles) {
            if(tImg.className.match(classStyle)) {
                useDefaultStyle = false;
                styleDeclarations.push(document.fcaavSettings.classStyles[classStyle]);
            }
        }

        if(useDefaultStyle) {
            styleDeclarations.push(document.fcaavSettings.classStyles._default);
        }

        var sdLen = styleDeclarations.length;

        for(var i = 0; i < sdLen; ++i) {
            cssText += styleDeclarations[i] + (sdLen - 1 == i ? ";" : "; ");
        }

        textDiv.style.cssText = cssText;

        // Append collapse node
        var collapseNode = document.createElement("DIV");
        collapseNode.style.float = "right";
        collapseNode.style.padding = "1px 3px";
        collapseNode.style.margin = "1px 5px";
        collapseNode.style.border = "1px solid white";
        collapseNode.appendChild(document.createTextNode(document.fcaavSettings.collapsed.normalText));

        collapseNode.addEventListener(
            "click",
            function(){
                event.preventDefault();
                event.cancelBubble = true;
                event.stopPropagation();

                if(this.collapsed) {
                    this.parentNode.style.width = this.oldWidth;
                    this.parentNode.style.height = this.oldHeight;

                    this.style.margin = "1px 5px";

                    this.textContent = document.fcaavSettings.collapsed.normalText;

                    this.collapsed = false;
                }
                else {
                    this.collapsed = true;

                    this.textContent = document.fcaavSettings.collapsed.text;

                    this.oldWidth = this.parentNode.style.width;
                    this.oldHeight = this.parentNode.style.height;

                    this.style.margin = "unset";

                    this.parentNode.style.width = this.offsetWidth + "px";
                    this.parentNode.style.height = this.offsetHeight + "px";
                }
            },
            {capture: true});

        textDiv.appendChild(collapseNode);

        // Append text node
        textDiv.appendChild(document.createTextNode("{ { " + aTxt + " } }"));

        return textDiv;
    }
})();
