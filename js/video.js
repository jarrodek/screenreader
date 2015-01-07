
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
    
    this.shown = false;
}
AudioSpeaker.prototype = {
    loopID: null,
    center: [100,100],
    show: function(){
        if( this.shown ) return;
        var context = this;
        this.scale = 1;
        this.time = 0;
        this.img = new Image();
        this.img.src = chrome.extension.getURL('img/player-volume-2.png');
        this.img.onload = function(){
            context.container.classList.remove("hidden");
            context.shown = true;
            context.loopID = window.setInterval( function(){
                context.loop.apply(context)
            } , 40);
        }
    },
    hide: function(){
        this.container.classList.add("hidden");
        this.shown = false;
        window.clearInterval(this.loopID);
    },
    loop: function(){
        this.step();
        this.draw();
    },
    step: function(){
        this.scale = ((Math.sin( this.time/3 ) + 1 )/8)+.75;
        this.time++;
    },
    draw: function(){
        this.ctx.clearRect(0,0,144,148);
        this.ctx.save();
        this.ctx.translate(74, 78);
        this.ctx.scale(this.scale,this.scale);
        this.ctx.drawImage(this.img,0,0,144,148, -74, -78,144,148);
        this.ctx.restore();
    }
}
jQuery(document).ready(function(){
    
    $("img", document.body).live('mouseover', function(e){
        var context = this;
        chrome.extension.sendRequest({
            message: "isactive"
        }, function(response) {
            
            if (!response.active){
                return;
            }
            var src = $(context).attr('src');
            var image = context;
            chrome.extension.sendRequest({
                img: src,
                message:'parse'
            }, function(response) {
                image.src = response.data;
                $(image).mouseleave(function(){
                    this.src = src;
                    $(this).unbind('ouseleave');
                });
            });
        });
        
    });
});