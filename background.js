
let gTabImages = {};
let gJpegQuality = 32;
let gImageDepth = 1;
let gColumns = 3;
let gBackgroundColor = 'gray';

let gLastCapturedTime = 0;

chrome.tabs.onActivated.addListener(activatedTabInfo => {
	updateCurrentTab(activatedTabInfo, false);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, updatedTab) => {
	updateCurrentTab(updatedTab, false);
});

chrome.tabs.onRemoved.addListener(tabId => {
	let removedTabId = tabId;
	chrome.windows.getCurrent(null, tabRemovedWindow => {
		if (gTabImages[tabRemovedWindow.id] != undefined && gTabImages[tabRemovedWindow.id][removedTabId] != undefined) {
			delete gTabImages[tabRemovedWindow.id][removedTabId];
		}
	});
});

chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.name == "requestTabImages") {
			sendResponse({tabImages: gTabImages});
		} else if (request.name == "updateCurrentTab") {
			updateCurrentTab(false);
			sendResponse({tabImages: gTabImages, columns: gColumns, backgroundColor: gBackgroundColor});
		} else if (request.name == "updateSettings") {
			updateSettings();
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function updateCurrentTab(save) {
	chrome.tabs.query({active: true, currentWindow: true}, selectedTabs => {
		if (selectedTabs != null && selectedTabs.length > 0) {
			updateTab(selectedTabs[0], save);
		}
	});
}

function updateTab(aTab, save) {
	let selectedTab = aTab;
	let selectedTabId = selectedTab.id;
	let selectedWindowId = selectedTab.windowId;
	if (Date.now() - gLastCapturedTime < 100) {
		return;
	}
	gLastCapturedTime = Date.now();
	chrome.tabs.captureVisibleTab(selectedWindowId, {format: 'jpeg', quality: gJpegQuality}, imageUrl => {
		if (imageUrl == undefined) {
			return;
		}
		if (gTabImages[selectedWindowId] == undefined) {
			gTabImages[selectedWindowId] = {};
		}
		let newTabImageString = new String(imageUrl);
		if (newTabImageString == undefined) {
			return;
		}
		compressImage(imageUrl, selectedWindowId + "_" + selectedTabId, compressedImageString => {
			gTabImages[selectedWindowId][selectedTabId] = compressedImageString;
			chrome.runtime.sendMessage({name: "tabImagesUpdated", tabImages: gTabImages}, ignore => {});
			if (save) {
				getSaveTabImagesPromise();
			}
		})
	});
}

function updateSettings() {
	chrome.storage.sync.get({
		quality: 1, // low
		columns: 3,
		backgroundColor: 'gray'
	}, items => {
	    gImageDepth = parseInt(items.quality);
	    gColumns = parseInt(items.columns);
	    gBackgroundColor = items.backgroundColor;
	});
}

function compressImage(imageUrl, windowTabId, callback) {
	fetch(imageUrl)
		.then(response => response.blob())
		.then(blob => {
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



function getSaveTabImagesPromise() {
	return new Promise((fulfill, neglect) => {
		chrome.storage.local.set({
			tabImages: gTabImages
		}, _ => {
			fulfill();
		});
	});
}

function getRestoreTabImagesPromise() {
	console.log("getRestoreTabImagesPromise");
	return new Promise((fulfill, neglect) => {
		chrome.storage.local.get(['tabImages'], items => {
			try {
				gTabImages = items.tabImages;
				fulfill();
			} catch (error) {
				console.dir(error);
				neglect();
			}
		});
	});
}

function countAvailableImages() {
	let result = 0;
	for (let w in gTabImages) {
		result += gTabImages[w].length;
	}
	return result;
}

updateSettings();
if (countAvailableImages() <= 1) {
	getRestoreTabImagesPromise();
}
