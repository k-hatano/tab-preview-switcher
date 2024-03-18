
let gTabImages = {};
let gJpegQuality = 32;
let gImageDepth = 1;
let gColumns = 3;
let gBackgroundColor = 'gray';
let gDraggingTab = undefined;
let gDraggingIndex = undefined;
let gDragged = false;
let gCloseButtonsOnPinnedTabs = false;

let gSelectedIndex = -1;
let gMarkedIndex = -1;

// 生イベント

window.onload = _ => {
	initialize();
};

window.onblur = _ => {
	// getSaveTabImagesPromise();
};

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

function initialize() {
	elementById('bottom_button_options').addEventListener('click', openOptionsPage);
	elementById('content').innerHTML = '';
	elementById('content_others').innerHTML = '';

	getUpdateSettingsPromise().then(_ => {
		localizeMessages();
		elementById('loading').setAttribute('class', 'hidden');
		elementById('bottom_button_options').setAttribute('class', '');

		elementById('body').style.width = parseInt(gColumns * 192) + 'px';
		elementById('separator').style.width = parseInt(gColumns * 192 - 32) + 'px';
		elementById('bottom_padding').style.width = parseInt(gColumns * 192) + 'px';

		elementById('body').style.background = gBackgroundColor;

		getRestoreTabImagesPromise().then(getRequestUpdateCurrentTabPromise());
		chrome.windows.getCurrent(null, currentWindow => {
			chrome.tabs.query({}, tabs => {
				generateTabsInWindow(tabs, currentWindow);
				addListenersToTabs(currentWindow, tabs);
				updateTabGroups(tabs);
			});
		});
	});
}

// 要素生成系

function generateTabElement(aTab, template, currentWindow, isSelected) {
	let tabElement = template.cloneNode(true);
	let idsString = aTab.windowId + '_' + aTab.id;

	if (isSelected) {
		addClass(tabElement, 'selected');
	} else {
		removeClass(tabElement, 'selected');
	}

	if (aTab.windowId == currentWindow.id) {
		tabElement.setAttribute('name', 'tab_' + idsString);
	} else {
		tabElement.setAttribute('name', 'other_tab_' + idsString);
	}

	if (aTab.favIconUrl == undefined || aTab.favIconUrl.length == 0) {
		firstClass(tabElement, 'tab_favicon').setAttribute('src', chrome.runtime.getURL('whitepaper.png'));
	} else {
		firstClass(tabElement, 'tab_favicon').setAttribute('src', aTab.favIconUrl);
	}

	setAttributesToFirstClass(tabElement, 'tab_thumbnail', {
		id: 'thumbnail_' + idsString
	});
	
	if (gTabImages['' + aTab.windowId + '_' + aTab.id] != undefined) {
		setAttributesToFirstClass(tabElement, 'tab_thumbnail', {
			src: gTabImages[idsString]
		});
	}

	let tabTitleSpan = setAttributesToFirstClass(tabElement, 'tab_title_span', {
		id: 'tab_title_span_' + aTab.windowId + '_' + aTab.id,
		title: aTab.title + "\n" + aTab.url
	});
	tabTitleSpan.innerText = aTab.title;
	
	setAttributesToFirstClass(tabElement, 'tab_close', {
		id: 'close_' + idsString,
		title: chrome.i18n.getMessage("close")
	});

	setAttributesToFirstClass(tabElement, 'tab_group_add', {
		id: 'tab_group_add_' + idsString,
		title: chrome.i18n.getMessage("newTabInThisGroup")
	});

	setAttributesToFirstClass(tabElement, 'tab_group_ungroup', {
		id: 'tab_group_ungroup_' + idsString,
		title: chrome.i18n.getMessage("ungroup")
	});

	setAttributesToFirstClass(tabElement, 'tab_group_make', {
		id: 'tab_group_make_' + idsString,
		title: chrome.i18n.getMessage("newTabGroup")
	});

	setAttributesToFirstClass(tabElement, 'tab_group_left', {
		id: 'tab_group_left_' + idsString,
		title: chrome.i18n.getMessage("addThisTabToLeftGroup")
	});

	setAttributesToFirstClass(tabElement, 'tab_group_right', {
		id: 'tab_group_right_' + idsString,
		title: chrome.i18n.getMessage("addThisTabToRightGroup")
	});

	tabElement.setAttribute('id', 'tab_' + idsString);

	if (isSelected) {
		setAttributesToFirstClass(tabElement, 'tab_cover', {
			id: 'cover_' + idsString,
			class: 'tab_cover selected'
		});
	} else {
		setAttributesToFirstClass(tabElement, 'tab_cover', {
			id: 'cover_' + idsString
		});
	}

	setAttributesToFirstClass(tabElement, 'tab_clickable', {
		id: 'clickable_' + idsString
	});

	let tabPin = setAttributesToFirstClass(tabElement, 'tab_pin', {
		id: 'pin_' + idsString
	})
	if (aTab.windowId == currentWindow.id) {
		if (aTab.pinned == false) {
			setAttributesToFirstClass(tabElement, 'tab_pin', {
				title: chrome.i18n.getMessage("unpinnedTab"),
				class: 'tab_pin transparent'
			});
		} else {
			setAttributesToFirstClass(tabElement, 'tab_pin', {
				title: chrome.i18n.getMessage("pinnedTab")
			});
		}
	} else {
		if (aTab.pinned == false) {
			setAttributesToFirstClass(tabElement, 'tab_pin', {
				title: '',
				class: 'tab_pin transparent'
			});
		} else {
			setAttributesToFirstClass(tabElement, 'tab_pin', {
				title: chrome.i18n.getMessage("pinnedTabUnclickable")
			});
		}
	}


	return tabElement;
}

function generateTabsInWindow(tabs, currentWindow) {
	let template = elementById('tab_template');

	for (let i = 0; i < tabs.length; i++) {
		let isSelected = false;
		if (tabs[i].windowId == currentWindow.id && tabs[i].selected) {
			isSelected = true;
			gSelectedIndex = tabs[i].index;
		}
		
		let tabElement = undefined;
		tabElement = generateTabElement(tabs[i], template, currentWindow, isSelected);

		if (tabs[i].windowId == currentWindow.id) {
			elementById('content').innerHTML += tabElement.outerHTML;
		} else {
			elementById('separator').setAttribute('class', '');
			elementById('content_others').setAttribute('class', '');
			elementById('content_others').innerHTML += tabElement.outerHTML;
		}
	}

	// 「新しいタブ」を表示
	let newTabElement = template.cloneNode(true);
	newTabElement.setAttribute('class','tab new_tab');
	newTabElement.setAttribute('name', 'new_tab');
	newTabElement.setAttribute('id','new_tab');
	firstClass(newTabElement, 'tab_favicon').setAttribute('class', 'tab_favicon hidden');
	firstClass(newTabElement, 'tab_thumbnail').setAttribute('class', 'tab_thumbnail hidden');
	firstClass(newTabElement, 'tab_title_span').setAttribute('class', 'tab_title_span hidden');
	firstClass(newTabElement, 'tab_close').setAttribute('id', 'tab_title_span hidden');
	firstClass(newTabElement, 'tab_cover').innerText = '+';
	firstClass(newTabElement, 'tab_clickable').setAttribute('title', chrome.i18n.getMessage("newTab"));
	elementById('content').innerHTML += newTabElement.outerHTML;

	window.scrollTo(0, 192 * Math.floor(gSelectedIndex / gColumns) - 192);
}

function updateTabPins(tabs) {
	for (let i = 0; i < tabs.length; i++) {
		let idsString = tabs[i].windowId + '_' + tabs[i].id;
		let tabElement = elementById('tab_' + idsString);
		let tabPin = firstClass(tabElement, 'tab_pin');
		if (tabs[i].pinned) {
			tabPin.setAttribute('title', chrome.i18n.getMessage("pinnedTab"));
			tabPin.setAttribute('class', 'tab_pin');
		} else {
			tabPin.setAttribute('title', chrome.i18n.getMessage("unpinnedTab"));
			tabPin.setAttribute('class', 'tab_pin transparent');
		}
	}
}

function updateTabGroups(tabs) {
	for (let i = 0; i < tabs.length; i++) {
		let idsString = tabs[i].windowId + '_' + tabs[i].id;
		let prevHasGroup = (i > 0 && tabs[i - 1].groupId > 0 && tabs[i].windowId == tabs[i - 1].windowId);
		let nextHasGroup = (tabs.length > i + 1 && tabs[i + 1].groupId > 0 && tabs[i].windowId == tabs[i + 1].windowId);
		if (tabs[i].groupId >= 0) {
			let tabElement = elementById('tab_' + idsString);
			if (tabElement != undefined) {
				firstClass(tabElement, 'tab_hidden').setAttribute('value', prevHasGroup ? 'left' : (nextHasGroup ? 'right' : ''));
				chrome.tabGroups.get(tabs[i].groupId, tabGroup => {
					if (tabGroup != undefined) {
						firstClass(tabElement, 'tab_group_name').innerText = tabGroup.title;
						firstClass(tabElement, 'tab_group').setAttribute('style', 'background: ' + tabGroup.color);
						removeClass(firstClass(tabElement, 'tab_group_cover'), 'hidden');
						removeClass(firstClass(tabElement, 'tab_group_name'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_add'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_ungroup'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_make'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_left'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_right'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_none'), 'hidden');
						firstClass(tabElement, 'tab_group').setAttribute('class', 'tab_group');
					} else {
						firstClass(tabElement, 'tab_hidden').setAttribute('value', prevHasGroup ? 'left' : (nextHasGroup ? 'right' : ''));
						addClass(firstClass(tabElement, 'tab_group_cover'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_name'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_add'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_ungroup'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_make'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_left'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_right'), 'hidden');
						addClass(firstClass(tabElement, 'tab_group_none'), 'hidden');
					}
				});
			}
		} else {
			let tabElement = elementById('tab_' + idsString);
			if (tabElement != undefined) {
				firstClass(tabElement, 'tab_hidden').setAttribute('value', prevHasGroup ? 'left' : (nextHasGroup ? 'right' : ''));
				addClass(firstClass(tabElement, 'tab_group_cover'), 'hidden');
				addClass(firstClass(tabElement, 'tab_group'), 'hidden');
				addClass(firstClass(tabElement, 'tab_group_name'), 'hidden');
				addClass(firstClass(tabElement, 'tab_group_add'), 'hidden');
				addClass(firstClass(tabElement, 'tab_group_ungroup'), 'hidden');
				addClass(firstClass(tabElement, 'tab_group_make'), 'hidden');
				addClass(firstClass(tabElement, 'tab_group_left'), 'hidden');
				addClass(firstClass(tabElement, 'tab_group_right'), 'hidden');
				addClass(firstClass(tabElement, 'tab_group_none'), 'hidden');
			}
		}
	}
}

function addListenersToTabs(window, tabs) {
	for (let i = 0; i < tabs.length; i++) {
		let idsString = tabs[i].windowId + '_' + tabs[i].id;

		let tabElement = elementById('tab_' + idsString);
		elementById('tab_' + idsString).addEventListener('mouseenter', tabEntered);
		elementById('tab_' + idsString).addEventListener('mouseleave', tabLeft);

		if (elementById('clickable_' + idsString) != null) {
			let clickableDiv = elementById('clickable_' + idsString);
			clickableDiv.addEventListener('click', tabClicked);

			if (window.id == tabs[i].windowId) {
				clickableDiv.addEventListener('mousedown', clickableTabPressed);
				clickableDiv.addEventListener('mouseup', clickableTabReleased);
				clickableDiv.addEventListener('mousemove', clickableTabMoved);
				clickableDiv.addEventListener('mouseleave', clickableTabLeft);

				let tabTitleSpan = elementById('tab_title_span_' + idsString);
				tabTitleSpan.addEventListener('mouseenter', mouseEnterIntoTabTitle);
				tabTitleSpan.addEventListener('mouseleave', mouseLeaveFromTabTitle);

				let tabPin = elementById('pin_' + idsString);
				tabPin.addEventListener('mouseenter', mouseEnterIntoTabTitle);
				tabPin.addEventListener('mouseleave', mouseLeaveFromTabTitle);
				tabPin.addEventListener('click', pinClicked);
			} else {
				clickableDiv.addEventListener('mousedown', otherTabPressed);
				clickableDiv.addEventListener('mouseup', otherTabReleased);
			}
		}

		if (elementById('tab_group_add_' + idsString) != null) {
			let tabGroupAdd = elementById('tab_group_add_' + idsString);
			tabGroupAdd.addEventListener('mouseenter', addTabInThisGroupEntered);
			tabGroupAdd.addEventListener('mouseleave', addTabInThisGroupLeft);
			tabGroupAdd.addEventListener('click', addTabInThisGroupClicked);
		}

		if (elementById('tab_group_ungroup_' + idsString) != null) {
			let tabGroupAdd = elementById('tab_group_ungroup_' + idsString);
			tabGroupAdd.addEventListener('mouseenter', ungroupEntered);
			tabGroupAdd.addEventListener('mouseleave', ungroupLeft);
			tabGroupAdd.addEventListener('click', ungroupClicked);
		}

		if (elementById('tab_group_make_' + idsString) != null) {
			let tabGroupMake = elementById('tab_group_make_' + idsString);
			tabGroupMake.addEventListener('mouseenter', makeTabGroupEntered);
			tabGroupMake.addEventListener('mouseleave', makeTabGroupLeft);
			tabGroupMake.addEventListener('click', makeTabGroupClicked);
		}

		if (elementById('tab_group_left_' + idsString) != null) {
			let tabGroupLeft = elementById('tab_group_left_' + idsString);
			tabGroupLeft.addEventListener('mouseenter', addThisTabInLeftGroupEntered);
			tabGroupLeft.addEventListener('mouseleave', addThisTabInLeftGroupLeft);
			tabGroupLeft.addEventListener('click', addThisTabInLeftGroupClicked);
		}

		if (elementById('tab_group_right_' + idsString) != null) {
			let tabGroupLeft = elementById('tab_group_right_' + idsString);
			tabGroupLeft.addEventListener('mouseenter', addThisTabInRightGroupEntered);
			tabGroupLeft.addEventListener('mouseleave', addThisTabInRightGroupLeft);
			tabGroupLeft.addEventListener('click', addThisTabInRightGroupClicked);
		}

		if (elementById('pin_' + idsString) != null) {
			drawPin(elementById('pin_' + idsString), window.id == tabs[i].windowId && tabs[i].selected);
		}

		if (elementById('close_' + idsString) != null) {
			let tabClose = elementById('close_' + idsString);
			tabClose.addEventListener('click', closeTabClicked);
			tabClose.addEventListener('mouseenter', closeTabEntered);
			tabClose.addEventListener('mouseleave', closeTabLeft);
		}
	}
	if (elementById('new_tab') != null) {
		let newTab = elementById('new_tab');
		newTab.addEventListener('mousedown', newTabPressed);
		newTab.addEventListener('mouseup', newTabReleased);
		newTab.addEventListener('mouseenter', newTabEntered);
		newTab.addEventListener('mouseleave', newTabLeft);
		newTab.addEventListener('click', newTabClicked);
	}
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

function requestTabImages(override) {
	try {
		chrome.runtime.sendMessage({name: "requestTabImages"}, response => {
			tabImagesUpdated(response.tabImages, override);
		});
	} catch (error) {
		console.dir(error);
	}
}

function requestUpdateCurrentTab() {
	try {
		chrome.runtime.sendMessage({name: "requestUpdateCurrentTab"}, response => {
			tabImagesUpdated(response.tabImages, true);
		});
	} catch (error) {
		console.dir(error);
	}
}

function getSaveTabImagesPromise() {
	try {
		return new Promise((fulfill, decline) => {
			chrome.storage.local.set({
				tabImages: gTabImages
			}, _ => {
				fulfill();
			});
		});
	} catch (error) {
		decline(error);
	}
}

function getRestoreTabImagesPromise() {
	return new Promise((fulfill, decline) => {
		chrome.storage.local.get(['tabImages'], items => {
			tabImagesUpdated(items.tabImages, false);
			fulfill();
			// try {
			// 	let responseTabImages = items.tabImages;
			// 	for (let k = 0; k < Object.keys(items.tabImages).length; k++) {
			// 		let kKey = Object.keys(items.tabImages)[k]; // windowId
			// 		let kValue = Object.values(items.tabImages)[k];
			// 		for (let j = 0; j < Object.keys(kValue).length; j++) {
			// 			let key = Object.keys(kValue)[j]; // tabId
			// 			let value = Object.values(kValue)[j];
			// 			let newKey = kKey + "_" + key;
			// 			gTabImages[newKey] = value;
			// 		}
			// 	}
			// 	fulfill();
			// } catch (error) {
			// 	neglect();
			// }
		});
	});
}

function getRequestUpdateCurrentTabPromise() {
	return new Promise((fulfill, decline) => {
		requestUpdateCurrentTab();
		fulfill();
	});
}


function getRequestTabImagesPromise(override) {
	return new Promise((fulfill, decline) => {
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
		anElement.innerText = chrome.i18n.getMessage(anElement.getAttribute('name'));
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

// ユーティリティメソッド

function windowTabId(elementId, elementKind) {
	let regexString = elementKind + '_([0-9]+)_([0-9]+)';
	let matches = elementId.match(new RegExp(regexString));
	return {
		windowId: parseInt(matches[1]),
		tabId: parseInt(matches[2])
	}
}

// 要素操作

function elementById(elementId) {
	return document.getElementById(elementId);
}

function firstClass(elements, className) {
	return elements.getElementsByClassName(className)[0];
}

function setAttributesToFirstClass(elements, className, attributes) {
	let element = firstClass(elements, className);
	for (key in attributes) {
		element.setAttribute(key, attributes[key]);
	}
	return element;
}

function addClass(anElement, aClass) {
	let newClass = anElement.getAttribute('class') + ' ' + aClass;
	anElement.setAttribute('class', newClass);
}

function removeClass(anElement, aClass) {
	let newClass = anElement.getAttribute('class').replaceAll(aClass, '');
	anElement.setAttribute('class', newClass);
}

// イベント系

function addTabInThisGroupEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_add');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	addClass(firstClass(tab, 'tab_group_add'), 'entered');
}

function addTabInThisGroupLeft(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_add');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	removeClass(firstClass(tab, 'tab_group_add'), 'entered');
}

function addTabInThisGroupClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_add');
	chrome.windows.update(idSet.windowId, {focused: true}, ignore => {
		chrome.tabs.get(idSet.tabId, tab => {
			chrome.tabs.create({active: true, index: tab.index + 1}, newTab => {
				chrome.tabs.group({groupId: tab.groupId, tabIds: [newTab.id]}, newTab2 => {
					chrome.tabs.update(newTab.id, {active: true}, ignore => {
						chrome.tabs.query({}, tabs2 => {
							updateTabGroups(tabs2);
							updateTabPins(tabs2);
						});
					});
				});
			});
		});
	});
}

function ungroupEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_ungroup');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	addClass(firstClass(tab, 'tab_group_ungroup'), 'entered');
}

function ungroupLeft(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_ungroup');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	removeClass(firstClass(tab, 'tab_group_ungroup'), 'entered');
}

function ungroupClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_ungroup');
	let movingTab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);


	chrome.tabs.get(idSet.tabId, aTab => {
		let originalIndex = aTab.index;
		chrome.tabs.ungroup([idSet.tabId], ignore => {
			chrome.tabs.get(idSet.tabId, bTab => {
				let destinationIndex = bTab.index;
				let destinationTab;
				if (originalIndex < destinationIndex) {
					destinationTab = elementById('content').children[destinationIndex + 1];
				} else {
					destinationTab = elementById('content').children[destinationIndex];
				}
				destinationTab.before(movingTab);
				chrome.tabs.query({}, tabs => {
					updateTabGroups(tabs);
					updateTabPins(tabs);
				});
			});
		});
	});
}

function makeTabGroupEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_make');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	addClass(firstClass(tab, 'tab_group_make'), 'entered');
}

function makeTabGroupLeft(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_make');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	removeClass(firstClass(tab, 'tab_group_make'), 'entered');
}

function makeTabGroupClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_make');
	chrome.tabs.group({tabIds: [idSet.tabId]}, newTab => {
		chrome.tabs.query({}, tabs => {
			updateTabGroups(tabs);
			updateTabPins(tabs);
		});
	});
}

function addThisTabInLeftGroupEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_left');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	addClass(firstClass(tab, 'tab_group_left'), 'entered');
}

function addThisTabInLeftGroupLeft(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_left');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	removeClass(firstClass(tab, 'tab_group_left'), 'entered');
}

function addThisTabInLeftGroupClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_left');
	chrome.tabs.query({windowId: idSet.windowId}, tabs => {
		let index = -1;
		for (let i = 0; i < tabs.length; i++) {
			if (tabs[i].id == idSet.tabId) {
				index = i;
				break;
			}
		}
		if (index > 0) {
			let tabGroupId = tabs[index - 1].groupId;
			chrome.tabs.group({groupId: tabGroupId, tabIds: [idSet.tabId]}, ignore => {
				chrome.tabs.query({}, tabs2 => {
					updateTabGroups(tabs2);
					updateTabPins(tabs2);
				});
			});
		}
	});
}

function addThisTabInRightGroupEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_right');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	addClass(firstClass(tab, 'tab_group_right'), 'entered');
}

function addThisTabInRightGroupLeft(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_right');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	removeClass(firstClass(tab, 'tab_group_right'), 'entered');
}

function addThisTabInRightGroupClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab_group_right');
	chrome.tabs.query({windowId: idSet.windowId}, tabs => {
		let index = -1;
		for (let i = 0; i < tabs.length; i++) {
			if (tabs[i].id == idSet.tabId) {
				index = i;
				break;
			}
		}
		if (index >= 0 && index + 1 <= tabs.length) {
			let tabGroupId = tabs[index + 1].groupId;
			chrome.tabs.group({groupId: tabGroupId, tabIds: [idSet.tabId]}, ignore => {
				chrome.tabs.query({}, tabs2 => {
					updateTabGroups(tabs2);
					updateTabPins(tabs2);
				});
			});
		}
	});
}

function tabClicked(event) {
	if (gDragged) {
		return;
	}
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	activateTab(idSet.windowId, idSet.tabId);
	window.close();
}

function otherTabPressed(event) {
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);

	addClass(event.currentTarget, 'dragging');
	addClass(tab, 'dragging');
}


function otherTabReleased(event) {
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);

	removeClass(event.currentTarget, 'dragging');
	removeClass(tab, 'dragging');
}

function newTabPressed(event) {
	let tab = elementById('new_tab');

	addClass(event.currentTarget, 'dragging');
	addClass(tab, 'dragging');
}


function newTabReleased(event) {
	let tab = elementById('new_tab');

	removeClass(event.currentTarget, 'dragging');
	removeClass(tab, 'dragging');
}

function clickableTabPressed(event) {
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	gDraggingTab = idSet.windowId + '_' + idSet.tabId;

	let x = Math.floor(event.pageX / 192);
	let y = Math.floor(event.pageY / 192);
	gDraggingIndex = newIndex = x + y * gColumns;
	gDragged = false;

	addClass(event.currentTarget, 'dragging');
	addClass(tab, 'dragging');
	resetDarkness();
}

function clickableTabReleased(event) {
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	removeClass(event.currentTarget, 'dragging');
	removeClass(tab, 'dragging');

	chrome.tabs.get(idSet.tabId, aTab => {
		let destinationIndex = aTab.index;
		let destinationTab;
		if (gDraggingIndex < destinationIndex) {
			destinationTab = elementById('content').children[destinationIndex + 1];
		} else {
			destinationTab = elementById('content').children[destinationIndex];
		}
		destinationTab.before(tab);
		chrome.tabs.query({}, tabs => {
			updateTabGroups(tabs);
			updateTabPins(tabs);
			gDragged = false;
			gDraggingTab = undefined;
			gDraggingIndex = undefined;
		});
	})

}

function clickableTabLeft(evet) {
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

function clickableTabMoved(event) {
	if (gDraggingTab == undefined) {
		return;
	}
	let idSet = windowTabId(event.currentTarget.id, 'clickable');
	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	if (gDraggingTab != idSet.windowId + '_' + idSet.tabId) {
		return;
	}

	let x = Math.floor(event.pageX / 192);
	let y = Math.floor(event.pageY / 192);
	let newIndex = x + y * gColumns;
	
	if (newIndex != gDraggingIndex) {
		chrome.tabs.query({windowId: idSet.windowId}, tabs => {
			let needsToUngroup = false;
			if (newIndex >= tabs.length) {
				needsToUngroup = true;
			}
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

				if (needsToUngroup == true) {
					chrome.tabs.ungroup([idSet.tabId], newTab2 => {
						chrome.tabs.query({}, tabs2 => {
							updateTabGroups(tabs2);
							updateTabPins(tabs2);
						});
					});
				} else {
					chrome.tabs.query({}, tabs => {
						updateTabGroups(tabs);
						updateTabPins(tabs);
					});
				}
			});
		});
	}
}

function closeTabClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'close');
	chrome.tabs.remove(idSet.tabId, aTab => {
		let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
		addClass(tab, 'hidden');
		chrome.tabs.query({}, tabs2 => {
			updateTabGroups(tabs2);
			updateTabPins(tabs2);
		});
	});
}

function tabEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	addClass(tab, 'entered');
	if (tab.getAttribute('name').indexOf('other_') < 0 && gCloseButtonsOnPinnedTabs 
			|| (firstClass(tab, 'tab_pin').getAttribute('class').indexOf('hidden') >= 0 
				|| firstClass(tab, 'tab_pin').getAttribute('class').indexOf('transparent') >= 0)) {
		addClass(firstClass(tab, 'tab_title'), 'entered');
		removeClass(firstClass(tab, 'tab_close'), 'hidden');
	}
	if (tab.getAttribute('name').indexOf('other_') < 0 
		&& firstClass(tab, 'tab_group').getAttribute('class').indexOf('hidden') < 0 ) {
		removeClass(firstClass(tab, 'tab_group_add'), 'hidden');
		removeClass(firstClass(tab, 'tab_group_ungroup'), 'hidden');
	}
	if (tab.getAttribute('name').indexOf('other_') < 0 
		 && firstClass(tab, 'tab_group').getAttribute('class').indexOf('hidden') >= 0
		 && ((firstClass(tab, 'tab_pin').getAttribute('class').indexOf('hidden') >= 0 || firstClass(tab, 'tab_pin').getAttribute('class').indexOf('transparent') >= 0))) {
		removeClass(firstClass(tab, 'tab_group_none'), 'hidden');
		removeClass(firstClass(tab, 'tab_group_make'), 'hidden');
		if (firstClass(tab, 'tab_hidden').getAttribute('value').indexOf('left') >= 0) {
			removeClass(firstClass(tab, 'tab_group_left'), 'hidden');
		}
		if (firstClass(tab, 'tab_hidden').getAttribute('value').indexOf('right') >= 0) {
			removeClass(firstClass(tab, 'tab_group_right'), 'hidden');
		}
	}

	resetDarkness();
}

function tabLeft(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	removeClass(tab, 'entered');
	removeClass(firstClass(tab, 'tab_title'), 'entered');
	addClass(firstClass(tab, 'tab_close'), 'hidden');
	addClass(firstClass(tab, 'tab_group_add'), 'hidden');
	addClass(firstClass(tab, 'tab_group_ungroup'), 'hidden');
	addClass(firstClass(tab, 'tab_group_make'), 'hidden');
	addClass(firstClass(tab, 'tab_group_left'), 'hidden');
	addClass(firstClass(tab, 'tab_group_right'), 'hidden');
	addClass(firstClass(tab, 'tab_group_none'), 'hidden');
}

function newTabEntered(event) {
	let tab = elementById('new_tab');
	addClass(tab, 'entered');
}

function newTabLeft(event) {
	let tab = elementById('new_tab');
	removeClass(tab, 'entered');
	removeClass(tab, 'dragging');
}

function closeTabEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'close');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	firstClass(tab, 'tab_close').setAttribute('class', 'tab_close entered');
}

function closeTabLeft(event) {
	let idSet = windowTabId(event.currentTarget.id, 'close');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	firstClass(tab, 'tab_close').setAttribute('class', 'tab_close');
}

function mouseEnterIntoTabTitle(event) {
	var matches = (event.target.id).match(/_([0-9]+)_([0-9]+)$/);
	var windowId = parseInt(matches[1]);
	var tabId = parseInt(matches[2]);

	if (elementById('pin_' + windowId + '_' + tabId).getAttribute('class').indexOf('translucent') > 0
		|| elementById('pin_' + windowId + '_' + tabId).getAttribute('class').indexOf('transparent') > 0) {
		elementById('pin_' + windowId + '_' + tabId).setAttribute('class', 'tab_pin translucent');
	} else {
		elementById('pin_' + windowId + '_' + tabId).setAttribute('class', 'tab_pin opaque');
	}
}

function mouseLeaveFromTabTitle(event) {
	var matches = (event.target.id).match(/_([0-9]+)_([0-9]+)/);
	var windowId = parseInt(matches[1]);
	var tabId = parseInt(matches[2]);

	if (elementById('pin_' + windowId + '_' + tabId).getAttribute('class').indexOf('translucent') > 0
		|| elementById('pin_' + windowId + '_' + tabId).getAttribute('class').indexOf('transparent') > 0) {
		elementById('pin_' + windowId + '_' + tabId).setAttribute('class', 'tab_pin transparent');
	} else {
		elementById('pin_' + windowId + '_' + tabId).setAttribute('class', 'tab_pin');
	}
}

function pinClicked(event) {
	var matches = (event.target.id).match(/_([0-9]+)_([0-9]+)/);
	var windowId = parseInt(matches[1]);
	var tabId = parseInt(matches[2]);

	let pinnedAfter = false;
	if (elementById('pin_' + windowId + '_' + tabId).getAttribute('class').indexOf('translucent') > 0
		|| elementById('pin_' + windowId + '_' + tabId).getAttribute('class').indexOf('transparent') > 0) {
		pinnedAfter = true;
	}

	chrome.tabs.get(tabId, aTab => {
		let originalIndex = aTab.index;
		chrome.tabs.update(tabId, {pinned: pinnedAfter}, bTab => {
			let movingTab = elementById('tab_' + windowId + '_' + tabId);
			if (firstClass(movingTab, 'tab_cover').className.indexOf('selected') < 0) {
				addClass(firstClass(movingTab, 'tab_cover'), 'darken');
			}
			if (pinnedAfter) {
				firstClass(movingTab, 'tab_pin').setAttribute('title', chrome.i18n.getMessage("pinnedTab"));
				firstClass(movingTab, 'tab_pin').setAttribute('class', 'tab_pin opaque');
			} else {
				firstClass(movingTab, 'tab_pin').setAttribute('title', chrome.i18n.getMessage("unpinnedTab"));
				firstClass(movingTab, 'tab_pin').setAttribute('class', 'tab_pin translucent');
			}

			let destinationIndex = bTab.index;
			let destinationTab;
			if (originalIndex < destinationIndex) {
				destinationTab = elementById('content').children[destinationIndex + 1];
			} else {
				destinationTab = elementById('content').children[destinationIndex];
			}
			destinationTab.before(movingTab);
			chrome.tabs.query({}, tabs => {
				updateTabGroups(tabs);
			});
		});
	});
		
}

// タブ操作

function resetDarkness() {
	let darkTabs = document.getElementsByClassName('darken');
	for (let i = 0; i < darkTabs.length; i++) {
		removeClass(darkTabs[i], 'darken');
	}
}

function activateTab(windowId, tabId) {
	chrome.windows.update(windowId, {focused: true}, ignore => {});
	chrome.tabs.update(tabId, {active: true}, ignore => {});
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

	ctx.fillStyle = selected ? "#202020" : "#404040";
	ctx.beginPath();
	ctx.arc(width / 2, height / 2, width * 1 / 3, 0, Math.PI * 2, true);
	ctx.fill();

	// ctx.fillStyle = selected ? "#121212" : "#282828";
	// ctx.beginPath();
	// ctx.arc(width / 2, height / 2, width * 1 / 6, 0, Math.PI * 2, true);
	// ctx.fill();
}

function getUpdateSettingsPromise() {
	return new Promise((fulfill, decline) => {
		chrome.storage.sync.get({
			quality: 1, // low
			columns: 3,
			backgroundColor: 'gray',
			closeButtonsOnPinnedTabs: true
		}, items => {
		    gImageDepth = parseInt(items.quality);
		    gColumns = parseInt(items.columns);
		    gBackgroundColor = items.backgroundColor;
		    gCloseButtonsOnPinnedTabs = items.closeButtonsOnPinnedTabs;
		    fulfill();
		});
	});
}

