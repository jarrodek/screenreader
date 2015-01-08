
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

/**
 * This will hold restored settings
 * until event page unloads.
 */
//reader.app.restoredSpeachOptions = null;
reader.app.getSpeakOptions = function(){
  return new Promise(function (resolve, reject) {
    //if(reader.app.restoredSpeachOptions !== null){
    //  resolve(reader.app.restoredSpeachOptions);
    //} else {
      var defaults = {
        'enqueue': true,
        'lang': 'en-US',
        'gender': 'female',
        'rate': 1.0,
        'pitch': 1.0
      };
      chrome.storage.sync.get(defaults, function (data) {
        //console.log(data);
        //window.reader.app.restoredSpeachOptions = data;
        try{
          data.rate = parseFloat(data.rate);
        } catch(e){
          data.rate = 1;
        }
        try{
          data.pitch = parseFloat(data.pitch);
        } catch(e){
          data.pitch = 1;
        }
        resolve(data);
      });
    //}
  });
}



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
  reader.app.isActive().then(function (active) {
    active = !active;
    reader.app.active = active;
    if(!active){
      reader.app.stopSpeaking();
    }
    chrome.storage.sync.set({active: active}, function (data) {
      reader.app.setBrowserIcon();
    });
  });
};



reader.app.listen = function(){
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if(request.payload){
      switch(request.payload){
        case 'isactive':
          reader.app.isActive().then(function (active) {
            sendResponse({active: active});
          });
          return true;
        case 'play':
          reader.app.stopSpeaking();
          reader.app.speak(request.message);
          break;
        case 'stop':
          reader.app.stopSpeaking();
          break;
      }
    } else if(request.parse === "image"){
      var img = new Image();
      img.onload = function () {
        var canvas = Pixastic.process(img, "brightness", {brightness: 0, contrast: 1.5});
        var url = canvas.toDataURL();
        sendResponse({img: url});
      };
      img.src = request.img;
      return true;
    }
  });
};

reader.app.speak = function(message){
  reader.app.isActive()
    .then(reader.app._prepareUtteranceOptions)
    .then(function(opts){
      if(!opts) return;
      //console.log('Preparing: ', message);
      message = reader.app.prepareText(message);
      reader.app._playUtterance(opts, message);
    });
};
reader.app.stopSpeaking = function(){
  chrome.tts.stop();
}

reader.app._prepareUtteranceOptions = function(enabled){
  if(!enabled) return null;
  return reader.app.getSpeakOptions();
}

/**
 * Play the utterance.
 * @param {Object} options - an options for tts engine
 * @param {String} utterance - an utterance to speak
 */
reader.app._playUtterance = function(options, utterance){

  var parts = this.sentencesGenerator(utterance);
  for(var part of parts){
    //console.log(part.length, part);
    chrome.tts.speak(part, options, function() {
      if (chrome.runtime.lastError) {
        console.log('Error: ' + chrome.runtime.lastError.message);
      }
    });
  }
}

/**
 * Prepare a text to be read in senteces.
 * Chrome tts engine has 32,768 character limit. After reaching this limit
 * the msg will be splitted.
 * The split point will occure after last "." before character limit.
 */
reader.app.sentencesGenerator = function* (msg){
  var max = 240; //32768;
  while(msg){
    var exact = !(msg.length > max);

    var _len = Math.min(max, msg.length);
    var _part = msg.substr(0, _len);
    msg = msg.substr(_len);

    if(!exact){
      // look for last space and don't break a word.
      //start with looking for a "." (dot).
      var _lastSpacePos = _part.lastIndexOf('.');
      if(_lastSpacePos > 1){
        msg = _part.substr(_lastSpacePos+1) + msg;
        _part = _part.substr(0, _lastSpacePos+1);
      } else {
        // ther's not dot in the line. Look for last space.
        _lastSpacePos = _part.lastIndexOf(' ');
        msg = _part.substr(_lastSpacePos) + msg;
        _part = _part.substr(0, _lastSpacePos);
      }
    }

    if(_part.length === 0){
      yield null;
    }
    yield _part;
  }
}

/**
 * Prepare text to be read.
 * It will replace special characters like "$", "£" or "?" to its equivalent
 * understandable by the tts engine.
 */
reader.app.prepareText = function (txt) {

  var replace = '$1 ' + chrome.i18n.getMessage('CONST_POINT') + ' $2';
  var pattern = new RegExp(/(\d+)\.(\d+)/gi);
  var fullMatch = txt.match(pattern);
  replace = replace.replace(/\$0/, fullMatch);
  txt = txt.replace(pattern, replace);


  //replace sentences end mark to [ENDSENT] tag to restore later
  txt = txt.replace(/\.\s/gim, '[ENDSENT] ');
  txt = txt.replace(/\.$/gim, '[ENDSENT]');

  //replace all special characters
  //txt = txt.replace(/\./gim, ' ' + chrome.i18n.getMessage('CONST_DOT') + ' ');
  //txt = txt.replace(/,/gim, ' ' + chrome.i18n.getMessage('CONST_COMA') + ' ');
  txt = txt.replace(/!/gim, ' ' + chrome.i18n.getMessage('CONST_EXLM') + ' ');
  txt = txt.replace(/\?/gim, ' ' + chrome.i18n.getMessage('CONST_QUESTM') + ' ');
  txt = txt.replace(/"/gim, ' ' + chrome.i18n.getMessage('CONST_QUOTM') + ' ');
  txt = txt.replace(/\$/gim, ' ' + chrome.i18n.getMessage('CONST_DOLLAR') + ' ');
  txt = txt.replace(/£/gim, ' ' + chrome.i18n.getMessage('CONST_POUND') + ' ');
  txt = txt.replace(/@/gim, ' ' + chrome.i18n.getMessage('CONST_AT') + ' ');

  txt = txt.replace(/\s?\[ENDSENT\]/g, '.');

  //add spaces to all shortcuts eg FBI -> F B I
  var r = new RegExp(/([A-Z]{2,})/g);
  var matches = txt.match(r);
  if (matches && matches.length > 0) {
      for (var i = 0; i < matches.length; i++) {
          var replacement = matches[i].replace(/(\w)/g, '$1');
          txt = txt.replace(matches[i], replacement);
      }
  }

  return txt;
};

reader.app.init();
chrome.browserAction.onClicked.addListener(reader.app.toggleActive);