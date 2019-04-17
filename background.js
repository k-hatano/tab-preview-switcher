
var tabImages = new Array();

chrome.tabs.onActivated.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, null, function(imageUrl) {
			tabImages[info.tabId] = imageUrl;
		});
	});
});

chrome.tabs.onUpdated.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, null, function(imageUrl) {
			tabImages[info.tabId] = imageUrl;
		});
	});
});

chrome.tabs.onRemoved.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, null, function(imageUrl) {
			delete tabImages[info.tabId];
		});
	});
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
		chrome.tabs.getSelected(aWindow.id, function(tab) {
			chrome.tabs.captureVisibleTab(aWindow.id, null, function(imageUrl) {
				tabImages[tab.id] = imageUrl;
				chrome.extension.sendMessage("tabImageUpdated", function(response) { });
			});
		});
	});
}