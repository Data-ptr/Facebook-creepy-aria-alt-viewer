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
        styleElementId:        "fcaav",
        labelElementClass:     "fcaav-class",
        intervalLastRun:       0,
        intervalStorage:       undefined,
        modifiedMarkerClass:   "aria-alt-revealed",

        // Settings Filter 1
        hideOwnProfileIcon:    true,
        honorAriaHidden:       true,  // Don't show the text if a parent anchor tag has `aria-hidden="true"` attribute

        showBoringResults:     false, // Show text snipits that say things like "No photo description available"
        onlyShowImgMayContain: false,

        styles: {
            ".fcaav-class": {
                position: "absolute",
                top: "0",
                "background-color": "hotpink !important",
                "line-height": "normal",
                margin: "5px",
                "text-align": "center",
                padding: "2px 5px",
                "border-radius": "7px",
                border: "1px solid white",
                "font-size": "12pt",
                "z-index": "100",
                overflow: "hidden",
                width: "max-content"
            },
            "img.scaledImageFitWidth + div.fcaav-class, img.scaledImageFitHeight + div.fcaav-class": { //Cant this by dynamically named after `labelElementClass`?
                width: "fit-content"
            },
            "img.spotlight + div.fcaav-class": {
                width: "unset"
            },
            "div.fcaav-class .collapseBtn": {
                width:   "12px",
                height:  "17px",
                float:   "right",
                padding: "1px 3px",
                margin:  "1px 5px",
                border:  "1px solid white"
            },
            "div.fcaav-class .collapseBtn.collapsable": {
                margin: "1px 5px"
            },
            "div.fcaav-class .collapseBtn.collapsed": {
                margin: "unset"
            }
        },

        collapseBtn: {
            openText: "X",
            closedText: "+",
            class: "collapseBtn",
            openClass: "collapsable",
            closedClass: "collapsed"
        }
    };

    var pageContentChanged = false;

    // Check if the page has changed
    document.body.addEventListener("DOMSubtreeModified", function() {
        pageContentChanged = true;

        // Work around for full interval clear
        if(document.fcaavSettings.intervalLastRun + 1000 < Date.now()) {
            document.fcaavSettings.intervalStorage = setInterval(loop, 200);
        }
    });


    function loop() {
        // Sanity(-ish) checks
        intervalClearHack();

        checkStyleElement();

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

     function buildLabelElement(tImg, aTxt) {
         var textDiv = document.createElement("DIV");

         textDiv.classList.add(document.fcaavSettings.labelElementClass);

         // Append collapse node
         textDiv.appendChild(buildCollapseElement());

         // Append text node
         textDiv.appendChild(document.createTextNode("{ { " + aTxt + " } }"));

         return textDiv;
    }

    function buildCollapseElement() {
        var collapseNode = document.createElement("DIV");
        collapseNode.classList.add(document.fcaavSettings.collapseBtn.class);
        collapseNode.classList.add(document.fcaavSettings.collapseBtn.openClass);
        collapseNode.collapsed = false;
        collapseNode.appendChild(document.createTextNode(document.fcaavSettings.collapseBtn.openText));

        collapseNode.addEventListener(
            "click",
            function(){
                event.preventDefault();
                event.cancelBubble = true;
                event.stopPropagation();

                if(this.collapsed) {
                    this.parentNode.style.width = this.oldWidth;
                    this.parentNode.style.height = this.oldHeight;

                    // Remove old class, add new one
                    this.classList.remove(document.fcaavSettings.collapseBtn.closedClass);
                    this.classList.add(document.fcaavSettings.collapseBtn.openClass);

                    // Point "collapsable" indication
                    this.textContent = document.fcaavSettings.collapseBtn.openText;

                    // Last thing we do
                    this.collapsed = false;
                }
                else {
                    // fisrt thing we do
                    this.collapsed = true;

                    // Point "collapsed" indication
                    this.textContent = document.fcaavSettings.collapseBtn.closedText;

                    // Remove old class, add new one
                    this.classList.remove(document.fcaavSettings.collapseBtn.openClass);
                    this.classList.add(document.fcaavSettings.collapseBtn.closedClass);

                    this.oldWidth = this.parentNode.style.width;
                    this.oldHeight = this.parentNode.style.height;

                    this.parentNode.style.width = this.offsetWidth + "px";
                    this.parentNode.style.height = this.offsetHeight + "px";
                }
            },
            {capture: true});

        return collapseNode;
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

            if(altAttr && !altAttr.match("No photo description available")) {
                if(document.fcaavSettings.onlyShowImgMayContain && !altAttr.match("Image may contain:")) {
                    return false;
                }

                return altAttr;
            }
        }

        return false;
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

    function checkStyleElement() {
        var styleElement = document.getElementById(document.fcaavSettings.styleElementId);

        if(!styleElement) {
            addStyleElement();
        }
    }

    function addStyleElement() {
        var style = document.createElement('style');
        style.id = document.fcaavSettings.styleElementId;

        // Build CSS from js Object
        style.innerHTML = objectToCss(document.fcaavSettings.styles);

        // Get the first script tag
        var ref = document.querySelector('script');

        // Insert our new styles before the first script tag
        ref.parentNode.insertBefore(style, ref);
    }

    function objectToCss(styleObject) {
        var innerHtml = "";

        // First loop classes
        for(var classes in styleObject) {
            innerHtml += classes + "{\n";

            // Second loop decleratons
            for(var declerations in styleObject[classes]) {
                innerHtml += "\t" + declerations + ": " + styleObject[classes][declerations] + ";\n";
            }
            innerHtml += "}\n\n";
        }

        return innerHtml;
    }

    function intervalClearHack() {
        // Work around for full interval clear
        document.fcaavSettings.intervalLastRun = Date.now();
    }
})();
