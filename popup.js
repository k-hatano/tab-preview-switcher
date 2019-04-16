
window.onload = function() {
	document.getElementById('content').innerHTML = '';

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

			chrome.extension.sendMessage("tabImages", function(response) {
				var tabs = response.farewell;
				for (var i = 0; i < Object.keys(tabs).length; i++) {
					if (Object.keys(tabs)[i] != null && document.getElementById('thumbnail_' + Object.keys(tabs)[i]) != null) {
						if (Object.values(tabs)[i] == null) {
							document.getElementById('thumbnail_' + Object.keys(tabs)[i]).setAttribute('src', '');
						} else {
							document.getElementById('thumbnail_' + Object.keys(tabs)[i]).setAttribute('src', Object.values(tabs)[i]);
						}
					}
				}
			});
		});
	});	
};