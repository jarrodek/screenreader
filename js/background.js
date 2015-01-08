
/**
 * The reader namespace
 */
var reader = {};
/**
 * Reader app namespace.
 * @type Object
 */
reader.app = {};

reader.app.active = null;

reader.app.init = function () {
  reader.app.setBrowserIcon();
  chrome.browserAction.setTitle({
      title: 'Toggle On/Off'
  });
  reader.app.listen();
};

reader.app.isActive = function () {
  return new Promise(function (resolve, reject) {
    if(reader.app.active !== null){
      resolve(reader.app.active);
      return;
    }
    chrome.storage.sync.get({active: true}, function (data) {
      reader.app.active = data.active;
      resolve(data.active);
    });
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


reader.app.toggleActive = function () {
  if(reader.app.active === null) reader.app.active = false;
  reader.app.active = !reader.app.active;
  chrome.storage.sync.set({active: reader.app.active}, function (data) {
    reader.app.setBrowserIcon();
  });
};



reader.app.listen = function(){
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.parse === "image"){
      var img = new Image();
      img.onload = function () {
        var canvas = Pixastic.process(img, "brightness", {brightness: 0, contrast: 1.5});
        var url = canvas.toDataURL();
        sendResponse({img: url});
      };
      img.src = request.img;
      return true;
    } else if(request.payload === "isactive"){
      reader.app.isActive().then(function (active) {
        sendResponse({active: active});
      });
      return true;
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