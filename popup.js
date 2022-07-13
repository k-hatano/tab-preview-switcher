
let gTabImages = {};
let gJpegQuality = 32;
let gImageDepth = 1;
let gColumns = 3;
let gBackgroundColor = 'gray';
let gDraggingTab = undefined;
let gDraggingIndex = undefined;
let gDragged = false;

let gSelectedIndex = -1;
let gMarkedIndex = -1;

window.onkeydown = event => {
	let tabsNum = 0;
	let tabs = elementById('content_all').getElementsByClassName('tab');
	for (let i = 0; i < tabs.length; i++) {
		if (tabs[i].className.indexOf('hidden') < 0) {
			tabsNum++;
		}
	}

	if (event.keyCode == 37) { // left
		if (gMarkedIndex == -1) {
			gMarkedIndex = gSelectedIndex;
		}
		gMarkedIndex--;
		if (gMarkedIndex < 0) {
			gMarkedIndex = tabsNum - 1;
		}
		updateTabMark();
		event.preventDefault();
	} else if (event.keyCode == 39) { // right
		if (gMarkedIndex == -1) {
			gMarkedIndex = gSelectedIndex;
		}
		gMarkedIndex++;
		if (gMarkedIndex >= tabsNum) {
			gMarkedIndex = 0;
		}
		updateTabMark();
		event.preventDefault();
	} else if (event.keyCode == 38) { // up
		if (gMarkedIndex == -1) {
			gMarkedIndex = gSelectedIndex;
		}
		moveTabMarkVertically(-1);
		updateTabMark();
		event.preventDefault();
	} else if (event.keyCode == 40) { // down
		if (gMarkedIndex == -1) {
			gMarkedIndex = gSelectedIndex;
		}
		moveTabMarkVertically(1);
		updateTabMark();
		event.preventDefault();
	} else if (event.keyCode == 27) { // esc
		if (gMarkedIndex >= 0) {
			gMarkedIndex = -1;
			updateTabMark();
			event.preventDefault();
		}
	} else if (event.keyCode == 36) { // home
		moveTabMarkToFirst();
		updateTabMark();
		event.preventDefault();
	} else if (event.keyCode == 35) { // end
		moveTabMarkToLast();
		updateTabMark();
		event.preventDefault();
	} else if (event.keyCode == 32 || event.keyCode == 13) { // space or enter
		if (gMarkedIndex >= 0) {
			activateMarkedTab();
			event.preventDefault();
		}
	}
};

function getTabElement(aTab, template, currentWindow, isSelected) {
	let tabElement = template.cloneNode(true);
	let idsString = aTab.windowId + '_' + aTab.id;
	if (aTab.windowId == currentWindow.id) {
		tabElement.setAttribute('name', 'tab_' + idsString);
	} else {
		tabElement.setAttribute('name', 'other_tab_' + idsString);
	}
	if (aTab.favIconUrl == undefined ||aTab.favIconUrl.length == 0) {
		firstClass(tabElement, 'tab_favicon').setAttribute('src', chrome.runtime.getURL('whitepaper.png'));
	} else {
		firstClass(tabElement, 'tab_favicon').setAttribute('src', aTab.favIconUrl);
	}
	firstClass(tabElement, 'tab_thumbnail').setAttribute('id', 'thumbnail_' + aTab.windowId + '_' + aTab.id);
	if (gTabImages['' + aTab.windowId + '_' + aTab.id] != undefined) {
		firstClass(tabElement, 'tab_thumbnail').setAttribute('src', gTabImages['' + aTab.windowId + '_' + aTab.id]);
	} else {
		
	}
	firstClass(tabElement, 'tab_title_span').innerText = aTab.title;
	firstClass(tabElement, 'tab_title_span').setAttribute('title', aTab.title + "\n" + aTab.url);
	firstClass(tabElement, 'tab_close').setAttribute('id', 'close_' + idsString);
	firstClass(tabElement, 'tab_close').setAttribute('title', chrome.i18n.getMessage("close"));
	tabElement.setAttribute('id', 'tab_' + idsString);
	firstClass(tabElement, 'tab_cover').setAttribute('id', 'cover_' + idsString);
	if (isSelected) {
		firstClass(tabElement, 'tab_cover').setAttribute('class', 'tab_cover selected');
	}
	firstClass(tabElement, 'tab_clickable').setAttribute('id', 'clickable_' + idsString);
	firstClass(tabElement, 'tab_pin').setAttribute('id', 'pin_' + idsString);
	firstClass(tabElement, 'tab_pin').setAttribute('title', chrome.i18n.getMessage("pinnedTab"));
	if (aTab.pinned == false) {
		firstClass(tabElement, 'tab_pin').setAttribute('class', 'tab_pin hidden');
	}
	return tabElement;
}

function generateTabsInWindow(tabs, currentWindow) {
	let template = elementById('tab_template');

	for (let i = 0; i < tabs.length; i++) {
		let isSelected = false;
		if (tabs[i].windowId == currentWindow.id && tabs[i].selected) {
			isSelected = true;
			gSelectedIndex = i;
		}
		
		let tabElement = undefined;
		tabElement = getTabElement(tabs[i], template, currentWindow, isSelected);

		if (tabs[i].windowId == currentWindow.id) {
			elementById('content').innerHTML += tabElement.outerHTML;
		} else {
			elementById('separator').setAttribute('class', '');
			elementById('content_others').setAttribute('class', '');
			elementById('content_others').innerHTML += tabElement.outerHTML;
		}
	}

	// 現在のウィンドウに対しては、「新しいタブ」を表示
	if (tabs[0].windowId == currentWindow.id) {
		let newTabElement = template.cloneNode(true);
		newTabElement.setAttribute('class','tab new_tab');
		newTabElement.setAttribute('name', 'new_tab');
		newTabElement.setAttribute('id','new_tab');
		firstClass(newTabElement, 'tab_favicon').setAttribute('class', 'tab_favicon hidden');
		firstClass(newTabElement, 'tab_thumbnail').setAttribute('class', 'tab_thumbnail hidden');
		firstClass(newTabElement, 'tab_title_span').setAttribute('class', 'tab_title_span hidden');
		firstClass(newTabElement, 'tab_close').setAttribute('id', 'tab_title_span hidden');
		firstClass(newTabElement, 'tab_cover').innerText = '+';
		firstClass(newTabElement, 'tab_cover').setAttribute('title', chrome.i18n.getMessage("newTab"));
		elementById('content').innerHTML += newTabElement.outerHTML;
	}

	window.scrollTo(0, 192 * Math.floor(gSelectedIndex / gColumns) - 192);
}

function updateTabGroups(tabs) {
	for (let i = 0; i < tabs.length; i++) {
		let idsString = tabs[i].windowId + '_' + tabs[i].id;
		if (tabs[i].groupId >= 0) {
			let tabElement = elementById('tab_' + idsString);
			if (tabElement != undefined) {
				chrome.tabGroups.get(tabs[i].groupId, tabGroup => {
					firstClass(elementById('tab_' + idsString), 'tab_group_name').innerText = tabGroup.title;
					firstClass(elementById('tab_' + idsString), 'tab_group').setAttribute('style', 'background: ' + tabGroup.color);
					firstClass(elementById('tab_' + idsString), 'tab_group_cover').setAttribute('class', 'tab_group_cover');
					firstClass(elementById('tab_' + idsString), 'tab_group_name').setAttribute('class', 'tab_group_name');
					firstClass(elementById('tab_' + idsString), 'tab_group').setAttribute('class', 'tab_group');
				});
			}
		} else {
			let tabElement = elementById('tab_' + idsString);
			if (tabElement != undefined) {
				firstClass(tabElement, 'tab_group_cover').setAttribute('class', 'tab_group_cover hidden');
				firstClass(tabElement, 'tab_group').setAttribute('class', 'tab_group hidden');
				firstClass(tabElement, 'tab_group_name').setAttribute('class', 'tab_group_name hidden');
			}
		}
	}
}

function addListenersToTabs(window, tabs) {
	for (let i = 0; i < tabs.length; i++) {
		let idsString = tabs[i].windowId + '_' + tabs[i].id;

		let tabElement = elementById('tab_' + idsString);
		elementById('tab_' + idsString).addEventListener('mouseenter', tabEntered);
		elementById('tab_' + idsString).addEventListener('mouseleave', tabLeaved);

		if (elementById('clickable_' + idsString) != null) {
			elementById('clickable_' + idsString).addEventListener('click', tabClicked);

			if (window.id == tabs[i].windowId) {
				elementById('clickable_' + idsString).addEventListener('mousedown', tabPressed);
				elementById('clickable_' + idsString).addEventListener('mouseup', tabReleased);
				elementById('clickable_' + idsString).addEventListener('mousemove', tabMoved);
				elementById('clickable_' + idsString).addEventListener('mouseleave', tabOut);
			}
		}

		if (elementById('pin_' + idsString) != null) {
			drawPin(elementById('pin_' + idsString), window.id == tabs[i].windowId && tabs[i].selected);
		}

		if (elementById('close_' + idsString) != null) {
			elementById('close_' + idsString).addEventListener('click', closeTabClicked);
			elementById('close_' + idsString).addEventListener('mouseenter', closeTabEntered);
			elementById('close_' + idsString).addEventListener('mouseleave', closeTabLeaved);
		}
	}
	if (elementById('new_tab') != null) {
		elementById('new_tab').addEventListener('mouseenter', newTabEntered);
		elementById('new_tab').addEventListener('mouseleave', newTabLeaved);
		elementById('new_tab').addEventListener('click', newTabClicked);
	}
}

window.onload = _ => {
	initialize();
};

window.onblur = _ => {
	// getSaveTabImagesPromise();
};

function initialize() {
	elementById('bottom_button_options').addEventListener('click', openOptionsPage);
	elementById('content').innerHTML = '';
	elementById('content_others').innerHTML = '';

	getUpdateSettingsPromise().then(_ => {
		localizeMessages();

		elementById('body').style.width = parseInt(gColumns * 192) + 'px';
		elementById('separator').style.width = parseInt(gColumns * 192 - 32) + 'px';
		elementById('bottom_padding').style.width = parseInt(gColumns * 192) + 'px';
		elementById('bottom_button_div').style.width = parseInt(gColumns * 192 - 12) + 'px';

		elementById('body').style.background = gBackgroundColor;

		chrome.windows.getCurrent(null, currentWindow => {
			chrome.tabs.query({}, tabs => {
				generateTabsInWindow(tabs, currentWindow);
				addListenersToTabs(currentWindow, tabs);
				updateTabGroups(tabs);
			});
		});
		getUpdateCurrentTabPromise();
		// getRestoreTabImagesPromise();
	});
}

function updateTabMark() {
	let tabs = new Array();

	let ownedTabs = elementById('content').getElementsByClassName('tab');
	for (let i = 0; i < ownedTabs.length; i++) {
		if (ownedTabs[i].className.indexOf('hidden') >= 0) {
			continue;
		}
		tabs.push(ownedTabs[i]);
	}
	while (tabs.length % gColumns != 0) {
		tabs.push(undefined);
	}

	let otherTabs = elementById('content_others').getElementsByClassName('tab');
	for (let i = 0; i < otherTabs.length; i++) {
		if (otherTabs[i].className.indexOf('hidden') >= 0) {
			continue;
		}
		tabs.push(otherTabs[i]);
	}

	let j = 0;
	for (let i = 0; i < tabs.length; i++) {
		if (tabs[i] == undefined) {
			continue;
		}
		let originalClass = tabs[i].getAttribute('class');
		if (j == gMarkedIndex && originalClass.indexOf("highlighted") < 0) {
			tabs[i].setAttribute('class', originalClass + ' highlighted');
			addClass(tabs[i], 'highlighted');
			if (tabs[i].getAttribute('name').indexOf('other') >= 0) {
				window.scrollTo(0, 192 * Math.floor(i / gColumns) - 192 + 56);
			} else {
				window.scrollTo(0, 192 * Math.floor(i / gColumns) - 192);
			}
		} else if (j != gMarkedIndex && originalClass.indexOf("highlighted") >= 0) {
			tabs[i].setAttribute('class', originalClass.replace('highlighted', ''));
			removeClass(tabs[i], 'highlighted');
		}
		j++;
	}
}

function moveTabMarkVertically(delta) {
	let virtualTabs = new Array();
	let realTabs = new Array();

	let ownedTabs = elementById('content').getElementsByClassName('tab');
	for (let i = 0; i < ownedTabs.length; i++) {
		if (ownedTabs[i].className.indexOf('hidden') >= 0) { // 閉じられたタブは含めない
			continue;
		}

		virtualTabs.push(ownedTabs[i]);
		realTabs.push(ownedTabs[i]);
	}
	while (virtualTabs.length % gColumns != 0) {
		// 要素数がgColumnsの倍数になるようにundefinedを挿入する（オーバーヘッドが大きい気がする・・・）
		virtualTabs.push(undefined);
	}

	let otherTabs = elementById('content_others').getElementsByClassName('tab');
	for (let i = 0; i < otherTabs.length; i++) {
		if (otherTabs[i].className.indexOf('hidden') >= 0) { // 閉じられたタブは含めない
			continue;
		}
		virtualTabs.push(otherTabs[i]);
		realTabs.push(otherTabs[i]);
	}

	let virtualIndex = 0;
	for (virtualIndex = 0; virtualIndex < virtualTabs.length; virtualIndex++) {
		if (virtualTabs[virtualIndex] == realTabs[gMarkedIndex]) {
			break;
		}
	}

	do {
		virtualIndex += delta * gColumns;
	} while (virtualTabs[virtualIndex] == undefined && virtualIndex >= 0 && virtualIndex < virtualTabs.length);

	if (virtualIndex < 0) {
		virtualIndex = 0;
	}
	if (virtualIndex >= virtualTabs.length) {
		virtualIndex = virtualTabs.length - 1;
	}
	while (virtualTabs[virtualIndex] == undefined) {
		virtualIndex--;
	}

	for (gMarkedIndex = 0; gMarkedIndex < realTabs.length; gMarkedIndex++) {
		if (realTabs[gMarkedIndex] == virtualTabs[virtualIndex]) {
			break;
		}
	}
}

function moveTabMarkToFirst() {
	gMarkedIndex = 0;
}

function moveTabMarkToLast() {
	let ownedTabs = elementById('content').getElementsByClassName('tab');
	let otherTabs = elementById('content_others').getElementsByClassName('tab');
	gMarkedIndex = ownedTabs.length + otherTabs.length - 1;
}

function activateMarkedTab() {
	let tabs = elementById('content_all').getElementsByClassName('tab');
	if (gMarkedIndex == -1) {
		gMarkedIndex = gSelectedIndex;
	}
	let highlightedTabName = tabs[gMarkedIndex].getAttribute('name');
	if (highlightedTabName == 'new_tab') {
		createNewTab();
	} else {
		let idSet = windowTabId(highlightedTabName, 'tab');
		activateTab(idSet.windowId, idSet.tabId);
		window.close();
	}
}

function elementById(elementId) {
	return document.getElementById(elementId);
}

function firstClass(elements, className) {
	return elements.getElementsByClassName(className)[0];
}

function requestTabImages(override) {
	chrome.runtime.sendMessage({name: "requestTabImages"}, response => {
		tabImagesUpdated(response.tabImages, override);
	});
}

function updateCurrentTab() {
	chrome.runtime.sendMessage({name: "updateCurrentTab"}, response => {
		tabImagesUpdated(response.tabImages, true);
	});
}

function getSaveTabImagesPromise() {
	return new Promise((fulfill, neglect) => {
		chrome.storage.local.set({
			tabImages: gTabImages
		}, _ => {
			fulfill();
		});
	});
}

function getRestoreTabImagesPromise() {
	return new Promise((fulfill, neglect) => {
		chrome.storage.local.get(['tabImages'], items => {
			try {
				let responseTabImages = items.tabImages;
				for (let k = 0; k < Object.keys(responseTabImages).length; k++) {
					let key = Object.keys(responseTabImages)[k]; // windowId
					let value = Object.values(responseTabImages)[k];

					if (value != undefined && gTabImages[key] == undefined) {
						gTabImages[key] = value;
					}
				}
				fulfill();
			} catch (error) {
				neglect();
			}
		});
	});
}

function getUpdateCurrentTabPromise() {
	return new Promise((fulfill, neglect) => {
		updateCurrentTab();
		fulfill();
	});
}


function getRequestTabImagesPromise(override) {
	return new Promise((fulfill, neglect) => {
		requestTabImages(override);
		fulfill();
	});
}

function tabImagesUpdated(tabImages, override) {
	let responseTabImages = tabImages;
	for (let k = 0; k < Object.keys(responseTabImages).length; k++) {
		let kKey = Object.keys(responseTabImages)[k]; // windowId
		let kValue = Object.values(responseTabImages)[k];
		for (let j = 0; j < Object.keys(kValue).length; j++) {
			let key = Object.keys(kValue)[j]; // tabId
			let value = Object.values(kValue)[j];

			if (value == null) {
				continue;
			}

			if (kKey != null && key != null && elementById('thumbnail_' + kKey + '_' + key) != null) {
				let element = elementById('thumbnail_' + kKey + '_' + key);
				if (override == false && element.getAttribute('src') != undefined) {
					// オーバーライドしない指定で、すでにサムネイル画像があればスキップ
					continue;
				}

				let newKey = kKey + "_" + key;
				if (gTabImages[newKey] != undefined && override == false) {
					// オーバーライドしない指定で、すでに読み込み済みのサムネイルがあればそれを指定
					element.setAttribute('src', gTabImages[newKey]);
				} else {
					if (value != undefined && value != 'null' && value != 'undefined' && value != '') {
						gTabImages[newKey] = new String(value);
						element.setAttribute('src', gTabImages[newKey]);
					}
				}
			}
		}
	}
}

function localizeMessages() {
	let localizables = Array.from(document.getElementsByClassName('localizable'));

	localizables.forEach(anElement => {
		anElement.innerText = chrome.i18n.getMessage(anElement.innerText);
	});
}

chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.name == "tabImagesUpdated") {
			tabImagesUpdated(request.tabImages, false);
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function windowTabId(elementId, elementKind) {
	let regexString = elementKind + '_([0-9]+)_([0-9]+)';
	let matches = elementId.match(new RegExp(regexString));
	return {
		windowId: parseInt(matches[1]),
		tabId: parseInt(matches[2])
	}
}

function tabClicked(event) {
	if (gDragged) {
		return;
	}
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	activateTab(idSet.windowId, idSet.tabId);
	window.close();
}

function tabPressed(event) {
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	gDraggingTab = idSet.windowId + '_' + idSet.tabId;

	let x = Math.floor(event.pageX / 184);
	let y = Math.floor(event.pageY / 184);
	gDraggingIndex = newIndex = x + y * gColumns;
	gDragged = false;

	addClass(event.currentTarget, 'dragging');
	addClass(tab, 'dragging');
}

function tabReleased(event) {
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	gDraggingTab = undefined;
	removeClass(event.currentTarget, 'dragging');
	removeClass(tab, 'dragging');

	if (gDragged) {
		chrome.tabs.query({}, tabs => {
			updateTabGroups(tabs);
		});
	}
}

function tabOut(evet) {
	if (gDragged) {
		let idSet = windowTabId(event.currentTarget.id, 'clickable');
		let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
		gDraggingTab = undefined;
		removeClass(event.currentTarget, 'dragging');
		removeClass(tab, 'dragging');
		
		chrome.tabs.query({}, tabs => {
			updateTabGroups(tabs);
		});
	}
}

function tabMoved(event) {
	if (gDraggingTab == undefined) {
		return;
	}
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	if (gDraggingTab != idSet.windowId + '_' + idSet.tabId) {
		return;
	}
	let x = Math.floor(event.pageX / 184);
	let y = Math.floor(event.pageY / 184);
	let newIndex = x + y * gColumns;
	
	if (newIndex != gDraggingIndex) {
		chrome.tabs.move(idSet.tabId, {index: newIndex}, movedTab => {
			let newIndex = movedTab.index;
			let movingTab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
			let destinationTab;
			if (gDraggingIndex < newIndex) {
				destinationTab = elementById('content').children[newIndex + 1];
			} else {
				destinationTab = elementById('content').children[newIndex];
			}
			destinationTab.before(movingTab);
			
			gDraggingIndex = newIndex;
			gDragged = true;
		});
	}
}

function closeTabClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'close');
	closeTab(idSet.windowId, idSet.tabId);

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	addClass(tab, 'hidden');
}

function tabEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	addClass(tab, 'entered');
	addClass(firstClass(tab, 'tab_title'), 'entered');
	removeClass(firstClass(tab, 'tab_close'), 'hidden');
}

function tabLeaved(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	removeClass(tab, 'entered');
	removeClass(firstClass(tab, 'tab_title'), 'entered');
	addClass(firstClass(tab, 'tab_close'), 'hidden');
}

function newTabEntered(event) {
	let tab = elementById('new_tab');
	addClass(tab, 'entered');
}

function newTabLeaved(event) {
	let tab = elementById('new_tab');
	removeClass(tab, 'entered');
}

function closeTabEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'close');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	firstClass(tab, 'tab_close').setAttribute('class', 'tab_close entered');
}

function closeTabLeaved(event) {
	let idSet = windowTabId(event.currentTarget.id, 'close');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	firstClass(tab, 'tab_close').setAttribute('class', 'tab_close');
}

function activateTab(windowId, tabId) {
	chrome.windows.update(windowId, {focused: true}, ignore => {});
	chrome.tabs.update(tabId, {active: true}, ignore => {});
}

function closeTab(windowId, tabId) {
	chrome.tabs.remove(tabId, ignore => {});
}

function newTabClicked(event) {
	createNewTab();
}

function createNewTab() {
	chrome.tabs.create({active: true}, ignore => {});
}

function openOptionsPage() {
	chrome.runtime.openOptionsPage();
}

function drawPin(target, selected) {
	let width = 24;
	let height = 24;

	let ctx = target.getContext('2d');
	ctx.clearRect(0, 0, width, height);

	ctx.shadowBlur = 2;
	ctx.shadowColor = "#0004";
	ctx.shadowOffsetX = 2;
	ctx.shadowOffsetY = 2;

	ctx.fillStyle = selected ? "#222" : "#444";
	ctx.beginPath();
	ctx.arc(width / 2, height / 2, width * 1 / 3, 0, Math.PI * 2, true);
	ctx.fill();
}

function addClass(anElement, aClass) {
	let newClass = anElement.getAttribute('class') + ' ' + aClass;
	anElement.setAttribute('class', newClass);
}

function removeClass(anElement, aClass) {
	let newClass = anElement.getAttribute('class').replace(aClass, '');
	anElement.setAttribute('class', newClass);
}

function getUpdateSettingsPromise() {
	return new Promise((fulfill, neglect) => {
		chrome.storage.sync.get({
			quality: 1, // low
			columns: 3,
			backgroundColor: 'gray'
		}, items => {
		    gImageDepth = parseInt(items.quality);
		    gColumns = parseInt(items.columns);
		    gBackgroundColor = items.backgroundColor;
		    fulfill();
		});
	});
}

