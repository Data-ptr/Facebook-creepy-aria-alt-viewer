# Facebook-creepy-aria-alt-viewer
Quick hacks to easily display creepy FB AI image guesses (Userscript)

## Example of output
<img src="https://github.com/Data-ptr/Facebook-creepy-aria-alt-viewer/blob/master/Screen%20Shot%202019-07-03%20at%2010.47.36%20PM.png?raw=true" alt="It knows what memes are..." width="500px"/>

## Install
1. Get yourself a Userscript plugin/extension
1. Make a new script, paste this one in or w/e

* Google Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en
* Firefox: https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/

## Settings
There are a few settings up top to play with what is hidden or not.

* hideOwnProfileIcon
  - Default: true
  - Don't show text for your own user icon (in some cases)
* honorAriaHidden
  - Default: true
  - Don't show the text if a parent anchor tag has `aria-hidden="true"` attribute
  - That is, most user icons
* showBoringResults
  - Default: false
  - Show text snipits that say things like "No photo description available"
* onlyShowImgMayContain
  - Default: false
  - Only show text that starts with "Image May Contain:" (the funny ones)

## Bugs
1. Still plenty
1. I put way too much time into patching stuff
1. As soon as Facebook changes anything it will all fall apart!
