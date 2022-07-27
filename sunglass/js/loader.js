function post(url, json, callBack) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Authorization', 'Basic ' + key);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.onload = function() {
		if (this.status == 200) {
			callBack(this);
		}
	}
	xhr.send(json);

}

function get(url, callBack) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url);
	xhr.setRequestHeader('Authorization', 'Basic ' + key);
	xhr.onload = function() {
		if (this.status == 200) {
			return callBack(this);
		}
	}

	xhr.send();


}

function fetchWithAuthentication(url, authToken) {
	const headers = new Headers();
	headers.set('Authorization', authToken);
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Accept-Encoding', 'gzip,deflate');
	headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	return fetch(url, {
		headers
	});
}

async function displayProtectedImage(imageId, imageUrl, authToken) {
	try {
		// Fetch the image.
		const response = await fetchWithAuthentication(imageUrl, authToken);

		// Create an object URL from the data.
		const blob = await response.blob();
		const objectUrl = URL.createObjectURL(blob);
		const imageElement = document.getElementById(imageId);
		imageElement.src = objectUrl;
		document.getElementById(imageId + '_div').style.display = 'block';
	} catch (e) {
		console.log(e);
		console.log(imageUrl);
		console.log(imageId);
	}
}


var site = 'Sunglass';
document.title = site;

var base = 'https://dev.azure.com';
var org = 'kukhanya';
var project = 'FormForm';
var url_org = base + "/" + org;
var url_proj = url_org + "/" + project;
var version = 'api-version=6.0';
var path_workitems = '_apis/wit/workitems?ids=#ids#&' + version;
var path_workitem = '_apis/wit/workitems/#ids#?' + version + '&$expand=all';
var path_wiql = '_apis/wit/wiql?' + version;
var user = localStorage.getItem('userId');

var key = '';
var team = 'FormFormTeam';
var url_team = url_proj + '/' + team;
var tokenDate = '';

var idsArr = [];
var index;


function loadConfig(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		var ids = "",
			sep = "";
		for (var i in result.workItems) {
			ids += sep + '' + result.workItems[i].id;
			sep = ",";
		}
		get(url_proj + '/' + path_workitem.replaceAll("#ids#", ids), loadConfigItems);
	}
}

function loadConfigItems(context) {
	var result = JSON.parse(context.responseText);
	var ids = '',
		sep = '';
	for (var i in result.relations) {
		ids += sep + '' + result.relations[i].url.split('/').pop();
		sep = ",";
	}
	get(url_proj + '/' + path_workitems.replaceAll("#ids#", ids), loadConfigValues);
}
var config = {};

function loadConfigValues(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		for (var i in result.value) {
			config[result.value[i].fields['System.Title']] = result.value[i].fields['System.Description'];

		}
		document.getElementById('TelephoneID').innerHTML = config['Telephone'];
		document.getElementById('EmailID').innerHTML = config['Email'];
		document.getElementById('CopyrightID').innerHTML = config['Copyright'];
	}
}

var jsonConfig = JSON.stringify({
	"query": "Select [System.Id], [System.Title], [System.State] From WorkItems Where [State] <> 'Closed' AND [State] <> 'Removed' AND [System.WorkItemType] = 'Feature' AND [Custom.Type] = 'Config' AND [System.Title] = 'Sunglass' order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
});
key = localStorage.getItem(site + "Token")

get('https://vssps.dev.azure.com/kukhanya' + '/_apis/Token/SessionTokens?api-version=5.0-preview', loadToken);

function loadToken(context) {
	var result = JSON.parse(context.responseText);
	var date = new Date(result.value.find(x => x.displayName == site + 'Token').validTo);
	tokenDate = date.toString('YY MM DD');
	//document.getElementById('tokenDateId').innerHTML = 'Valid until ' +  formatDate(tokenDate);
	//document.getElementById('userId').innerHTML = user;					
}

function formatDate(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();

	if (month.length < 2)
		month = '0' + month;
	if (day.length < 2)
		day = '0' + day;

	return [year, month, day].join('-');
}

function loadQueries(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		for (var i in result.workItems) {
			getItemText(result.workItems[i].id);
		}
	}
}

function getItemText(id) {
	get(url_proj + '/' + path_workitem.replaceAll("#ids#", id), getItemValue);
}

function getItemValue(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		var title = result.fields['System.Title'];
		queries[title] = stripHtml(result.fields['Custom.Data']);
		console.log(title);
		switch (title) {
			case 'ConfigQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadConfig);
				break;
			case 'FlexQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadFlex);
				break;
			case 'CarouselQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadCarousel);
				break;
			case 'LogoQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadImage);
				break;
			case 'MenuQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadMenu);
				break;
			case 'ThumbnailQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadThumbs);
				break;
			case 'PageQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadPageInfo);
				break;
			default:
				break;
		}
		return result.fields['Custom.Text'];
	}
}

function stripHtml(html) {
	let tmp = document.createElement("DIV");
	tmp.innerHTML = html;
	return tmp.textContent || tmp.innerText || "";
}
var queries = []

window.onload = function() {
	var json = JSON.stringify({
		"query": "Select [System.Id], [System.Title], [System.Description] From WorkItems Where [State] <> 'Closed' AND [State] <> 'Removed' AND [System.WorkItemType] = 'Feature' AND [Custom.Type] = 'Script' order by  [Custom.Order] asc"
	});
	var json2 = JSON.stringify({
		"query": "Select [System.Id], [System.Title], [System.Description] From WorkItems Where [State] <> 'Closed' AND [State] <> 'Removed' AND [System.WorkItemType] = 'Feature' AND [Custom.Type] = 'Html' order by [Custom.Order] asc"
	});
	post(url_team + '/' + path_wiql, json2, menuHtml);
	post(url_team + '/' + path_wiql, json, loadScript);
}


function menuHtml(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		for (var i in result.workItems) {
			get(url_proj + '/' + path_workitem.replaceAll("#ids#", result.workItems[i].id), getHtml);
		}
	}
}

function getHtml(context) {
	var result = JSON.parse(context.responseText);
	console.log(result.fields['System.Title'] + "-" + result.fields['Custom.Text']);
	document.getElementById(result.fields['Custom.Text']).innerHTML = stripHtml(result.fields['Custom.Data']).replace('&nbsp', '');
}

function loadScript(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		for (var i in result.workItems) {
			get(url_proj + '/' + path_workitem.replaceAll("#ids#", result.workItems[i].id), getScript);
		}
		var json = JSON.stringify({
			"query": "Select [System.Id], [System.Title], [System.Description] From WorkItems Where [State] <> 'Closed' AND [State] <> 'Removed' AND [System.WorkItemType] = 'Feature' AND [Custom.Type] = 'Query' order by [Custom.Order] asc"
		});
		post(url_team + '/' + path_wiql, json, loadQueries);
	}
}

function getScript(context) {
	var result = JSON.parse(context.responseText);
	console.log("---" + stripHtml(result.fields['System.Title']).replace('\t', ''));
	var e = document.createElement('script');
	e.text = stripHtml(result.fields['Custom.Data']);
	document.body.appendChild(e);


}

function removeTags(str) {
	if ((str === null) || (str === ''))
		return false;
	else
		str = str.toString().trim();
	return str.replace(/(<([^>]+)>)/ig, '');
}

function loadCoordinates(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		for (var i in result.value) {

			if (result.value[i].fields['System.Title'] == "GPSLat") gpsLat = removeTags(result.value[i].fields['System.Description']);
			if (result.value[i].fields['System.Title'] == "GPSLong") gpsLong = removeTags(result.value[i].fields['System.Description']);

		}
		initMap();
	}
}
var gpsLat;
var gspLong;

function loadGPS(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		var ids = "",
			sep = "";
		for (var i in result.workItems) {
			ids += sep + '' + result.workItems[i].id
			sep = ",";
		}
		get(url_proj + '/' + path_workitems.replaceAll("#ids#", ids), loadCoordinates);
	}
}

function startGPS() {
	var json = JSON.stringify({
		"query": "Select [System.Id], [System.Title], [System.State] From WorkItems Where [State] <> 'Closed' AND [State] <> 'Removed' AND [System.WorkItemType] = 'Feature' AND [Custom.Type] = 'Config' AND ([System.Title] = 'GPSLat' OR [System.Title] = 'GPSLong') order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
	});
	post(url_team + '/' + path_wiql, json, loadGPS);
}


function initMap() {
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: {
			lat: parseFloat(gpsLat),
			lng: parseFloat(gpsLong)
		},
	});

	var image = 'images/maps-and-flags.png';
	var beachMarker = new google.maps.Marker({
		position: {
			lat: parseFloat(gpsLat),
			lng: parseFloat(gpsLong)
		},
		map: map,
		icon: image
	});
}


function loadThumbItems(context) {
	var result = JSON.parse(context.responseText);
	var temp = '<div class="container">' +
		'<div class="row">' +
		'<div class="col-md-10 offset-md-1">' +
		'<div class="titlepage">' +
		'<h2>#Title#</h2>' +
		'<p>#Description#</p>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>';
	var output = temp.replaceAll("#Title#", result.fields['System.Title']).replaceAll('#Description#', result.fields['System.Description']);
	output += '<div class="container-fluid">' +
		'<div class="row">';
	var item = '<div class="col-xl-3 col-lg-3 col-md-6 col-sm-6">' +
		'<div class="glasses_box">' +
		'<figure><div id="thumb#id#_div"><img id="thumb#id#" alt="#"/></div></figure>' +
		'<h3><span class="blu">$</span>50</h3>' +
		'<p>Sunglasses</p>' +
		'</div>' +
		'</div>';
	for (var i in result.relations) {
		output += item.replaceAll('#id#', i);
	}
	output += '</div></div>';
	document.getElementById('thumbnails').innerHTML = output;
	for (var i in result.relations) {
		displayProtectedImage('thumb' + i, result.relations[i].url, 'Basic ' + key);
	}
}

function loadThumbs(context) {
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		var ids = "",
			sep = "";
		for (var i in result.workItems) {
			ids += sep + '' + result.workItems[i].id
			sep = ",";
		}
		get(url_proj + '/' + path_workitem.replaceAll("#ids#", ids), loadThumbItems);
	}
}
var json = JSON.stringify({
	"query": "Select [System.Id], [System.Title], [System.State] From WorkItems Where [State] <> 'Closed' AND [State] <> 'Removed' AND [System.WorkItemType] = 'Feature' AND [Custom.Type] = 'Thumbnails' order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
});
post(url_team + '/' + path_wiql, json, loadThumbs);

var shared = '';
var idsArr = [];

function loadPageInfo(context) {
	get(url_proj + '/' + path_workitem.replaceAll("#ids#", JSON.parse(context.responseText).workItems[0].id), loadPageData);
}

function loadPageData(context) {
	var temp = '<h2>#Title#</h2>' +
		'<p>#Description#</p>';
	if (context.status == 200) {
		var result = JSON.parse(context.responseText);
		document.getElementById('pageTitle').innerHTML = temp.replaceAll('#Title#', result.fields['System.Title']).replaceAll('#Description#', result.fields['System.Description']);
		var ids = '';
		var sep = '';
		for (var i in result.relations) {
			idsArrP[i] = result.relations[i].url.split('/').pop();
			get(url_proj + '/' + path_workitem.replaceAll("#ids#", idsArrP[i]), loadPageImage);
			ids += sep + idsArrP[i];
			sep = ',';
		}
		get(url_proj + '/' + path_workitems.replaceAll("#ids#", ids), loadPages);

	}
}
var idsArrP = [];
function loadPageImage(context) {
	if(idsArrP.length < 1) return;
	var results = JSON.parse(context.responseText);
	var index = idsArrP.indexOf(parseInt(results.id, 10));
	if((results.relations.filter(attachment => attachment.rel == "AttachedFile").length) > 0)
	displayProtectedImage('PageImage' + index, results.relations.find(attachment => attachment.rel == "AttachedFile").url, 'Basic ' + key);
};

function loadPages(context) {
	var result = JSON.parse(context.responseText);
	for (var i in result.value) {
		document.getElementById('Page' + i).innerHTML = result.value[i].fields['System.Description'];
	}

}