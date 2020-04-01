
function optionLoaded() {
  localizeMessages();
  restoreOptions();
}

function localizeMessages() {
  document.getElementById('localize_image_quality').innerHTML = chrome.i18n.getMessage("imageQuality");
  document.getElementById('localize_low').innerHTML = chrome.i18n.getMessage("low");
  document.getElementById('localize_medium').innerHTML = chrome.i18n.getMessage("medium");
  document.getElementById('localize_high').innerHTML = chrome.i18n.getMessage("high");
  document.getElementById('localize_columns').innerHTML = chrome.i18n.getMessage("columns");
  document.getElementById('localize_background_color').innerHTML = chrome.i18n.getMessage("backgroundColor");
  document.getElementById('message').innerHTML = chrome.i18n.getMessage("change_will_take_effect");
}

function changePreviewColor(color) {
  document.getElementById('options_color_preview').style.background = color;
}

function updateQuality() {
  let messageDiv = document.getElementById('message');
  messageDiv.setAttribute('class', '');

  updateOptions();
}

function updateOptions() {
  let quality = document.getElementById('quality').value;
  let columns = document.getElementById('columns').value;
  let backgroundColor = document.getElementById('backgroundColor').value;
  changePreviewColor(backgroundColor);
  chrome.storage.sync.set({
    quality: quality,
    columns: columns,
    backgroundColor: backgroundColor
  }, function() {
    chrome.extension.sendMessage({
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
    document.getElementById('quality').value = items.quality;
    document.getElementById('columns').value = items.columns;
    document.getElementById('backgroundColor').value = items.backgroundColor;
    chrome.extension.sendMessage({
                                    name: "updateSettings", 
                                 quality: items.quality, 
                                 columns: items.columns,
                         backgroundColor: items.backgroundColor
                                 }, function(ignore){});
    changePreviewColor(items.backgroundColor);
  });
}

document.addEventListener('DOMContentLoaded', optionLoaded);
document.getElementById('quality').addEventListener('change', updateQuality);
document.getElementById('columns').addEventListener('change', updateOptions);
document.getElementById('backgroundColor').addEventListener('change', updateOptions);
