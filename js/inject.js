/*
 * **************************************************************************************
 *
 * Dateiname:                 inject.js
 * Projekt:                   foe
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * zu letzt bearbeitet:       20.11.19, 17:07 Uhr
 *
 * Copyright © 2019
 *
 * **************************************************************************************
 */

let ant = document.createElement('script'),
	v = browser.runtime.getManifest().version;

ant.src = browser.extension.getURL('js/web/ant.js?v=' + v);
ant.id = 'ant-script';

ant.onload = function(){
	this.remove();
};


function checkForDOM() {
	if (document.body && document.head) {
		document.head.prepend(ant);
	} else {
		requestIdleCallback(checkForDOM);
	}
}
requestIdleCallback(checkForDOM);



let tid = setInterval(InjectCSS, 0),
	PossibleLangs = ['de','en','fr'],
	lng = browser.i18n.getUILanguage(),
	uLng = localStorage.getItem('user-language');


// wir brauchen nur den ersten Teil
if(lng.indexOf('-') > 0)
{
	lng = lng.split('-')[0];
}

// gibt es eine Übersetzung?
if(PossibleLangs.includes(lng) === false)
{
	lng = 'en';
}

if(uLng !== null){
	lng = uLng;
}

let i18nJS = document.createElement('script');
i18nJS.src = browser.extension.getURL('js/web/i18n/' + lng + '.js?v=' + v);
i18nJS.id = 'i18n-script';
i18nJS.onload = function(){
	this.remove();
};
(document.head || document.documentElement).appendChild(i18nJS);

// prüfen ob jQuery im DOM geladen wurde
function checkForjQuery(){
	if (typeof jQuery === undefined){
		requestIdleCallback(checkForjQuery);
	} else {
		InjectCode();
	}
}
requestIdleCallback(checkForjQuery);

function InjectCSS()
{
	// Dokument geladen
	if(document.head !== null){

		let script = document.createElement('script');

		script.innerText = "let extID='"+ browser.runtime.id + "',GuiLng='" + lng + "',devMode=" + !('update_url' in browser.runtime.getManifest()) + ";";
		document.head.appendChild(script);

		let cssFiles = [
			'goods',
			'style-menu',
			'boxes'
		];

		// Stylesheet einfügen
		for(let i in cssFiles)
		{
			if(!cssFiles.hasOwnProperty(i)) {
				break;
			}

			let css = document.createElement('link');
			css.href = browser.extension.getURL('css/web/' + cssFiles[i] + '.css?v=' + v);
			css.rel = 'stylesheet';
			document.head.appendChild(css);
		}

		clearInterval(tid);
	}
}

function InjectCode()
{
	let extURL = browser.extension.getURL(''),
		vendorScripts = [
		'moment/moment-with-locales.min',
		'CountUp/jquery.easy_number_animate.min',
		'clipboard/clipboard.min',
		'Tabslet/jquery.tabslet.min',
		'ScrollTo/jquery.scrollTo.min',
		'jQuery/jquery-resizable.min',
		'tooltip/tooltip',
		'tableSorter/table-sorter',
		'jedParser/jedParser'
	];

	for (let vs in vendorScripts) {
		if (vendorScripts.hasOwnProperty(vs)) {
			let sc = document.createElement('script');
			sc.src = extURL + 'vendor/' + vendorScripts[vs] + '.js?v=' + v;
			sc.onload = function () {
				//this.remove();
			};
			(document.head || document.documentElement).appendChild(sc);
		}
	}


	let s = [
		'helper',
		'menu',
		'tavern',
		'outposts',
		'calculator',
		'infoboard',
		'productions',
        'part-calc',
        'unit',
		'notes',
        'technologies',
        'negotiation',
		'read-buildings',
		'settings',
		'strategy-points',
		'citymap'
	];

	// Scripte laden
	for (let i in s) {
		if (s.hasOwnProperty(i)) {
			let sc = document.createElement('script');
			sc.src = extURL + 'js/web/' + s[i] + '.js?v=' + v;
			sc.onload = function () {
				//this.remove();
			};
			(document.head || document.documentElement).appendChild(sc);
		}
	}
}

