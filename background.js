
var tabImages = {};
var jpegQuality = 32;

chrome.tabs.onActivated.addListener(function(activatedTabInfo) {
	chrome.tabs.captureVisibleTab(activatedTabInfo.windowId, {format: 'jpeg'}, function(imageUrl) {
		compressImage(imageUrl, function (newImageUrl){
			if (tabImages[activatedTabInfo.windowId] == undefined) {
				tabImages[activatedTabInfo.windowId] = {};
			}
			tabImages[activatedTabInfo.windowId][activatedTabInfo.tabId] = new String(newImageUrl);
		});
	});
});

chrome.tabs.onUpdated.addListener(function(updatedTabId, changeInfo, updatedTab) {
	if (!updatedTab.selected) {
		return;
	}
	chrome.windows.getCurrent(null, function(windowUpdatedTab) {
		chrome.tabs.captureVisibleTab(windowUpdatedTab.id, {format: 'jpeg'}, function(imageUrl) {
			compressImage(imageUrl, function (newImageUrl){
				if (tabImages[windowUpdatedTab.id] == undefined) {
					tabImages[windowUpdatedTab.id] = {};
				}
				tabImages[windowUpdatedTab.id][updatedTabId] = new String(newImageUrl);
			});
		});
	});
});

chrome.tabs.onCreated.addListener(function(createdTab){
	if (!updatedTab.selected) {
		return;
	}
	chrome.windows.getCurrent(null, function(windowCreatedTab) {
		chrome.tabs.captureVisibleTab(windowCreatedTab.id, {format: 'jpeg'}, function(imageUrl) {
			compressImage(imageUrl, function (newImageUrl){
				if (tabImages[windowCreatedTab.id] == undefined) {
					tabImages[windowCreatedTab.id] = {};
				}
				tabImages[windowCreatedTab.id][updatedTabId] = new String(newImageUrl);
			});
		});
	});
});

chrome.tabs.onRemoved.addListener(function(removedTabId) {
	chrome.windows.getCurrent(null, function(windowRemovedTab) {
		delete tabImages[windowRemovedTab.id][removedTabId];
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
		chrome.tabs.getSelected(aWindow.id, function(selectedTab) {
			chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg'}, function(imageUrl) {
				compressImage(imageUrl, function (newImageUrl){
					if (tabImages[selectedTab.windowId] == undefined) {
						tabImages[selectedTab.windowId] = {};
					}
					tabImages[selectedTab.windowId][selectedTab.id] = new String(newImageUrl);
					chrome.extension.sendMessage("tabImageUpdated", function(response) { });
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
		newCanvas.width = 176;
		newCanvas.height = 150;
		var ctx = newCanvas.getContext('2d');
		ctx.drawImage(originalImage, 0, 0, imageSize, imageSize,
			0, 0, 176, 176);

		callback(newCanvas.toDataURL('image/jpeg', jpegQuality));
	};
}
