
window.onload = function() {
	document.getElementById('content').innerHTML = '';

	chrome.extension.sendMessage("updateCurrentTab", function(response) {
		chrome.windows.getCurrent(null, function(aWindow) {
			chrome.tabs.getAllInWindow(aWindow.id, function(tabs){
				var template = document.getElementById('tab_template');

				var newTabs = new Array();

				for (var i = 0; i < tabs.length; i++) {
					var tabElement = template.cloneNode(true);
					tabElement.getElementsByClassName('tab_favicon')[0].setAttribute('src', tabs[i].favIconUrl);
					tabElement.getElementsByClassName('tab_thumbnail')[0].setAttribute('id', 'thumbnail_' + tabs[i].id);
					tabElement.getElementsByClassName('tab_title_span')[0].innerText = tabs[i].title;
					tabElement.removeAttribute('id');
					if (tabs[i].selected == false) {
						tabElement.getElementsByClassName('selection')[0].removeAttribute('class');
					}
					document.getElementById('content').innerHTML += tabElement.outerHTML;

					newTabs.push(tabs[i].id);
				}

				for (var i = 0; i < tabs.length; i++) {
					document.getElementById('thumbnail_' + tabs[i].id).addEventListener('click', tabClicked);
				}

				chrome.extension.sendMessage("requestTabImages", function(response) {
					var responseTabs = response.farewell;
					for (var j = 0; j < Object.keys(responseTabs).length; j++) {
						var key = Object.keys(responseTabs)[j];
						var value = new String(Object.values(responseTabs)[j]);
						if (key != null && document.getElementById('thumbnail_' + key) != null) {
							if (value != null && value instanceof String && value != 'null') {
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
	console.log('clicked');
	var tabId = parseInt((event.target.id).replace('thumbnail_', ''));
	chrome.tabs.update(tabId, {active: true}, function(ignore){});
}