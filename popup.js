
var selectedIndex = -1;
var markedIndex = -1;

window.onkeydown = function(event) {
	var originalMarkedIndex = markedIndex;
	if (markedIndex == -1) {
		markedIndex = selectedIndex;
	}

	var tabs = elementById('content_all').getElementsByClassName('tab');

	if (event.keyCode == 37) { // left
		markedIndex--;
		if (markedIndex < 0) {
			markedIndex = tabs.length - 1;
		}
		updateTabMark();
		event.preventDefault();
  	} else if (event.keyCode == 39) { // right
  		markedIndex++;
		if (markedIndex >= tabs.length) {
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
		chrome.windows.getCurrent(null, function(currentWindow) {
			chrome.windows.getAll(null, function(allWindows) {
				for (var w = 0; w < allWindows.length; w++) {
					var aWindow = allWindows[w];
					chrome.tabs.getAllInWindow(aWindow.id, function(tabs){
						var template = elementById('tab_template');

						for (var i = 0; i < tabs.length; i++) {
							var windowTabId = tabs[i].windowId + '_' + tabs[i].id;

							var tabElement = template.cloneNode(true);
							if (tabs[0].windowId == currentWindow.id) {
								tabElement.setAttribute('name', 'tab_' + windowTabId);
							} else {
								tabElement.setAttribute('name', 'other_tab_' + windowTabId);
							}
							firstClass(tabElement, 'tab_favicon').setAttribute('src', tabs[i].favIconUrl);
							firstClass(tabElement, 'tab_thumbnail').setAttribute('id', 'thumbnail_' + windowTabId);
							firstClass(tabElement, 'tab_title_span').innerText = tabs[i].title;
							firstClass(tabElement, 'tab_title_span').setAttribute('title', tabs[i].title + "\n" + tabs[i].url);
							firstClass(tabElement, 'tab_close').setAttribute('id', 'close_' + windowTabId);
							tabElement.removeAttribute('id');
							firstClass(tabElement, 'tab_cover').setAttribute('id', 'cover_' + windowTabId);
							if (tabs[i].windowId == currentWindow.id && tabs[i].selected) {
								firstClass(tabElement, 'tab_cover').setAttribute('class', 'tab_cover selected');
								selectedIndex = i;
							}
							firstClass(tabElement, 'tab_pin').setAttribute('id', 'pin_' + windowTabId);
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

						if (tabs[0].windowId == currentWindow.id) {
							var newTabElement = template.cloneNode(true);
							newTabElement.setAttribute('class','tab new_tab');
							newTabElement.setAttribute('name', 'new_tab');
							firstClass(newTabElement, 'tab_favicon').setAttribute('class', 'tab_favicon hidden');
							firstClass(newTabElement, 'tab_thumbnail').setAttribute('class', 'tab_thumbnail hidden');
							firstClass(newTabElement, 'tab_title_span').setAttribute('class', 'tab_title_span hidden');
							firstClass(newTabElement, 'tab_close').setAttribute('id', 'tab_title_span hidden');
							firstClass(newTabElement, 'tab_cover').innerText = '+';
							firstClass(newTabElement, 'tab_cover').setAttribute('title', chrome.i18n.getMessage("newTab"));
							newTabElement.removeAttribute('id');
							elementById('content').innerHTML += newTabElement.outerHTML;
						}

						for (var i = 0; i < tabs.length; i++) {
							var windowTabId = tabs[i].windowId + '_' + tabs[i].id;

							if (elementById('cover_' + windowTabId) != null) {
								elementById('cover_' + windowTabId).addEventListener('click', tabClicked);
							}

							if (elementById('pin_' + windowTabId) != null) {
								drawPin(elementById('pin_' + windowTabId), tabs[i].selected);
							}

							if (elementById('close_' + windowTabId) != null) {
								elementById('close_' + windowTabId).addEventListener('click', closeTabClicked);
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
	var tabs = new Array();

	var ownedTabs = elementById('content').getElementsByClassName('tab');
	for (var i = 0; i < ownedTabs.length; i++) {
		tabs.push(ownedTabs[i]);
	}
	while (tabs.length % 3 != 0) {
		tabs.push(undefined);
	}

	var otherTabs = elementById('content_others').getElementsByClassName('tab');
	for (var i = 0; i < otherTabs.length; i++) {
		tabs.push(otherTabs[i]);
	}
	
	var j = 0;
	for (var i = 0; i < tabs.length; i++) {
		if (tabs[i] == undefined) {
			continue;
		}
		var originalClass = tabs[i].getAttribute('class');
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
	var virtualTabs = new Array();
	var realTabs = new Array();

	var ownedTabs = elementById('content').getElementsByClassName('tab');
	for (var i = 0; i < ownedTabs.length; i++) {
		virtualTabs.push(ownedTabs[i]);
		realTabs.push(ownedTabs[i]);
	}
	while (virtualTabs.length % 3 != 0) {
		virtualTabs.push(undefined);
	}

	var otherTabs = elementById('content_others').getElementsByClassName('tab');
	for (var i = 0; i < otherTabs.length; i++) {
		virtualTabs.push(otherTabs[i]);
		realTabs.push(otherTabs[i]);
	}

	var virtualIndex = 0;
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
	var tabs = elementById('content_all').getElementsByClassName('tab');
	if (markedIndex == -1) {
		markedIndex = selectedIndex;
	}
	var highlightedTabName = tabs[markedIndex].getAttribute('name');
	if (highlightedTabName == 'new_tab') {
		createNewTab();
	} else {
		var matches = highlightedTabName.match(/tab_([0-9]+)_([0-9]+)/);
		var windowId = parseInt(matches[1]);
		var tabId = parseInt(matches[2]);	
		activateTab(windowId, tabId);
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
		var responseTabs = response.tabs;
		for (var k = 0; k < Object.keys(responseTabs).length; k++) {
			var kKey = Object.keys(responseTabs)[k];
			var kValue = Object.values(responseTabs)[k];
			for (var j = 0; j < Object.keys(kValue).length; j++) {
				var key = Object.keys(kValue)[j];
				var value = Object.values(kValue)[j];

				if (kKey != null && key != null && elementById('thumbnail_' + kKey + '_' + key) != null) {
					var element = elementById('thumbnail_' + kKey + '_' + key);
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
	});
}

function localizeMessages() {
	var localizables = Array.from(document.getElementsByClassName('localizable'));

	localizables.forEach(anElement => {
		anElement.innerText = chrome.i18n.getMessage(anElement.innerText);
	})
}

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request == "tabImageUpdated") {
			requestTabImages(false);
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function tabClicked(event) {
	var matches = (event.target.id).match(/cover_([0-9]+)_([0-9]+)/);
	var windowId = parseInt(matches[1]);
	var tabId = parseInt(matches[2]);
	activateTab(windowId, tabId);
	window.close();
}

function closeTabClicked() {
	var matches = (event.target.id).match(/close_([0-9]+)_([0-9]+)/);
	var windowId = parseInt(matches[1]);
	var tabId = parseInt(matches[2]);
	closeTab(windowId, tabId);
	window.close();
}

function activateTab(windowId, tabId) {
	chrome.windows.update(windowId, {focused: true}, function(ignore){});
	chrome.tabs.update(tabId, {active: true}, function(ignore){});
}

function closeTab(windowId, tabId) {
	chrome.windows.update(windowId, {focused: true}, function(ignore){});
	chrome.tabs.remove(tabId, function(ignore){});
}

function newTabClicked(event) {
	createNewTab();
}

function createNewTab() {
	chrome.tabs.create({active: true}, function(ignore){});
}

function drawPin(target, selected) {
	var width = 24;
	var height = 24;

	var ctx = target.getContext('2d');
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


