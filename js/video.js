
function AudioSpeaker(){
    var d = document, b = d.querySelector("body");
    this.container = d.createElement("div");
    this.container.setAttribute("id", "speaker-container");
    this.container.classList.add("hidden");
    var canvas = d.createElement("canvas");
    canvas.setAttribute("id", "audio-speeker");
    canvas.width = 144;
    canvas.height = 148;
    this.container.appendChild(canvas);
    b.appendChild(this.container);
    this.ctx = canvas.getContext("2d");
    this.center = [72,74];
    //this.shown = false;
    canvas.addEventListener('click', function(e){
      //cancel reading
      if(window.screenReader){
        window.screenReader.stop();
      }
    });
}
AudioSpeaker.prototype = {
  center: [100,100],
  _shown: false,

  set shown(state){
    this._shown = state;
    if(state){
      this.container.classList.remove("hidden");
    } else {
      this.container.classList.add("hidden");
    }
  },

  get shown(){
    return this._shown;
  },

  show: function(){
    if(this.shown) return;
    this.scale = 1;
    this.time = 0;
    this.img = new Image();
    this.img.src = chrome.extension.getURL('img/player-volume-2.png');
    this.img.addEventListener('load', function(){
      this.shown = true;
      window.requestAnimationFrame(this.loop.bind(this));
    }.bind(this));
  },
  hide: function(){
    this.shown = false;
  },
  loop: function(){
    this.step();
    this.draw();
  },
  step: function(){
    this.scale = ((Math.sin( this.time/6 ) + 1 )/8)+.65;
    this.time++;
  },
  draw: function(){
    this.ctx.clearRect(0,0,144,148);
    this.ctx.save();
    this.ctx.translate(74, 78);
    this.ctx.scale(this.scale,this.scale);
    this.ctx.drawImage(this.img,0,0,144,148, -74, -78,144,148);
    this.ctx.restore();
    if(this.shown)
      window.requestAnimationFrame(this.loop.bind(this));
  }
}


/**
 * The reader namespace
 */
var reader = reader || {};
reader.video = reader.video || {};
reader.video.init = function(){
  document.body.addEventListener('mouseover', this.overAction.bind(this));
  document.body.addEventListener('mouseout', this.outAction.bind(this));
};
reader.video.overAction = function(e){
  if(e.target.nodeName !== 'IMG'){
    return;
  }
  var image = e.target;

  if(image.dataset['imageprocessed'] === "true") return;

  var src = image.getAttribute('src');

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