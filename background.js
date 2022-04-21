
let gTabImages = {};
let gJpegQuality = 32;
let gImageDepth = 1;
let gColumns = 3;
let gBackgroundColor = 'gray';

let gLastCapturedTime = 0;

chrome.tabs.onActivated.addListener(function(activatedTabInfo) {
	if (Date.now() - gLastCapturedTime < 100) {
		return;
	}
	console.log('onActivated captureVisibleTab');
	gLastCapturedTime = Date.now();
	chrome.tabs.captureVisibleTab(activatedTabInfo.windowId, {format: 'jpeg'}, function(imageUrl) {
		if (gTabImages[activatedTabInfo.windowId] == undefined) {
			gTabImages[activatedTabInfo.windowId] = [];
		}
		gTabImages[activatedTabInfo.windowId][activatedTabInfo.tabId] = new String(imageUrl);
		chrome.runtime.sendMessage({name: "tabImageUpdated", tabImages: gTabImages}, function(ignore) { });
	});
});

chrome.tabs.onUpdated.addListener(function(updatedTabId, changeInfo, updatedTab) {
	if (!updatedTab.active) {
		return;
	}
	chrome.windows.getCurrent(null, function(tabCreatedWindow) {
		if (Date.now() - gLastCapturedTime < 100) {
			return;
		}
		console.log('onUpdated captureVisibleTab');
		gLastCapturedTime = Date.now();
		chrome.tabs.captureVisibleTab(tabCreatedWindow.id, {format: 'jpeg'}, function(imageUrl) {
			if (gTabImages[tabCreatedWindow.id] == undefined) {
				gTabImages[tabCreatedWindow.id] = [];
			}
			gTabImages[tabCreatedWindow.id][updatedTabId] = new String(imageUrl);
			chrome.runtime.sendMessage({name: "tabImageUpdated", tabImages: gTabImages}, function(ignore) { });
		});
	});
});

chrome.tabs.onRemoved.addListener(function(removedTabId) {
	chrome.windows.getCurrent(null, function(tabRemovedWindow) {
		if (gTabImages[tabRemovedWindow.id] != undefined && gTabImages[tabRemovedWindow.id][removedTabId] != undefined) {
			delete gTabImages[tabRemovedWindow.id][removedTabId];
		}
	});
});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.name == "requestTabImages") {
			sendResponse({tabImages: gTabImages});
		} else if (request.name == "updateCurrentTab") {
			updateCurrentTab();
			sendResponse({tabImages: gTabImages, columns: gColumns, backgroundColor: gBackgroundColor});
		} else if (request.name == "updateSettings") {
			updateSettings();
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function updateCurrentTab() {
	chrome.windows.getCurrent(null, function(tabUpdatedWindow) {
		chrome.tabs.query({active: true}, function(selectedTabs) {
			if (selectedTabs != null && selectedTabs.length > 0) {
				let selectedTab = selectedTabs[0];
				if (Date.now() - gLastCapturedTime < 100) {
					return;
				}
				console.log('updateCurrentTab captureVisibleTab');
				gLastCapturedTime = Date.now();
				chrome.tabs.captureVisibleTab(tabUpdatedWindow.id, {format: 'jpeg'}, function(imageUrl) {
					if (gTabImages[selectedTab.windowId] == undefined) {
						gTabImages[selectedTab.windowId] = [];
					}
					gTabImages[selectedTab.windowId][selectedTab.id] = new String(imageUrl);
					chrome.runtime.sendMessage({name: "tabImageUpdated", tabImages: gTabImages}, function(ignore) { });
				});
			}
		});
	});
}

function updateSettings() {
	chrome.storage.sync.get({
		quality: 1, // low
		columns: 3,
		backgroundColor: 'gray'
	}, function(items) {
	    gImageDepth = items.quality;
	    gColumns = items.columns;
	    gBackgroundColor = items.backgroundColor;
	});
}

updateSettings();
