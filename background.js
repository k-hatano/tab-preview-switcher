
var tabImages = new Array();
var jpegQuality = 20;

chrome.tabs.onActivated.addListener(function(activatedTabInfo) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg', quality: jpegQuality}, function(imageUrl) {
			tabImages[activatedTabInfo.tabId] = new String(imageUrl);
		});
	});
});

chrome.tabs.onUpdated.addListener(function(updatedTabInfo) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg', quality: jpegQuality}, function(imageUrl) {
			tabImages[updatedTabInfo.tabId] = new String(imageUrl);
		});
	});
});

chrome.tabs.onRemoved.addListener(function(removedTabId) {
	delete tabImages[removedTabId.tabId];
});

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request == "requestTabImages") {
			sendResponse({tabs: tabImages});
		} else if (request == "updateCurrentTab") {
			updateCurrentTab();
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function updateCurrentTab() {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.getSelected(aWindow.id, function(selectedTab) {
			chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg', quality: jpegQuality}, function(imageUrl) {
				tabImages[selectedTab.id] = new String(imageUrl);
				chrome.extension.sendMessage("tabImageUpdated", function(response) { });
			});
		});
	});
}