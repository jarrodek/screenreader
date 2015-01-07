
/**
 * The reader namespace
 */
var reader = {};
/**
 * Reader app namespace.
 * @type Object
 */
reader.app = {};

reader.app.init = function () {
    reader.app.setBrowserIcon();
    chrome.browserAction.setTitle({
        title: 'Toggle On/Off'
    });
};

reader.app.setBrowserIcon = function () {
    reader.app.isActive().then(function (active) {
        var icon = chrome.extension.getURL('img/icon32.png');
        if (!active) {
            icon = chrome.extension.getURL('img/icon32_off.png');
        }
        chrome.browserAction.setIcon({
            path: icon
        });
    });
};

reader.app.isActive = function () {
    return new Promise(function (resolve, reject) {
        chrome.storage.sync.get({active: true}, function (data) {
            resolve(data.active);
        });
    });
};


reader.app.toggleActive = function () {
    console.log('toggleActive');
    reader.app.isActive().then(function (active) {
        if (active) {
            chrome.storage.sync.set({active: false}, function (data) {
                reader.app.setBrowserIcon();
            });
        } else {
            chrome.storage.sync.set({active: true}, function (data) {
                reader.app.setBrowserIcon();
            });
        }
    });
};

//chrome.extension.onRequest.addListener(
//        function (request, sender, sendResponse) {
//            if (request.message === "isactive") {
//                reader.app.isActive().then(function (active) {
//                    sendResponse({
//                        active: active
//                    });
//                });
//            } else if (request.message === "parse") {
//                var img = new Image();
//                img.onload = function () {
//                    var canvas = Pixastic.process(img, "brightness", {brightness: 0, contrast: 1.5});
//                    sendResponse({data: canvas.toDataURL()});
//                };
//                img.src = request.img;
//            } else {
//                sendResponse({}); // snub them.
//            }
//        });

reader.app.init();
chrome.browserAction.onClicked.addListener(reader.app.toggleActive);