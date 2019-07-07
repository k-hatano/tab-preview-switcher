
window.onload = function() {
	document.getElementById('content').innerHTML = '';

	chrome.extension.sendMessage("updateCurrentTab", function(response) {
		chrome.windows.getCurrent(null, function(currentWindow) {
			chrome.windows.getAll(null, function(allWindows) {
				for (var w = 0; w < allWindows.length; w++) {
					var aWindow = allWindows[w];
					chrome.tabs.getAllInWindow(aWindow.id, function(tabs){
						var template = document.getElementById('tab_template');

						var selectedIndex = 0;

						for (var i = 0; i < tabs.length; i++) {
							var tabElement = template.cloneNode(true);
							getFirstByClass(tabElement, 'tab_favicon').setAttribute('src', tabs[i].favIconUrl);
							getFirstByClass(tabElement, 'tab_thumbnail').setAttribute('id', 'thumbnail_' + tabs[i].windowId + '_' + tabs[i].id);
							getFirstByClass(tabElement, 'tab_title_span').innerText = tabs[i].title;
							getFirstByClass(tabElement, 'tab_title_span').setAttribute('title', tabs[i].title + "\n" + tabs[i].url);
							tabElement.removeAttribute('id');
							getFirstByClass(tabElement, 'tab_cover').setAttribute('id', 'cover_' + tabs[i].windowId + '_' + tabs[i].id);
							if (tabs[i].windowId == currentWindow.id && tabs[i].selected) {
								getFirstByClass(tabElement, 'tab_cover').setAttribute('class', 'tab_cover selected');
								selectedIndex = i;
							}
							getFirstByClass(tabElement, 'tab_pin').setAttribute('id', 'pin_' + tabs[i].windowId + '_' + tabs[i].id);
							getFirstByClass(tabElement, 'tab_pin').setAttribute('title', chrome.i18n.getMessage("pinnedTab"));
							if (tabs[i].pinned == false) {
								getFirstByClass(tabElement, 'tab_pin').setAttribute('class', 'tab_pin hidden');
							}
							if (tabs[i].windowId == currentWindow.id) {
								document.getElementById('content').innerHTML += tabElement.outerHTML;
							} else {
								document.getElementById('separator').setAttribute('class', '');
								document.getElementById('content_others').setAttribute('class', '');
								document.getElementById('content_others').innerHTML += tabElement.outerHTML;
							}
						}

						if (tabs[0].windowId == currentWindow.id) {
							var newTabElement = template.cloneNode(true);
							newTabElement.setAttribute('class','tab new_tab');
							getFirstByClass(newTabElement, 'tab_favicon').setAttribute('class', 'tab_favicon hidden');
							getFirstByClass(newTabElement, 'tab_thumbnail').setAttribute('class', 'tab_thumbnail hidden');
							getFirstByClass(newTabElement, 'tab_title_span').setAttribute('class', 'tab_title_span hidden');
							getFirstByClass(newTabElement, 'tab_cover').setAttribute('id', 'cover_new');
							getFirstByClass(newTabElement, 'tab_cover').innerText = '+';
							getFirstByClass(newTabElement, 'tab_cover').setAttribute('title', chrome.i18n.getMessage("newTab"));
							newTabElement.removeAttribute('id');
							document.getElementById('content').innerHTML += newTabElement.outerHTML;
						}

						for (var i = 0; i < tabs.length; i++) {
							if (document.getElementById('cover_' + tabs[i].windowId + '_' + tabs[i].id) != null) {
								document.getElementById('cover_' + tabs[i].windowId + '_' + tabs[i].id).addEventListener('click', tabClicked);
							}

							if (document.getElementById('pin_' + tabs[i].windowId + '_' + tabs[i].id) != null) {
								drawPin(document.getElementById('pin_' + tabs[i].windowId + '_' + tabs[i].id), tabs[i].selected);
							}
						}
						document.getElementById('cover_new').addEventListener('click', newTabClicked);

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

function getFirstByClass(elements, className) {
	return elements.getElementsByClassName(className)[0];
}

function requestTabImages(override) {
	chrome.extension.sendMessage("requestTabImages", function(response) {
		var responseTabs = response.tabs;
		for (var k = 0; k < Object.keys(responseTabs).length; k++) {
			var kKey = Object.keys(responseTabs)[k];
			var kValue = Object.values(responseTabs)[k];
			for (var j = 0; j < Object.keys(kValue).length; j++) {
				var key = Object.keys(kValue)[j];
				var value = Object.values(kValue)[j];

				if (kKey != null && key != null && document.getElementById('thumbnail_' + kKey + '_' + key) != null) {
					var element = document.getElementById('thumbnail_' + kKey + '_' + key);
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
	chrome.windows.update(windowId, {focused: true}, function(ignore){});
	chrome.tabs.update(tabId, {active: true}, function(ignore){});
	window.close();
}

function newTabClicked(event) {
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


