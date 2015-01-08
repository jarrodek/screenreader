const TRANSLATE_URI = 'http://translate.google.com/translate_tts?ie=UTF-8&tl=en&q=';

function ScreenAudio() {
  this.voices = window.speechSynthesis.getVoices();
  this.speaker = new AudioSpeaker();
}

ScreenAudio.prototype = {

  createVoice: function(str){

    var msg = new SpeechSynthesisUtterance(str);
    msg.voice = this.voices[10];
    msg.voiceURI = 'native';
    msg.volume = 1; // 0 to 1
    msg.rate = 1; // 0.1 to 10
    msg.pitch = 1.5; //0 to 2
    msg.lang = 'en-US';

    msg.addEventListener('end', function () {
      this.speaker.hide();
    }.bind(this));
    msg.addEventListener('start', function () {
      this.speaker.show();
    }.bind(this));

    return msg;
  },

  isAvailable: function(){
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage({payload: "isactive"}, function(response) {
        if(chrome.runtime.lastError){
          console.error(chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response.active);
      });
    });
  },

  _onDisabledDetected: function(){
    var remove = [].slice.call(document.querySelectorAll('screenreader-highlight'));
    remove.forEach(function (node) {
      node.classList.remove('screenreader-highlight');
    });
  },

  observe: function () {
    document.body.addEventListener('mouseover', this.overAction.bind(this));
    document.body.addEventListener('mouseout', this.outAction.bind(this));
    document.body.addEventListener('click', this.clickAction.bind(this));
  },

  overAction: function (e) {
    var node = e.target;
    if(node.nodeName === 'BODY' || node.dataset['notext']) return;

    this.isAvailable().then(function(available){
      if(!available){
        this._onDisabledDetected();
        return;
      }
      if (!node.classList.contains('screenreader-highlight')) {
        var txt = this._getNodeText(node);
        if(txt.trim() === '') {
          node.dataset['notext'] = true;
          return;
        }
        node.classList.add('screenreader-highlight');
      }
    }.bind(this));
  },

  outAction: function (e) {
    var node = e.target;
    if (node.classList.contains('screenreader-highlight')) {
      node.classList.remove('screenreader-highlight');
    }
  },

  clickAction: function(e){
    var node = e.target;
    if (!node.classList.contains('screenreader-highlight')) {
      this._onDisabledDetected();
      return;
    }
    this.stop();

    this.isAvailable().then(function(available){
      if(!available){
        return;
      }
      if(!node.dataset['clicked']){
        node.dataset['clicked'] = true;
        e.preventDefault();
        e.stopPropagation();
      }

      var clone = e.target.cloneNode(true);
      var remove = [].slice.call(clone.querySelectorAll('script,style,img,object,embed'));
      remove.forEach(function (node) {
        node.parentNode.removeChild(node);
      });
      var txt = this._getNodeText(clone).trim();
      txt = txt.replace(/[\n\r\t\s{2,}]+/gi, ' ');
      if (txt === "") {
        return;
      }

      text = this.prepareText(txt);
      this.play(text);
    }.bind(this));
  },
  /**
   * Get text value for node and sub-nodes.
   */
   _getNodeText: function(element){
      var result = '';
      if (element.childNodes.length > 0){
          for (var i = 0; i < element.childNodes.length; i++){
              result += this._getNodeText(element.childNodes[i]) + ' ';
          }
      }
      if (element.nodeType === Node.TEXT_NODE && element.nodeValue.trim() !== ''){
          result += element.nodeValue.trim();
      }
      return result;
  },
  prepareText: function (txt) {

    var replace = '$1 ' + chrome.i18n.getMessage('CONST_POINT') + ' $2 ';
    var pattern = new RegExp(/(\d)+\.(\d+)\s?/gi);
    var fullMatch = txt.match(pattern);
    replace = replace.replace(/\$0/, fullMatch);
    txt = txt.replace(pattern, replace);

    //replace sentences end mark to [ENDSENT] tag to restore later
    txt = txt.replace(/\.\s/gim, '[ENDSENT] ');
    txt = txt.replace(/\.$/gim, '[ENDSENT]');

    //replace all special characters
    txt = txt.replace(/\./gim, ' ' + chrome.i18n.getMessage('CONST_DOT') + ' ');
    txt = txt.replace(/,/gim, ' ' + chrome.i18n.getMessage('CONST_COMA') + ' ');
    txt = txt.replace(/!/gim, ' ' + chrome.i18n.getMessage('CONST_EXLM') + ' ');
    txt = txt.replace(/\?/gim, ' ' + chrome.i18n.getMessage('CONST_QUESTM') + ' ');
    txt = txt.replace(/"/gim, ' ' + chrome.i18n.getMessage('CONST_QUOTM') + ' ');
    //txt = txt.replace(/"/gim, ' quotation mark ');
    txt = txt.replace(/\$/gim, ' ' + chrome.i18n.getMessage('CONST_DOLLAR') + ' ');
    txt = txt.replace(/£/gim, ' ' + chrome.i18n.getMessage('CONST_POUND') + ' ');
    txt = txt.replace(/@/gim, ' ' + chrome.i18n.getMessage('CONST_AT') + ' ');

    txt = txt.replace(/\s?\[ENDSENT\]/g, '.');

    //add spaces to all shortcuts eg FBI -> F B I
    var r = new RegExp(/([A-Z]{2,})/g);
    var matches = txt.match(r);
    if (matches && matches.length > 0) {
        for (var i = 0; i < matches.length; i++) {
            var replacement = matches[i].replace(/(\w)/g, '$1 ');
            txt = txt.replace(matches[i], replacement);
        }
    }

    return txt;
  },
  stop: function () {
    window.speechSynthesis.cancel();
  },
  play: function (msg) {
    var parts = this.sentencesGenerator(msg);
    for(var part of parts){
      //console.log(part);
      var voice = this.createVoice(part);
      window.speechSynthesis.speak(voice);
    }
  },

  sentencesGenerator: function* (msg){
    var max = 150;
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
          msg = _part.substr(_lastSpacePos) + msg;
          _part = _part.substr(0, _lastSpacePos);
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
}

var screenReader = new ScreenAudio();
screenReader.observe();
