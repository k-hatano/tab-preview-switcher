
function updateOptions() {
  var quality = document.getElementById('quality').value;
  chrome.storage.sync.set({
    quality: quality
  }, function() {
    chrome.extension.sendMessage({name: "updateImageDepth", value: quality}, function(ignore){});
  });
}

function restoreOptions() {
  chrome.storage.sync.get({
    quality: 1 // low
  }, function(items) {
    document.getElementById('quality').value = items.quality;
    chrome.extension.sendMessage({name: "updateImageDepth", value: items.quality}, function(ignore){});
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('quality').addEventListener('change', updateOptions);
