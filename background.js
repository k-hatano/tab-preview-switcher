
var tabImages = {};
var jpegQuality = 32;
var imageDepth = 1;

window.onload = function() {
	updateImageDepth();
}

chrome.tabs.onActivated.addListener(function(activatedTabInfo) {
	chrome.tabs.captureVisibleTab(activatedTabInfo.windowId, {format: 'jpeg'}, function(imageUrl) {
		compressImage(imageUrl, function (newImageUrl){
			if (tabImages[activatedTabInfo.windowId] == undefined) {
				tabImages[activatedTabInfo.windowId] = {};
			}
			tabImages[activatedTabInfo.windowId][activatedTabInfo.tabId] = new String(newImageUrl);
			chrome.extension.sendMessage({name: "tabImageUpdated", tabImages: tabImages}, function(ignore) { });
		});
	});
});

chrome.tabs.onUpdated.addListener(function(updatedTabId) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg'}, function(imageUrl) {
			compressImage(imageUrl, function (newImageUrl){
				if (tabImages[aWindow.id] == undefined) {
					tabImages[aWindow.id] = {};
				}
				tabImages[aWindow.id][updatedTabId] = new String(newImageUrl);
				chrome.extension.sendMessage({name: "tabImageUpdated", tabImages: tabImages}, function(ignore) { });
			});
		});
	});
});

chrome.tabs.onRemoved.addListener(function(removedTabId) {
	chrome.windows.getCurrent(null, function(aWindow) {
		delete tabImages[aWindow.id][removedTabId];
	});
});

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.name == "requestTabImages") {
			sendResponse({tabImages: tabImages});
		} else if (request.name == "updateCurrentTab") {
			updateCurrentTab();
			sendResponse(undefined);
		} else if (request.name == "updateImageDepth") {
			updateImageDepth();
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function updateCurrentTab() {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.getSelected(aWindow.id, function(selectedTab) {
			chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg'}, function(imageUrl) {
				compressImage(imageUrl, function (newImageUrl){
					if (tabImages[selectedTab.windowId] == undefined) {
						tabImages[selectedTab.windowId] = {};
					}
					tabImages[selectedTab.windowId][selectedTab.id] = new String(newImageUrl);
					chrome.extension.sendMessage({name: "tabImageUpdated", tabImages: tabImages}, function(ignore) { });
				});
			});
		});
	});
}

function compressImage(imageUrl, callback) {
	var originalImage = new Image();
	originalImage.src = imageUrl;

	originalImage.onload = function() {
		var imageSize = Math.min(originalImage.width, originalImage.height);
		var newCanvas = document.createElement('canvas');
		newCanvas.width = 176 * imageDepth;
		newCanvas.height = 150 * imageDepth;
		var ctx = newCanvas.getContext('2d');
		ctx.drawImage(originalImage, 0, 0, imageSize, imageSize,
			0, 0, 176 * imageDepth, 176 * imageDepth);

		callback(newCanvas.toDataURL('image/jpeg', jpegQuality));
	};
}

function updateImageDepth() {
	chrome.storage.sync.get({
		quality: 1 // low
	}, function(items) {
	    imageDepth = items.quality;
	});
}
