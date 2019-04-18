
var tabImages = new Array();
var jpegQuality = 20;

chrome.tabs.onActivated.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg', quality: jpegQuality}, function(imageUrl) {
			tabImages[info.tabId] = new String(imageUrl);
		});
	});
});

chrome.tabs.onUpdated.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg', quality: jpegQuality}, function(imageUrl) {
			tabImages[info.tabId] = new String(imageUrl);
		});
	});
});

chrome.tabs.onRemoved.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		delete tabImages[info.tabId];
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
			chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg', quality: jpegQuality}, function(imageUrl) {
				tabImages[tab.id] = imageUrl;
				chrome.extension.sendMessage("tabImageUpdated", function(response) { });
			});
		});
	});
}