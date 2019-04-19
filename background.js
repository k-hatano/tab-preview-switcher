
var tabImages = new Array();
var jpegQuality = 20;

chrome.tabs.onActivated.addListener(function(activatedTabInfo) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg'}, function(imageUrl) {
			compressImage(imageUrl, function (newImageUrl){
				tabImages[activatedTabInfo.tabId] = new String(newImageUrl);
			});
		});
	});
});

chrome.tabs.onUpdated.addListener(function(updatedTabInfo) {
	chrome.windows.getCurrent(null, function(aWindow) {
		chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg'}, function(imageUrl) {
			compressImage(imageUrl, function (newImageUrl){
				tabImages[updatedTabInfo.tabId] = new String(newImageUrl);
			});
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
			chrome.tabs.captureVisibleTab(aWindow.id, {format: 'jpeg'}, function(imageUrl) {
				compressImage(imageUrl, function (newImageUrl){
					tabImages[selectedTab.id] = new String(newImageUrl);
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
