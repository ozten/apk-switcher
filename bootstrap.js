var APK_PREF = "browser.webapps.apkFactoryUrl";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);

function isNativeUI() {
  return (Services.appinfo.ID == "{aa3c5121-dab2-40e2-81ca-7ea25febc110}");
}

function showDoorhanger(aWindow) {

  var curUrl = prefs.getCharPref(APK_PREF);

  var envs = [
    ['https://controller.apk.firefox.com/application.apk',             'prod'],
    ['https://controller-review.apk.firefox.com/application.apk',      'prod review'],
    ['https://apk-controller.stage.mozaws.net/application.apk',        'stage'],
    ['https://apk-controller-review.stage.mozaws.net/application.apk', 'stage review'],
    ['https://apk-controller.dev.mozaws.net/application.apk',          'dev'],
    ['https://apk-controller-review.dev.mozaws.net/application.apk',   'dev review'],
    ['http://localhost:8080/application.apk',                          'localhost:8080']
  ];

  var buttons = [];

  var curEnv;
  for (var i=0; i < envs.length; i++) {
    if (curUrl === envs[i][0]) {
      curEnv = envs[i][1];
    } else {
      (function(label, url) {
        buttons.push({
          label: envs[i][1],
          callback: function() {
            prefs.setCharPref(APK_PREF, url);
            aWindow.NativeWindow.toast.show("Switched to " + label + ' at ' + url, "short");
          }
        });
      })(envs[i][1], envs[i][0]);
    }
  }

  aWindow.NativeWindow.doorhanger.show("Choose APK Factory Service environment (currently " + curEnv + ")",
"apk-switcher", buttons);
}

var gDoorhangerMenuId = null;

function loadIntoWindow(window) {
  if (!window)
    return;

  if (isNativeUI()) {
    gDoorhangerMenuId = window.NativeWindow.menu.add("Switch APK Factory", null, function() { showDoorhanger(window); });
  }
}

function unloadFromWindow(window) {
  if (!window)
    return;

  if (isNativeUI()) {
    window.NativeWindow.menu.remove(gDoorhangerMenuId);
  }
}


/**
 * bootstrap.js API
 */
var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function() {
      domWindow.removeEventListener("load", arguments.callee, false);
      loadIntoWindow(domWindow);
    }, false);
  },
  
  onCloseWindow: function(aWindow) {
  },
  
  onWindowTitleChange: function(aWindow, aTitle) {
  }
};

function startup(aData, aReason) {
  // Load into any existing windows
  let windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  Services.wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (aReason == APP_SHUTDOWN)
    return;

  // Stop listening for new windows
  Services.wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

function install(aData, aReason) {
}

function uninstall(aData, aReason) {
}
