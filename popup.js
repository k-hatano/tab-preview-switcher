
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
					tabElement.getElementsByClassName('tab_title_span')[0].setAttribute('title', tabs[i].title + "\n" + tabs[i].url);
					tabElement.removeAttribute('id');
					if (tabs[i].selected == false) {
						tabElement.getElementsByClassName('selection')[0].removeAttribute('class');
					}
					tabElement.getElementsByClassName('tab_pin')[0].setAttribute('id', 'pin_' + tabs[i].id);
					if (tabs[i].pinned == false) {
						tabElement.getElementsByClassName('tab_pin')[0].setAttribute('class', 'tab_pin hidden');
					}
					document.getElementById('content').innerHTML += tabElement.outerHTML;

					newTabs.push(tabs[i].id);
				}

				for (var i = 0; i < tabs.length; i++) {
					if (document.getElementById('thumbnail_' + tabs[i].id) != null) {
						document.getElementById('thumbnail_' + tabs[i].id).addEventListener('click', tabClicked);
					}

					if (document.getElementById('pin_' + tabs[i].id) != null) {
						drawPin(document.getElementById('pin_' + tabs[i].id), tabs[i].selected);
					}
				}

				requestTabImages(true);
			});
		});	
	});
};

function requestTabImages(override) {
	chrome.extension.sendMessage("requestTabImages", function(response) {
		var responseTabs = response.tabs;
		for (var j = 0; j < Object.keys(responseTabs).length; j++) {
			var key = Object.keys(responseTabs)[j];
			var value = new String(Object.values(responseTabs)[j]);

			if (key != null && document.getElementById('thumbnail_' + key) != null) {
				var element = document.getElementById('thumbnail_' + key);
				if (override == false && element.getAttribute('src') != undefined) {
					continue;
				}

				if (value != null && value instanceof String && value != 'null') {
					element.setAttribute('src', value);
				} else {
					element.removeAttribute('src');
				}
			}
		}
	});
}

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request == "tabImageUpdated") {
			requestTabImages(false);
			sendResponse(undefined);
		} else {
			sendResponse(undefined);
		}
	});

function tabClicked(event) {
	console.log('clicked');
	var tabId = parseInt((event.target.id).replace('thumbnail_', ''));
	chrome.tabs.update(tabId, {active: true}, function(ignore){});
}

function drawPin(target, selected) {
	var width = 24;
	var height = 24;

	console.dir(target);

	var ctx = target.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    ctx.shadowBlur = 2;
    ctx.shadowColor = "#0004";
  	ctx.shadowOffsetX = 2;
  	ctx.shadowOffsetY = 2;

    ctx.fillStyle = selected ? "#222" : "#444";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 1 / 3, 0, Math.PI * 2, true);
    ctx.fill();
}


