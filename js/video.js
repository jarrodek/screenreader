/**
 * The reader namespace
 */
var reader = reader || {};
reader.video = reader.video || {};
reader.video.init = function(){
  document.body.addEventListener('mouseover', this.overAction.bind(this));
  document.body.addEventListener('mouseout', this.outAction.bind(this));
};

reader.video.isAvailable = function(){
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
};

reader.video.overAction = function(e){
  if(e.target.nodeName !== 'IMG'){
    return;
  }
  var image = e.target;

  if(image.dataset['imageprocessed'] === "true") return;

  reader.video.isAvailable().then(function(available){
    if(!available) return;
    reader.video._overAction(image);
  });
};

reader.video._overAction = function(image){
  var src = image.src;

  image.dataset['imageprocessed'] = true;
  image.dataset['src'] = src;

  chrome.runtime.sendMessage({parse: "image", img: src}, function(response) {
    if(chrome.runtime.lastError){
      console.error(chrome.runtime.lastError);
      return;
    }
    if(response){
      image.src = response.img;
    }
  });
  if(chrome.runtime.lastError){
    console.error(chrome.runtime.lastError);
    return;
  }
};


reader.video.outAction = function(e){
  if(e.target.nodeName !== 'IMG'){
    return;
  }
  var image = e.target;

  if(image.dataset['imageprocessed'] !== "true") return;
  var src = image.dataset['src'];
  image.src = src;
  image.dataset['imageprocessed'] = null;
};

reader.video.init();