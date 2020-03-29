
function optionLoaded() {
  localizeMessages();
  restoreOptions();
}

function localizeMessages() {
  document.getElementById('localize_image_quality').innerHTML = chrome.i18n.getMessage("imageQuality");
  document.getElementById('localize_low').innerHTML = chrome.i18n.getMessage("low");
  document.getElementById('localize_medium').innerHTML = chrome.i18n.getMessage("medium");
  document.getElementById('localize_high').innerHTML = chrome.i18n.getMessage("high");
  document.getElementById('localize_rows').innerHTML = chrome.i18n.getMessage("rows");
  document.getElementById('localize_background_color').innerHTML = chrome.i18n.getMessage("backgroundColor");
  document.getElementById('message').innerHTML = chrome.i18n.getMessage("change_will_take_effect");
}

function updateQuality() {
  let messageDiv = document.getElementById('message');
  messageDiv.setAttribute('class', '');

  updateOptions();
}

function updateOptions() {
  let quality = document.getElementById('quality').value;
  let rows = document.getElementById('rows').value;
  let backgroundColor = document.getElementById('backgroundColor').value;
  chrome.storage.sync.set({
    quality: quality,
    rows: rows,
    backgroundColor: backgroundColor
  }, function() {
    chrome.extension.sendMessage({
                                    name: "updateSettings", 
                                 quality: quality, 
                                    rows: rows,
                         backgroundColor: backgroundColor
                                 }, function(ignore){});
  });
}

function restoreOptions() {
  chrome.storage.sync.get({
    quality: 1, // low
    rows: 3,
    backgroundColor: 'gray'
  }, function(items) {
    document.getElementById('quality').value = items.quality;
    document.getElementById('rows').value = items.rows;
    document.getElementById('backgroundColor').value = items.backgroundColor;
    chrome.extension.sendMessage({
                                    name: "updateSettings", 
                                 quality: items.quality, 
                                    rows: items.rows,
                         backgroundColor: items.backgroundColor
                                 }, function(ignore){});
  });
}

document.addEventListener('DOMContentLoaded', optionLoaded);
document.getElementById('quality').addEventListener('change', updateQuality);
document.getElementById('rows').addEventListener('change', updateOptions);
document.getElementById('backgroundColor').addEventListener('change', updateOptions);
