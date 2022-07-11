
let gTabImages = {};
let gJpegQuality = 32;
let gImageDepth = 1;
let gColumns = 3;
let gBackgroundColor = 'gray';

let gLastCapturedTime = 0;

chrome.tabs.onActivated.addListener(function(activatedTabInfo) {
	updateCurrentTab(activatedTabInfo);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
	updateCurrentTab(updatedTab);
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
			updateTab(selectedTabs[0]);
		}
	});
}

function updateTab(aTab) {
	let selectedTab = aTab;
	let selectedTabId = selectedTab.id;
	let selectedWindowId = selectedTab.windowId;
	if (Date.now() - gLastCapturedTime < 100) {
		return;
	}
	gLastCapturedTime = Date.now();
	chrome.tabs.captureVisibleTab(selectedWindowId, {format: 'jpeg', quality: gJpegQuality}, function(imageUrl) {
		if (imageUrl == undefined) {
			return;
		}
		if (gTabImages[selectedWindowId] == undefined) {
			gTabImages[selectedWindowId] = [];
		}
		let newTabImageString = new String(imageUrl);
		if (newTabImageString == undefined) {
			return;
		}
		compressImage(imageUrl, selectedWindowId + "_" + selectedTabId, function(compressedImageString){
			gTabImages[selectedWindowId][selectedTabId] = compressedImageString;
			chrome.runtime.sendMessage({name: "tabImagesUpdated", tabImages: gTabImages}, function(ignore) { });
		})
	});
}

function updateSettings() {
	chrome.storage.sync.get({
		quality: 1, // low
		columns: 3,
		backgroundColor: 'gray'
	}, function(items) {
	    gImageDepth = parseInt(items.quality);
	    gColumns = parseInt(items.columns);
	    gBackgroundColor = items.backgroundColor;
	});
}

function compressImage(imageUrl, windowTabId, callback) {
	fetch(imageUrl)
		.then(response => response.blob())
		.then(function(blob) {
			createImageBitmap(blob).then(originalImage => {
				let imageSize = Math.min(originalImage.width, originalImage.height);
				let newCanvas = new OffscreenCanvas(176 * gImageDepth, 176 * gImageDepth);
				gJpegQuality = 32 * gImageDepth;
				let ctx = newCanvas.getContext('2d');
				ctx.drawImage(originalImage, 0, 0, imageSize, imageSize,
					0, 0, 176 * gImageDepth, 176 * gImageDepth);

				newCanvas.convertToBlob().then(blob => {
					const reader = new FileReader();
					reader.onload = _ => {
						callback(reader.result, windowTabId);
					}; 
					reader.readAsDataURL(blob);
				})
			});
		});
}

updateSettings();

