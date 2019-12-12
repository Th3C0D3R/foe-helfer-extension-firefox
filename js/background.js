/*
 * **************************************************************************************
 *
 * Dateiname:                 background.js
 * Projekt:                   foe
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * zu letzt bearbeitet:       19.11.19, 09:44 Uhr
 *
 * Copyright © 2019
 *
 * **************************************************************************************
 */

browser.runtime.onInstalled.addListener(() => {
	let version = browser.runtime.getManifest().version;

	browser.tabs.query({active: true, currentWindow: true}, (tabs)=> {
		// sind wir in FoE?
		if(tabs[0].url.indexOf('forgeofempires.com/game/index') > -1){

			// ja? dann neu laden
			if(!isDevMode()){
				browser.tabs.reload(tabs[0].id);
			}
		}
	});

	if(!isDevMode()){

		// Sprache ermitteln
		let lng = browser.i18n.getUILanguage();

		// is ein "-" drin? ==> en-en, en-us, en-gb usw...
		if(lng.indexOf('-') > -1){
			lng = lng.split('-')[0];
		}

		// Fallback auf "en"
		if(lng !== 'de' && lng !== 'en'){
			lng = 'en';
		}

		browser.tabs.create({
			url: 'https://foe-rechner.de/extension/chrome?v=' + version + '&lang=' + lng
		});
	}
});


/**
 * Sind wir im DevMode?
 *
 * @returns {boolean}
 */
function isDevMode()
{
	return !('update_url' in browser.runtime.getManifest());
}


let popupWindowId = 0;

/**
 * Auf einen response von ant.js lauschen
 */
browser.runtime.onMessageExternal.addListener((request) => {

	if (request.type === 'message') {
		let t = request.time,
			opt = {
				type: "basic",
				title: request.title,
				message: request.msg,
				iconUrl: "images/app48.png"
			};

		// Desktop Meldung zusammen setzen
		browser.notifications.create('', opt, (id)=> {

			// nach definiertem Timeout automatisch entfernen
			setTimeout(()=> {browser.notifications.clear(id)}, t);
		});

	} else if(request.type === 'chat'){

		let url = 'content/chat.html?player=' + request.player + '&guild=' + request.guild + '&world=' + request.world,
			popupUrl = browser.runtime.getURL(url);

		// Prüfen ob ein PopUp mit dieser URL bereits existiert
		browser.tabs.query({url:popupUrl}, (tab)=>{

			// nur öffnen wenn noch nicht passiert
			if(tab.length < 1){

				let o = {
					url: url,
					type: 'popup',
					width: 500,
					height: 520,
					focused: true
				};

				// Popup erzeugen
				let id = browser.windows.create(o, (win)=> {
					popupWindowId = win.id;
				});

			// gibt es schon, nach "vorn" holen
			} else {
				browser.windows.update(popupWindowId, {
					focused:true
				});
			}
		});

	} else if(request.type === 'storeData'){
		browser.storage.local.set({ [request.key] : request.data });

	} else if(request.type === 'send2Api') {
		let xhr = new XMLHttpRequest();

		xhr.open('POST', request.url);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send(request.data);
	}
});
