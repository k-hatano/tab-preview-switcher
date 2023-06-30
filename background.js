
let gTabImages = {};
let gImageDepth = 1;
let gColumns = 3;
let gBackgroundColor = 'gray';

let gLastCapturedTime = 0;

chrome.tabs.onActivated.addListener(activatedTabInfo => {
	const activatedTab = {id: activatedTabInfo.tabId, windowId: activatedTabInfo.windowId};
	updateTab(activatedTab, true, (succeeded, error) => {
		if (succeeded == false) {
			setTimeout(_ => updateTab(activatedTab, true, (succeeded, error) => {}), 100);
		}
	});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
	requestUpdateCurrentTab(false);
});

chrome.tabs.onRemoved.addListener(tabId => {
	let removedTabId = tabId;
	chrome.windows.getCurrent(null, tabRemovedWindow => {
		if (gTabImages[tabRemovedWindow.id] != undefined && gTabImages[tabRemovedWindow.id][removedTabId] != undefined) {
			delete gTabImages[tabRemovedWindow.id][removedTabId];
		}
		triageTabImages();
	});
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
	chrome.tabs.get(tabId, newTab => {
		if (gTabImages[newTab.windowId] == undefined) {
			gTabImages[newTab.windowId] = {};
		}
		gTabImages[newTab.windowId][tabId] = gTabImages[detachInfo.oldWindowId][tabId];
	});
});

chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.name == "requestTabImages") {
			sendResponse({tabImages: gTabImages});
		} else if (request.name == "requestUpdateCurrentTab") {
			requestUpdateCurrentTab(false);
			sendResponse({tabImages: gTabImages, columns: gColumns, backgroundColor: gBackgroundColor});
		} else if (request.name == "updateSettings") {
			updateSettings();
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function triageTabImages() {
	chrome.tabs.query({}, tabs => {
		let newImages = {};
		for (let k = 0; k < Object.keys(gTabImages).length; k++) {
			let kKey = Object.keys(gTabImages)[k]; // windowId
			let kValue = Object.values(gTabImages)[k];
			for (let j = 0; j < Object.keys(kValue).length; j++) {
				let key = Object.keys(kValue)[j]; // tabId
				let value = Object.values(kValue)[j];

				if (gTabImages[kKey] != undefined && gTabImages[kKey][key] != undefined) {
					if (newImages[kKey] == undefined) {
						newImages[kKey] = {};
					}

					newImages[kKey][key] = gTabImages[kKey][key];
				}
			}
		}
		gTabImages = newImages;
		getSaveTabImagesPromise();
	});
}

function requestUpdateCurrentTab(save) {
	chrome.tabs.query({active: true, currentWindow: true}, selectedTabs => {
		if (selectedTabs != null && selectedTabs.length > 0) {
			updateTab(selectedTabs[0], save, (succeeded, error) => {});
		}
	});
}

function updateTab(aTab, save, callback) {
	let selectedTab = aTab;
	let selectedTabId = selectedTab.id;
	let selectedWindowId = selectedTab.windowId;
	if (Date.now() - gLastCapturedTime < 100) {
		callback(false);
		return;
	}
	if (gTabImages[selectedWindowId] != undefined 
			&& gTabImages[selectedWindowId][selectedTabId] != undefined
			&& Date.now() - gLastCapturedTime < 1000) {
		callback(false);
		return;
	}
	const qualities = [25, 50, 100];
	try {
		chrome.tabs.captureVisibleTab(selectedWindowId, {format: 'jpeg', quality: qualities[gImageDepth - 1]}, imageUrl => {
			if (imageUrl == undefined) {
				callback(false, "capturing failed");
				return;
			}
			if (gTabImages == undefined) {
				gTabImages = {};
			}
			if (gTabImages[selectedWindowId] == undefined) {
				gTabImages[selectedWindowId] = {};
			}
			let newTabImageString = new String(imageUrl);
			if (newTabImageString == undefined) {
				callback(false, "converting captured image failed");
				return;
			}
			gLastCapturedTime = Date.now();
			compressImage(imageUrl, selectedWindowId + "_" + selectedTabId, compressedImageString => {
				if (compressedImageString == undefined) {
					callback(false, "compressing captured image failed");
					return;
				}
				if (gTabImages == undefined) {
					gTabImages = {};
				}
				if (gTabImages[selectedWindowId] == undefined) {
					gTabImages[selectedWindowId] = {};
				}
				gTabImages[selectedWindowId][selectedTabId] = compressedImageString;
				try {
					chrome.runtime.sendMessage({name: "tabImagesUpdated", tabImages: gTabImages}, ignore => {});
				} catch (error) {
					callback(false, error);
					console.dir(error);
				}
				if (save) {
					getSaveTabImagesPromise();
				}
				callback(true, "");
			})
		});
	} catch (error) {
		console.dir(error);
		callback(false, error);
	}
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
				let newCanvas = new OffscreenCanvas(176 * gImageDepth, 150 * gImageDepth);
				let ctx = newCanvas.getContext('2d');
				ctx.drawImage(originalImage, 0, 0, imageSize, imageSize,
					0, 0, 176 * gImageDepth, 150 * gImageDepth);

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
	return new Promise((fulfill, decline) => {
		try {
			chrome.storage.local.set({
				tabImages: gTabImages
			}, _ => {
				fulfill();
			});
		} catch (error) {
			decline(error);
		}
	});
}

function getRestoreTabImagesPromise() {
	return new Promise((fulfill, decline) => {
		try {
			chrome.storage.local.get(['tabImages'], items => {
				try {
					for (let k = 0; k < Object.keys(items.tabImages).length; k++) {
						let kKey = Object.keys(items.tabImages)[k]; // windowId
						let kValue = Object.values(items.tabImages)[k];
						for (let j = 0; j < Object.keys(kValue).length; j++) {
							let key = Object.keys(kValue)[j]; // tabId
							let value = Object.values(kValue)[j];
							if (gTabImages == undefined) {
								gTabImages = {};
							}
							if (gTabImages[kKey] == undefined) {
								gTabImages[kKey] = {};
							}
							if (gTabImages[kKey][key] != undefined) {
								continue;
							}
							gTabImages[kKey][key] = value;
						}
					}
					fulfill();
				} catch (error) {
					decline(error);
				}
			});
		} catch (error) {
			decline(error);
		}
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
