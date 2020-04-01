
let tabImages = {};
let jpegQuality = 32;
let imageDepth = 1;
let columns = 3;
let backgroundColor = 'gray';

window.onload = function() {
	updateSettings();
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
			sendResponse({tabImages: tabImages, columns: columns, backgroundColor: backgroundColor});
		} else if (request.name == "updateSettings") {
			updateSettings();
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
	let originalImage = new Image();
	originalImage.src = imageUrl;

	originalImage.onload = function() {
		let imageSize = Math.min(originalImage.width, originalImage.height);
		let newCanvas = document.createElement('canvas');
		newCanvas.width = 176 * imageDepth;
		newCanvas.height = 150 * imageDepth;
		jpegQuality = 32 * imageDepth;
		let ctx = newCanvas.getContext('2d');
		ctx.drawImage(originalImage, 0, 0, imageSize, imageSize,
			0, 0, 176 * imageDepth, 176 * imageDepth);

		callback(newCanvas.toDataURL('image/jpeg', jpegQuality));
	};
}

function updateSettings() {
	chrome.storage.sync.get({
		quality: 1, // low
		columns: 3,
		backgroundColor: 'gray'
	}, function(items) {
	    imageDepth = items.quality;
	    columns = items.columns;
	    backgroundColor = items.backgroundColor;
	});
}
