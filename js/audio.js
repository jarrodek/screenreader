const TRANSLATE_URI = 'http://translate.google.com/translate_tts?ie=UTF-8&tl=en&q=';

function ScreenAudio() {

    this.msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    this.msg.voice = voices[0];
    this.msg.voiceURI = 'native';
    this.msg.volume = 1; // 0 to 1
    this.msg.rate = 1; // 0.1 to 10
    this.msg.pitch = 2; //0 to 2
    this.msg.lang = 'pl-PL';

    this.msg.addEventListener('end', function () {
        console.log('Finished in ' + event.elapsedTime + ' seconds.');
    }.bind(this));
    
    this.timeoutId = null;
    this.currentParagaph = null;
    this.currentSentence = 0;
    this.speaker = new AudioSpeaker();
}
ScreenAudio.prototype = {
    observe: function () {
        document.body.addEventListener('mouseover', this.overAction.bind(this));
    },
    overAction: function (e) {

        if (e.target) {
            this.doHover(e);
        }

//        return;
//        var context = this;
//        if (e.currentTarget === e.target) {
//            chrome.extension.sendRequest({
//                message: "isactive"
//            }, function (response) {
//                if (!response.active) {
//                    return;
//                }
//                context.doHover(e);
//            });
//        }
    },
    doHover: function (e) {
        var node = e.target;
        if (!node.classList.contains('screenreader-highlight')) {
            node.classList.add('screenreader-highlight');
            node.addEventListener('mouseout', this.removeHover.bind(this));
            node.addEventListener('click', this.clickNode.bind(this));
        }
    },
    removeHover: function (e) {
        var node = e.target;
        //node.classList.remove('screenreader-highlight');
        //node.removeEventListener('mouseout', this.removeHover.bind(this));
        //node.removeEventListener('click', this.clickNode.bind(this));
    },
    clickNode: function (e) {
        
        if(e.target !== e.currentTarget){
            return;
        }
        
        if(e.target.nodeName === 'BODY') return;
        
        this.stop();
        var node = e.target;
        if(!node.dataset['clicked']){
            node.dataset['clicked'] = true;
            e.preventDefault();
        }
        console.warn('click');
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
        
        this.currentParagaph = this.prepareText(txt);
        this.play();
    },
    
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
        //
        // It split all text paragraph to senteces array.
        // First find any decimals in text and replace "." to word "point"
        // eg: ... 9.4% become 9 point 4 %
        //
        var replace = '$1 point $2 ';
        var pattern = new RegExp(/(\d)+\.(\d+)\s?/gi);
        var fullMatch = txt.match(pattern);
        replace = replace.replace(/\$0/, fullMatch);
        txt = txt.replace(pattern, replace);

        //replace sentences end mark to [ENDSENT] tag to restore later
        txt = txt.replace(/\.\s/gim, '[ENDSENT] ');
        txt = txt.replace(/\.$/gim, '[ENDSENT]');

        //replace all special characters
        txt = txt.replace(/\./gim, ' dot ');
        txt = txt.replace(/,/gim, ' comma ');
        txt = txt.replace(/!/gim, ' exclamation mark ');
        txt = txt.replace(/\?/gim, ' question mark ');
        txt = txt.replace(/"/gim, ' quotation mark ');
        txt = txt.replace(/"/gim, ' quotation mark ');
        txt = txt.replace(/\$/gim, ' dollear ');
        txt = txt.replace(/£/gim, ' pound ');

        txt = txt.replace(/\s?\[ENDSENT\]/g, '.');

        //add spaces to alle shortcut eg FBI -> F B I
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
    /**
     * Stop playing any audio.
     */
    stop: function () {
        window.speechSynthesis.cancel();
        this.speaker.hide();
    },
    /**
     * Play audio from URL
     */
    play: function () {
        this.msg.text = this.currentParagaph;
        window.speechSynthesis.speak(this.msg);
        this.speaker.show();
    }
};

var audio = new ScreenAudio();
audio.observe();