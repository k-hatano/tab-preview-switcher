
function optionLoaded() {
  localizeMessages();
  restoreOptions();
}

function localizeMessages() {
  document.getElementById('localize_image_quality').innerHTML = chrome.i18n.getMessage("imageQuality");
  document.getElementById('localize_low').innerHTML = chrome.i18n.getMessage("low");
  document.getElementById('localize_high').innerHTML = chrome.i18n.getMessage("high");
  document.getElementById('localize_rows').innerHTML = chrome.i18n.getMessage("rows");
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
  chrome.storage.sync.set({
    quality: quality,
    rows: rows
  }, function() {
    chrome.extension.sendMessage({
                                    name: "updateSettings", 
                                 quality: quality, 
                                    rows: rows
                                 }, function(ignore){});
  });
}

function restoreOptions() {
  chrome.storage.sync.get({
    quality: 1, // low
    rows: 3
  }, function(items) {
    document.getElementById('quality').value = items.quality;
    document.getElementById('rows').value = items.rows;
    chrome.extension.sendMessage({
                                    name: "updateSettings", 
                                 quality: items.quality, 
                                    rows: items.rows
                                 }, function(ignore){});
  });
}

document.addEventListener('DOMContentLoaded', optionLoaded);
document.getElementById('quality').addEventListener('change', updateQuality);
document.getElementById('rows').addEventListener('change', updateOptions);
