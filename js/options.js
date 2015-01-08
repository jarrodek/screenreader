var reader = reader || {};

reader.options = reader.options || {};

reader.options.init = function(){


  reader.options._prepareUI()
    .then(reader.options._restoreValues)
    .then(reader.options._updateUI)
    .then(reader.options._listen);
};
reader.options._restoreValues = function(){
  return new Promise(function (resolve, reject) {
    chrome.runtime.getBackgroundPage(function(bg){
      bg.reader.app.getSpeakOptions().then(function(opts){
        resolve(opts);
      }).catch(reject);
    });
  });
};
reader.options._prepareUI = function(){
  return new Promise(function (resolve, reject) {
    chrome.tts.getVoices(function(voices){

      var languages = new Set()

      for (var i = 0, len = voices.length, hl=null; i < len; i++) {
        hl = voices[i].lang;
        if(!languages.has(hl))
          languages.add(hl);
      }

      var fr = document.createDocumentFragment();
      for(var hl of languages){
        var opt = document.createElement('option');
        opt.value = hl;
        opt.text = hl;
        fr.appendChild(opt);
      }

      var sel = document.querySelector('#lang');
      sel.children[0].parentNode.removeChild(sel.children[0]);
      sel.appendChild(fr.cloneNode(true));

      resolve();
    });
  });
}
reader.options._updateUI = function(opts){
  if(!opts){
    //TODO: error
    console.error('No options!');
    return;
  }
  console.log(opts);
  var gen = document.querySelector('#gender');
  for(var i=0, l=gen.children.length, opt; i<l; i++){
    opt = gen.children[i];
    if(opt.value === opts.gender){
      opt.setAttribute('selected', 'true');
      break;
    }
  }
  var lan = document.querySelector('#lang');
  for(var i=0, l=lan.children.length, opt; i<l; i++){
    opt = lan.children[i];
    if(opt.value === opts.lang){
      opt.setAttribute('selected', 'true');
      break;
    }
  }

  var rat = document.querySelector('#rate');
  rat.value = opts.rate;
  var pit = document.querySelector('#pitch');
  pit.value = opts.pitch;

};
reader.options._listen = function(){
  document.querySelector('#form').addEventListener('click', reader.options._valueChanged);

  document.querySelector('.play-button').addEventListener('click', function(){
    var value = document.querySelector('#test').value;
    if(!value.trim()) return;
    chrome.runtime.getBackgroundPage(function(bg){
      bg.reader.app.stopSpeaking();
      bg.reader.app.speak(value);
    });
  });


}
reader.options._valueChanged = function(e){
  var target = e.target;
  switch(target.id){
    case 'gender':
    case 'lang':
    case 'rate':
    case 'pitch':
      reader.options._saveOption(target.id, target.value);
      break;
  }
};

reader.options._saveOption = function(key, value){
  var save = {};
  save[key] = value;
  chrome.storage.sync.set(save, function (data) {
    console.log('saved', save);
  })
}

reader.options.init();