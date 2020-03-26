
let selectedIndex = -1;
let markedIndex = -1;
let rows = 3;

window.onkeydown = function(event) {
	let originalMarkedIndex = markedIndex;
	if (markedIndex == -1) {
		markedIndex = selectedIndex;
	}

	let tabsNum = 0;
	let tabs = elementById('content_all').getElementsByClassName('tab');
	for (let i = 0; i < tabs.length; i++) {
		if (tabs[i].className.indexOf('hidden') < 0) {
			tabsNum++;
		}
	}

	if (event.keyCode == 37) { // left
		markedIndex--;
		if (markedIndex < 0) {
			markedIndex = tabsNum - 1;
		}
		updateTabMark();
		event.preventDefault();
  	} else if (event.keyCode == 39) { // right
  		markedIndex++;
		if (markedIndex >= tabsNum) {
			markedIndex = 0;
		}
		updateTabMark();
		event.preventDefault();
	} else if (event.keyCode == 38) { // up
		moveTabMarkVertically(-1);
		updateTabMark();
		event.preventDefault();
  	} else if (event.keyCode == 40) { // down
		moveTabMarkVertically(1);
		updateTabMark();
		event.preventDefault();
  	} else if (event.keyCode == 27) { // esc
		if (originalMarkedIndex >= 0) {
			markedIndex = -1;
			updateTabMark();
			event.preventDefault();
		}
  	} else if (event.keyCode == 32 || event.keyCode == 13) { // space or enter
  		activateMarkedTab();
  		event.preventDefault();
	}
};

window.onload = function() {
	elementById('content').innerHTML = '';

	chrome.extension.sendMessage({name: "updateCurrentTab"}, function(response) {
		rows = response.rows;
		elementById('body').style.width = parseInt(rows * 192) + 'px';
		elementById('separator').style.width = parseInt(rows * 192 - 32) + 'px';
		elementById('bottom_padding').style.width = parseInt(rows * 192) + 'px';

		chrome.windows.getCurrent(null, function(currentWindow) {
			chrome.windows.getAll(null, function(allWindows) {
				for (let w = 0; w < allWindows.length; w++) {
					let aWindow = allWindows[w];
					chrome.tabs.getAllInWindow(aWindow.id, function(tabs){
						let template = elementById('tab_template');

						for (let i = 0; i < tabs.length; i++) {
							let idsString = tabs[i].windowId + '_' + tabs[i].id;

							let tabElement = template.cloneNode(true);
							if (tabs[0].windowId == currentWindow.id) {
								tabElement.setAttribute('name', 'tab_' + idsString);
							} else {
								tabElement.setAttribute('name', 'other_tab_' + idsString);
							}
							if (tabs[i].favIconUrl == undefined || tabs[i].favIconUrl.length == 0) {
								firstClass(tabElement, 'tab_favicon').setAttribute('src', chrome.runtime.getURL('whitepaper.png'));
							} else {
								firstClass(tabElement, 'tab_favicon').setAttribute('src', tabs[i].favIconUrl);
							}
							firstClass(tabElement, 'tab_thumbnail').setAttribute('id', 'thumbnail_' + tabs[i].windowId + '_' + tabs[i].id);
							firstClass(tabElement, 'tab_title_span').innerText = tabs[i].title;
							firstClass(tabElement, 'tab_title_span').setAttribute('title', tabs[i].title + "\n" + tabs[i].url);
							firstClass(tabElement, 'tab_close').setAttribute('id', 'close_' + idsString);
							firstClass(tabElement, 'tab_close').setAttribute('title', chrome.i18n.getMessage("close"));
							tabElement.setAttribute('id', 'tab_' + idsString);
							firstClass(tabElement, 'tab_cover').setAttribute('id', 'cover_' + idsString);
							if (tabs[i].windowId == currentWindow.id && tabs[i].selected) {
								firstClass(tabElement, 'tab_cover').setAttribute('class', 'tab_cover selected');
								selectedIndex = i;
							}
							firstClass(tabElement, 'tab_pin').setAttribute('id', 'pin_' + idsString);
							firstClass(tabElement, 'tab_pin').setAttribute('title', chrome.i18n.getMessage("pinnedTab"));
							if (tabs[i].pinned == false) {
								firstClass(tabElement, 'tab_pin').setAttribute('class', 'tab_pin hidden');
							}
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
							newTabElement.setAttribute('id','cover_new');
							firstClass(newTabElement, 'tab_favicon').setAttribute('class', 'tab_favicon hidden');
							firstClass(newTabElement, 'tab_thumbnail').setAttribute('class', 'tab_thumbnail hidden');
							firstClass(newTabElement, 'tab_title_span').setAttribute('class', 'tab_title_span hidden');
							firstClass(newTabElement, 'tab_close').setAttribute('id', 'tab_title_span hidden');
							firstClass(newTabElement, 'tab_cover').innerText = '+';
							firstClass(newTabElement, 'tab_cover').setAttribute('title', chrome.i18n.getMessage("newTab"));
							elementById('content').innerHTML += newTabElement.outerHTML;
						}

						for (let i = 0; i < tabs.length; i++) {
							let idsString = tabs[i].windowId + '_' + tabs[i].id;

							elementById('tab_' + idsString).addEventListener('mouseenter', tabEntered);
							elementById('tab_' + idsString).addEventListener('mouseleave', tabLeaved);

							if (elementById('cover_' + idsString) != null) {
								elementById('cover_' + idsString).addEventListener('click', tabClicked);
							}

							if (elementById('pin_' + idsString) != null) {
								drawPin(elementById('pin_' + idsString), tabs[i].selected);
							}

							if (elementById('close_' + idsString) != null) {
								elementById('close_' + idsString).addEventListener('click', closeTabClicked);
								elementById('close_' + idsString).addEventListener('mouseenter', closeTabEntered);
								elementById('close_' + idsString).addEventListener('mouseleave', closeTabLeaved);
							}
						}
						elementById('cover_new').addEventListener('click', newTabClicked);

						requestTabImages(true);
						if (tabs[0].windowId == currentWindow.id) {
							window.scrollTo(0, 192 * Math.floor(selectedIndex / 3) - 192);
						}
					});
				}
			});
		});	
	});

	localizeMessages();
};

function updateTabMark() {
	let tabs = new Array();

	let ownedTabs = elementById('content').getElementsByClassName('tab');
	for (let i = 0; i < ownedTabs.length; i++) {
		if (ownedTabs[i].className.indexOf('hidden') >= 0) {
			continue;
		}
		tabs.push(ownedTabs[i]);
	}
	while (tabs.length % 3 != 0) {
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
		if (j == markedIndex && originalClass.indexOf("highlighted") < 0) {
			tabs[i].setAttribute('class', originalClass + ' highlighted');
			if (tabs[i].getAttribute('name').indexOf('other') >= 0) {
				window.scrollTo(0, 192 * Math.floor(i / 3) - 192 + 56);
			} else {
				window.scrollTo(0, 192 * Math.floor(i / 3) - 192);
			}
		} else if (j != markedIndex && originalClass.indexOf("highlighted") >= 0) {
			tabs[i].setAttribute('class', originalClass.replace('highlighted', ''));
		}
		j++;
	}
}

function moveTabMarkVertically(delta) {
	let virtualTabs = new Array();
	let realTabs = new Array();

	let ownedTabs = elementById('content').getElementsByClassName('tab');
	for (let i = 0; i < ownedTabs.length; i++) {
		if (ownedTabs[i].className.indexOf('hidden') >= 0) {
			continue;
		}

		virtualTabs.push(ownedTabs[i]);
		realTabs.push(ownedTabs[i]);
	}
	while (virtualTabs.length % 3 != 0) {
		virtualTabs.push(undefined);
	}

	let otherTabs = elementById('content_others').getElementsByClassName('tab');
	for (let i = 0; i < otherTabs.length; i++) {
		if (otherTabs[i].className.indexOf('hidden') >= 0) {
			continue;
		}
		virtualTabs.push(otherTabs[i]);
		realTabs.push(otherTabs[i]);
	}

	let virtualIndex = 0;
	for (virtualIndex = 0; virtualIndex < virtualTabs.length; virtualIndex++) {
		if (virtualTabs[virtualIndex] == realTabs[markedIndex]) {
			break;
		}
	}

	do {
		virtualIndex += delta * 3;
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

	for (markedIndex = 0; markedIndex < realTabs.length; markedIndex++) {
		if (realTabs[markedIndex] == virtualTabs[virtualIndex]) {
			break;
		}
	}
}

function activateMarkedTab() {
	let tabs = elementById('content_all').getElementsByClassName('tab');
	if (markedIndex == -1) {
		markedIndex = selectedIndex;
	}
	let highlightedTabName = tabs[markedIndex].getAttribute('name');
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
	chrome.extension.sendMessage({name: "requestTabImages"}, function(response) {
		tabImagesUpdated(response.tabImages, override);
	});
}

function tabImagesUpdated(tabImages, override) {
	let responseTabs = tabImages;
	for (let k = 0; k < Object.keys(responseTabs).length; k++) {
		let kKey = Object.keys(responseTabs)[k];
		let kValue = Object.values(responseTabs)[k];
		for (let j = 0; j < Object.keys(kValue).length; j++) {
			let key = Object.keys(kValue)[j];
			let value = Object.values(kValue)[j];

			if (kKey != null && key != null && elementById('thumbnail_' + kKey + '_' + key) != null) {
				let element = elementById('thumbnail_' + kKey + '_' + key);
				if (override == false && element.getAttribute('src') != undefined) {
					continue;
				}

				if (value != undefined && value != 'null' && value != 'undefined' && value != '') {
					element.setAttribute('src', new String(value));
				} else {
					element.removeAttribute('src');
				}
			}
		}
	}
}

function localizeMessages() {
	let localizables = Array.from(document.getElementsByClassName('localizable'));

	localizables.forEach(function(anElement){
		anElement.innerText = chrome.i18n.getMessage(anElement.innerText);
	});
}

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.name == "tabImageUpdated") {
			requestTabImages(false, request.tabImages);
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function windowTabId(elementId, elementKind) {
	let regexString = elementKind + '_([0-9]+)_([0-9]+)';
	let matches = elementId.match(new RegExp(regexString));
	return {windowId: parseInt(matches[1]),
			   tabId: parseInt(matches[2])}
}

function tabClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'cover');
	activateTab(idSet.windowId, idSet.tabId);
	window.close();
}

function closeTabClicked(event) {
	let idSet = windowTabId(event.currentTarget.id, 'close');
	closeTab(idSet.windowId, idSet.tabId);

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	tab.setAttribute('class', 'tab hidden');
}

function tabEntered(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	firstClass(tab, 'tab_title').setAttribute('class', 'tab_title entered');
	firstClass(tab, 'tab_close').setAttribute('class', 'tab_close');
}

function tabLeaved(event) {
	let idSet = windowTabId(event.currentTarget.id, 'tab');

	let tab = elementById('tab_' + idSet.windowId + '_' + idSet.tabId);
	firstClass(tab, 'tab_title').setAttribute('class', 'tab_title');
	firstClass(tab, 'tab_close').setAttribute('class', 'tab_close hidden');
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
	chrome.windows.update(windowId, {focused: true}, function(ignore){});
	chrome.tabs.update(tabId, {active: true}, function(ignore){});
}

function closeTab(windowId, tabId) {
	chrome.tabs.remove(tabId, function(ignore){});
}

function newTabClicked(event) {
	createNewTab();
}

function createNewTab() {
	chrome.tabs.create({active: true}, function(ignore){});
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


