var fs = require('fs'),
	xml2js = require('xml2js'),
	request = require('request'),
	HtmlEntities = require('html-entities').Html5Entities,
	htmlEntities,
	parser = new xml2js.Parser(),
	counter = 0;

function scrape(url) {
	request(url, function (error, response, body) {
		parseData(body);
	});
}

function parseData(data) {
	parser.parseString(data, function (err, result) {
		result.gameset.game.slice(0,60).forEach(parseGameData);
	});
}

function parseGameData(data) {
	if (parseFloat(data.rating) >= 4) {
		//console.log('Checking if ' + data.title + ' exists on Kongregate Wikia');
		request('http://kongregate.wikia.com/' + data.title, function (error, response) {
			if (!error && response.statusCode == 404) {
				organizeGameData(data);
			}
		});
	}
}

function organizeGameData(data) {
	var organizedData = {
		title: null,
		launchDate: null,
		category: null,
		screenshot: null,
		url: null,
		description: null,
		instructions: null,
		developerName: null
	};

	organizedData.title = data.title[0];
	organizedData.launchDate = data.launch_date[0];
	organizedData.category = data.category[0];

	if (data.screenshot) {
		organizedData.screenshot = data.screenshot[0];
	}

	organizedData.url = data.url[0];
	organizedData.description = data.description[0];
	organizedData.instructions = data.instructions[0];
	organizedData.developerName = data.developer_name[0];

	//console.log(organizedData);
	createArticle(organizedData);
}

function createArticle(data) {
	var articleBuffer = [
		'{{Game',
		'|name =[' + data.url + ' ' + data.title + ']',
		'|image =' + data.screenshot,
		'|author =[http://www.kongregate.com/accounts/' + data.developerName + ' ' + data.developerName + ']',
		'|genre =' + data.category,
		'|pub =' + data.launchDate,
		'|iga = ',
		'|type = ',
		'|upg = ',
		'}}'
	].join('\n');

	articleBuffer += '\n' + fixNewLines(data.description);

	if (data.instructions) {
		articleBuffer += '\n==Controls==\n' + fixNewLines(data.instructions);
	}

	console.log(articleBuffer);
}

function fixNewLines(str) {
	return htmlEntities.decode(str).split('\n').join('<br>\n');
}

htmlEntities = new HtmlEntities();
scrape('http://www.kongregate.com/games_for_your_site.xml');
