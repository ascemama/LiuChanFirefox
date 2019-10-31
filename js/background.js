'use strict';

const chromep = new ChromePromise();
const liuChan = new LiuChan();
const vocablists = new vocabLists();

// This gets fired when the extension's button is clicked
chrome.browserAction.onClicked.addListener(liuChan.toggleExtension.bind(liuChan));
chrome.tabs.onActivated.addListener(liuChan.onTabSelect.bind(liuChan));
chrome.windows.onFocusChanged.addListener(liuChan.onWindowChangeFocus.bind(liuChan));
//chrome.storage.onChanged.addListener(liuChan.onConfigChange.bind(liuChan));

// Fired when a message is sent from extension or content script
// basically this allows the extension's background to communicate with the
// content script that gets loaded on matching urls (as per the manifest)
chrome.runtime.onMessage.addListener(
    (request, sender, response) => {
	switch(request.type) {
	case 'enable?':
            //chrome.tabs.sendMessage(sender.tab.id, {"type":"config", "config": liuChan.config.content});
	    if (request.enabled === false && liuChan.enabled) liuChan.onTabSelect(sender.tab);
	    break;
	case 'xsearch':
	    let e = liuChan.dict.wordSearch(liuChan.dict.hanzi, request.text);
	    response(e);
	    break;
        case 'makehtml':
	    let html = liuChan.dict.makeHtml(request.entry);
	    response(html);
	    break;
	case 'copyToClip':
            liuChan.copyToClip(sender.tab, request.entry);
	    break;
	case 'config':
	    // Immediately update settings upon change occuring
            liuChan.config = Object.assign(liuChan.config, request.config);
	    break;
	case 'toggleDefinition':
            liuChan.dict.noDefinition = !liuChan.dict.noDefinition;
	    break;
	case 'tts':
	    // mandarin: zh-CN, zh-TW cantonese: zh-HK
	    chrome.tts.speak(request.text,  {"lang": liuChan.config.ttsDialect,
					     "rate": liuChan.config.ttsSpeed});
	    break;
	case 'rebuild':
            liuChan.dict.loadDictionary();
	    break;
	case 'customstyling':
            response(liuChan.config.styling);
            break;
	case 'notepad':
	    if (request.query === 'load') {
                response(liuChan.config.notepad);
            } else {
                this.chrome.storage.local.set({notepad : request.query});
                liuChan.config.notepad = request.query;
	    }
		break;
	case 'updateContextMenu':
			vocablists.updateContextMenu(request.entry);
			response();
			break;
	case 'loadVocabList':
			return new Promise( resolve => {
			browser.storage.local.get().then(res => {
				console.log("background.js:loadVocabList event received");
				var e={'text':''};
				//list is empty, no download
				if (res.list !== undefined) {
					//e.text = JSON.stringify(res.list, null, 2).replace(/\[|\]|,|"/g, "").replace(" ", "");
					e.text = JSON.stringify(res.list, null, 2).replace(/\[|\]|,|"/g, "").trim();
				}
				else {
					console.log("no list to display")
				}
				console.log("loadVocabList.text:"+e.text);
				//vocabLists.showStorageContent();
				//response(e);
				resolve(e);
			});
		});
			break;
		case 'storeVocabList':
			return new Promise( resolve => {
			var	list=vocabLists.stringToJsonForStorage(request.content);
				vocabLists.storeVocabList(list)
				return resolve();
			})
	default:
	    console.log('Background received unknown request: ', request);
	}
    });
