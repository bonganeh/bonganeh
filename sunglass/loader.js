
//localStorage.clear();

function post(url, json, callBack, item) {
	var base = btoa(item + url + key);
	var data = getWithExpiry(base);
	if(data != null) {
		console.log('PostingDB: ' + item);
		callBack(data);
		return;
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Authorization', 'Basic ' + key);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.onload = function() {
		if (this.status == 200) { 
			console.log('Posting: ' + item);
			handleCaller(this, base, callBack, item);
		}else{
			console.log('Posting failed: ' + this.status + ":" + item);
			console.log('Posting failed: ' + url + ":" + item + ":" + json);
		}
	}
	xhr.send(json);
}

var ttls = [];

function setWithExpiry(key, value, ttl) {
	const now = new Date();
	const item = {
		value: value,
		expiry: now.getTime() + ttl,
	}
	localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key) {
	const itemStr = localStorage.getItem(key)
	if (!itemStr) {
		return null
	}
	const item = JSON.parse(itemStr);
	const now = new Date();
	if (now.getTime() > item.expiry) {
		localStorage.removeItem(key);
		return null
	}
	return item.value;
}

var config = {};
config["ttl"] = 5000;
var ttls = {};
function handleCaller(context, base, callBack, item){	
	var currttl = ttls[item];
	if(currttl == null) currttl = config["ttl"];
	setWithExpiry(base, context.responseText, currttl);
	//console.log(base);
	callBack(context.responseText);
}

function get(url, callBack, item) {
	var base = btoa(item + url + key);
	var data = getWithExpiry(base);
	//console.log('Getting len: ' + item + data);
	if(data != null) {
		console.log('GettingDB: ' + item);
		callBack(data);
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url);
	xhr.setRequestHeader('Authorization', 'Basic ' + key);
	xhr.onload = function() {
		if (this.status == 200) {
			console.log('Getting: ' + item);
			return handleCaller(this, base, callBack, item);
		}else{
			console.log('Getting failed: ' + this.status + ":" + item + ":" + url);
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
		const response = await fetchWithAuthentication(imageUrl, authToken);
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

var key = 'Om93bDNtN2pod2NuZWZ3NGw3YjJsd3VnNWw2M3J5M3psczRja3M2YWI2dGlqamJxZm5vbHE=';//localStorage.getItem(site + "Token");
//alert(key);

var base = 'https://dev.azure.com';
var org = 'kukhanya';
var project = 'FormForm';
var url_org = base + "/" + org;
var url_proj = url_org + "/" + project;
var version = 'api-version=6.0';
var path_workitems = '_apis/wit/workitems?ids=#ids#&' + version;
var path_workitem = '_apis/wit/workitems/#ids#?' + version + '&$expand=all';
var path_wiql = '_apis/wit/wiql?' + version;
var user = 'Bongani';localStorage.getItem('userId');

var team = 'FormFormTeam';
var url_team = url_proj + '/' + team;
var tokenDate = '';

var idsArr = [];
var index;


function loadConfig(context) {
		var result = JSON.parse(context);
		var ids = "",
			sep = "";
		for (var i in result.workItems) {
			ids += sep + '' + result.workItems[i].id;
			sep = ",";
		}
		get(url_proj + '/' + path_workitem.replaceAll("#ids#", ids), loadConfigItems, 'loadConfigItems' + ids);
}

function loadConfigItems(context) {
	var result = JSON.parse(context);
	var ids = '',
		sep = '';
	for (var i in result.relations) {
		ids += sep + '' + result.relations[i].url.split('/').pop();
		sep = ",";
	}
	get(url_proj + '/' + path_workitems.replaceAll("#ids#", ids), loadConfigValues, 'loadConfigValues' + ids);
}


function loadConfigValues(context) {
		var result = JSON.parse(context);
		for (var i in result.value) {
			console.log("Config: " + result.value[i].fields['System.Title'] + ":" + result.value[i].fields['Custom.Text']);
			config[result.value[i].fields['System.Title']] = result.value[i].fields['Custom.Text'];
		}
		document.getElementById('TelephoneID').innerHTML = config['Telephone'];
		document.getElementById('EmailID').innerHTML = config['Email'];
		document.getElementById('CopyrightID').innerHTML = config['Copyright'];
}

var jsonConfig = JSON.stringify({
	"query": "Select [System.Id], [System.Title], [System.State] From WorkItems Where [State] <> 'Closed' AND [State] <> 'Removed' AND [System.WorkItemType] = 'Feature' AND [Custom.Type] = 'Config' AND [System.Title] = 'Sunglass' order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
});




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
		
		var result = JSON.parse(context);
		for (var i in result.workItems) {
			getItemText(result.workItems[i].id);
		}
}

function getItemText(id) {
	get(url_proj + '/' + path_workitem.replaceAll("#ids#", id), getItemValue, 'getItemValue' + id);
}

function getItemValue(context) {
		var result = JSON.parse(context);
		var title = result.fields['System.Title'];
		queries[title] = stripHtml(result.fields['Custom.Data']);
		console.log(title);
		switch (title) {
			case 'ConfigQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadConfig, title);
				break;
			case 'FlexQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadFlex, title);
				break;
			case 'CarouselQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadCarousel, title);
				break;
			case 'LogoQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadImage, title);
				break;
			case 'MenuQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadMenu, title);
				break;
			case 'ThumbnailQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadThumbs, title);
				break;
			case 'PageQuery':
				post(url_team + '/' + path_wiql, JSON.stringify({
					"query": "" + queries[title]
				}), loadPageInfo, title);
				break;
			default:
				break;
		}
		return result.fields['Custom.Text'];
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
	post(url_team + '/' + path_wiql, json2, menuHtml, 'menuHTML');
	post(url_team + '/' + path_wiql, json, loadScript, 'loadScript');
}


function menuHtml(context) {
		var result = JSON.parse(context);
		for (var i in result.workItems) {
			get(url_proj + '/' + path_workitem.replaceAll("#ids#", result.workItems[i].id), getHtml, 'getHtml' + result.workItems[i].id);
		}
}

function getHtml(context) {
	var result = JSON.parse(context);
	console.log(result.fields['System.Title'] + "-" + result.fields['Custom.Text']);
	document.getElementById(result.fields['Custom.Text']).innerHTML = stripHtml(result.fields['Custom.Data']).replace('&nbsp', '');
}

function loadScript(context) {
		var result = JSON.parse(context);
		for (var i in result.workItems) {
			get(url_proj + '/' + path_workitem.replaceAll("#ids#", result.workItems[i].id), getScript, 'getScript' + result.workItems[i].id);
		}
		var json = JSON.stringify({
			"query": "Select [System.Id], [System.Title], [System.Description] From WorkItems Where [State] <> 'Closed' AND [State] <> 'Removed' AND [System.WorkItemType] = 'Feature' AND [Custom.Type] = 'Query' order by [Custom.Order] asc"
		});
		post(url_team + '/' + path_wiql, json, loadQueries, 'loadQueries');
}

function getScript(context) {
	var result = JSON.parse(context);
	console.log("---" + stripHtml(result.fields['System.Title']).replace('\t', ''));
	var e = document.createElement('script');
	e.text = stripHtml(result.fields['Custom.Data']);
	document.body.appendChild(e);


}



