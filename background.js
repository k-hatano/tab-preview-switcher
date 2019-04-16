
var tabImages = new Array();

chrome.tabs.onCreated.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, null, function(imageUrl) {
			console.log(imageUrl);
			tabImages[info.tabId] = imageUrl;
		});
	});
});

chrome.tabs.onActivated.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, null, function(imageUrl) {
			console.log(imageUrl);
			tabImages[info.tabId] = imageUrl;
		});
	});
});

chrome.tabs.onRemoved.addListener(function(info) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, null, function(imageUrl) {
			console.log(imageUrl);
			delete tabImages[info.tabId];
		});
	});
});

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request == "tabImages") {
			console.dir(tabImages);
			sendResponse({farewell: tabImages});
		} else {
			sendResponse(undefined);
		}
	});