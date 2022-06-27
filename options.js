
function optionLoaded() {
	localizeMessages();
	restoreOptions();
}

function localizeMessages() {
	elementById('localize_image_quality').innerHTML = chrome.i18n.getMessage("imageQuality");
	elementById('localize_low').innerHTML = chrome.i18n.getMessage("low");
	elementById('localize_medium').innerHTML = chrome.i18n.getMessage("medium");
	elementById('localize_high').innerHTML = chrome.i18n.getMessage("high");
	elementById('localize_columns').innerHTML = chrome.i18n.getMessage("columns");
	elementById('localize_background_color').innerHTML = chrome.i18n.getMessage("backgroundColor");
	elementById('message').innerHTML = chrome.i18n.getMessage("change_will_take_effect");
}

function changePreviewColor(color) {
	elementById('options_color_preview').style.background = color;
}

function updateQuality() {
	let messageDiv = elementById('message');
	messageDiv.setAttribute('class', '');

	updateOptions();
}

function updateOptions() {
	let quality = elementById('quality').value;
	let columns = elementById('columns').value;
	let backgroundColor = elementById('backgroundColor').value;
	changePreviewColor(backgroundColor);
	chrome.storage.sync.set({
		quality: quality,
		columns: columns,
		backgroundColor: backgroundColor
	}, function() {
		chrome.runtime.sendMessage({
			name: "updateSettings", 
			quality: quality, 
			columns: columns,
			backgroundColor: backgroundColor
		}, function(ignore){});
	});
}

function restoreOptions() {
	chrome.storage.sync.get({
		quality: 1, // low
		columns: 3,
		backgroundColor: 'gray'
	}, function(items) {
		elementById('quality').value = items.quality;
		elementById('columns').value = items.columns;
		elementById('backgroundColor').value = items.backgroundColor;
		chrome.runtime.sendMessage({
			name: "updateSettings", 
			quality: items.quality, 
			columns: items.columns,
			backgroundColor: items.backgroundColor
		}, function(ignore){});
		changePreviewColor(items.backgroundColor);
	});
}

document.addEventListener('DOMContentLoaded', optionLoaded);
elementById('quality').addEventListener('change', updateQuality);
elementById('columns').addEventListener('change', updateOptions);
elementById('backgroundColor').addEventListener('change', updateOptions);

function elementById(elementId) {
	return document.getElementById(elementId);
}