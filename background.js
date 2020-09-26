
let gTabImages = {};
let gJpegQuality = 32;
let gImageDepth = 1;
let gColumns = 3;
let gBackgroundColor = 'gray';

window.onload = function() {
	updateSettings();
}

chrome.tabs.onActivated.addListener(function(activatedTabInfo) {
	chrome.tabs.captureVisibleTab(activatedTabInfo.windowId, {format: 'jpeg'}, function(imageUrl) {
		compressImage(imageUrl, function (newImageUrl){
			if (gTabImages[activatedTabInfo.windowId] == undefined) {
				gTabImages[activatedTabInfo.windowId] = {};
			}
			gTabImages[activatedTabInfo.windowId][activatedTabInfo.tabId] = new String(newImageUrl);
			chrome.extension.sendMessage({name: "tabImageUpdated", tabImages: gTabImages}, function(ignore) { });
		});
	});
});

chrome.tabs.onUpdated.addListener(function(updatedTabId, changeInfo, updatedTab) {
	if (!updatedTab.active) {
		return;
	}
	chrome.windows.getCurrent(null, function(tabCreatedWindow) {
		chrome.tabs.captureVisibleTab(tabCreatedWindow.id, {format: 'jpeg'}, function(imageUrl) {
			compressImage(imageUrl, function (newImageUrl){
				if (gTabImages[tabCreatedWindow.id] == undefined) {
					gTabImages[tabCreatedWindow.id] = {};
				}
				gTabImages[tabCreatedWindow.id][updatedTabId] = new String(newImageUrl);
				chrome.extension.sendMessage({name: "tabImageUpdated", tabImages: gTabImages}, function(ignore) { });
			});
		});
	});
});

chrome.tabs.onRemoved.addListener(function(removedTabId) {
	chrome.windows.getCurrent(null, function(tabRemovedWindow) {
		delete gTabImages[tabRemovedWindow.id][removedTabId];
	});
});

chrome.extension.onMessage.addListener(
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
		chrome.tabs.getSelected(tabUpdatedWindow.id, function(selectedTab) {
			chrome.tabs.captureVisibleTab(tabUpdatedWindow.id, {format: 'jpeg'}, function(imageUrl) {
				compressImage(imageUrl, function (newImageUrl){
					if (gTabImages[selectedTab.windowId] == undefined) {
						gTabImages[selectedTab.windowId] = {};
					}
					gTabImages[selectedTab.windowId][selectedTab.id] = new String(newImageUrl);
					chrome.extension.sendMessage({name: "tabImageUpdated", tabImages: gTabImages}, function(ignore) { });
				});
			});
		});
	});
}

function compressImage(imageUrl, callback) {
	let originalImage = new Image();
	originalImage.src = imageUrl;

	originalImage.onload = function() {
		let imageSize = Math.min(originalImage.width, originalImage.height);
		let newCanvas = document.createElement('canvas');
		newCanvas.width = 176 * gImageDepth;
		newCanvas.height = 150 * gImageDepth;
		gJpegQuality = 32 * gImageDepth;
		let ctx = newCanvas.getContext('2d');
		ctx.drawImage(originalImage, 0, 0, imageSize, imageSize,
			0, 0, 176 * gImageDepth, 176 * gImageDepth);

		callback(newCanvas.toDataURL('image/jpeg', gJpegQuality));
	};
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
