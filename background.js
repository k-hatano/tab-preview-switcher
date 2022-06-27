
let gTabImages = {};
let gJpegQuality = 32;
let gImageDepth = 1;
let gColumns = 3;
let gBackgroundColor = 'gray';

let gLastCapturedTime = 0;

chrome.tabs.onActivated.addListener(function(activatedTabInfo) {
	updateCurrentTab();
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
	updateCurrentTab();
});

chrome.tabs.onRemoved.addListener(function(tabId) {
	let removedTabId = tabId;
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
	chrome.tabs.query({active: true, currentWindow: true}, function(selectedTabs) {
		if (selectedTabs != null && selectedTabs.length > 0) {
			let selectedTab = selectedTabs[0];
			let selectedTabId = selectedTab.id;
			let selectedWindowId = selectedTab.windowId;
			if (Date.now() - gLastCapturedTime < 100) {
				return;
			}
			console.log('updateCurrentTab captureVisibleTab start');
			gLastCapturedTime = Date.now();
			chrome.tabs.captureVisibleTab(selectedWindowId, {format: 'jpeg'}, function(imageUrl) {
				if (imageUrl == undefined) {
					console.log('updateCurrentTab captureVisibleTab image is undefined ' + activatedWindowId + "_" + activatedTabId);
					return;
				}
				if (gTabImages[selectedWindowId] == undefined) {
					gTabImages[selectedWindowId] = [];
				}
				let newTabImageString = new String(imageUrl);
				if (newTabImageString == undefined) {
					console.log('updateCurrentTab image is undefined ' + selectedWindowId + "_" + selectedTabId);
					return;
				}
				gTabImages[selectedWindowId][selectedTabId] = newTabImageString;
				chrome.runtime.sendMessage({name: "tabImagesUpdated", tabImages: gTabImages}, function(ignore) { });
				console.log('updateCurrentTab captureVisibleTab captured ' + selectedWindowId + "_" + selectedTabId);
			});
			console.log('updateCurrentTab captureVisibleTab end');
		}
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
