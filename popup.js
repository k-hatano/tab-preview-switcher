
window.onload = function() {
	document.getElementById('content').innerHTML = '';

	chrome.extension.sendMessage("updateCurrentTab", function(response) {
		chrome.windows.getCurrent(null, function(aWindow) {
			chrome.tabs.getAllInWindow(aWindow.id, function(tabs){
				var template = document.getElementById('tab_template').outerHTML.toString();

				for (var i = 0; i < tabs.length; i++) {
					var tabHTML = template;
					tabHTML = tabHTML.replace('FAVICON', tabs[i].favIconUrl);
					tabHTML = tabHTML.replace('THUMBNAIL_ID', 'thumbnail_' + tabs[i].id);
					tabHTML = tabHTML.replace('<!--TITLE-->', tabs[i].title);
					document.getElementById('content').innerHTML += tabHTML;
				}

				for (var i = 0; i < tabs.length; i++) {
					document.getElementById('thumbnail_' + tabs[i].id).addEventListener('click', tabClicked);
				}

				chrome.extension.sendMessage("requestTabImages", function(response) {
					var tabs = response.farewell;
					for (var i = 0; i < Object.keys(tabs).length; i++) {
						var key = Object.keys(tabs)[i];
						var value = new String(Object.values(tabs)[i]);
						if (key != null && document.getElementById('thumbnail_' + key) != null) {
							if (value != null && value instanceof String && value != 'null') {
								console.log(value)
								document.getElementById('thumbnail_' + key).setAttribute('src', value);
							} else {
								document.getElementById('thumbnail_' + key).removeAttribute('src');
							}
						}
					}
				});
			});
		});	
	});
};

function tabClicked(event) {
	var tabId = parseInt((event.target.id).replace('thumbnail_', ''));
	chrome.tabs.update(tabId, {active: true}, function(ignore){});
}