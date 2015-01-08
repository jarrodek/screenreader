
function ScreenAudio() {
  //
}

ScreenAudio.prototype = {

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
      var remove = [].slice.call(clone.querySelectorAll('script,style,img,object,embed,svg'));
      remove.forEach(function (node) {
        node.parentNode.removeChild(node);
      });
      var txt = this._getNodeText(clone).trim();
      txt = txt.replace(/[\s]{2,}/gi, ' ').trim();
      if (txt === "") {
        return;
      }

      this.play(txt);
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

  stop: function () {
    chrome.runtime.sendMessage({payload: "stop"});
  },

  play: function (msg) {
    chrome.runtime.sendMessage({payload: "play", message: msg});
  }
}

window.addEventListener("load", function(event) {
  var screenReader = new ScreenAudio();
  screenReader.observe();
  window.screenReader = screenReader;
});

