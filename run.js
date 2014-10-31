var fs = require('fs'),
	xml2js = require('xml2js'),
	request = require('request'),
	parser = new xml2js.Parser(),
	counter = 0;

function scrape(url) {
	request(url, function (error, response, body) {
		parseData(body);
	});
}

function parseData(data) {
	parser.parseString(data, function (err, result) {
		result.gameset.game.forEach(parseGameData);
	});
}

function parseGameData(game) {
	if (parseFloat(game.rating) >= 4) {
		//console.log('Checking if ' + game.title + ' exists on Kongregate Wikia');
		request('http://kongregate.wikia.com/' + game.title, function (error, response) {
			if (!error && response.statusCode == 404) {
				organizeGameData(game);
			}
		});
	}
}

function organizeGameData(game) {
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

	organizedData.title = game.title[0];
	organizedData.launchDate = game.launch_date[0];
	organizedData.category = game.category[0];

	if (game.screenshot) {
		organizedData.screenshot = game.screenshot[0];
	}

	organizedData.url = game.url[0];
	organizedData.description = game.description[0];
	organizedData.instructions = game.instructions[0];
	organizedData.developerName = game.developer_name[0];

	console.log('###', organizedData);
}

scrape('http://www.kongregate.com/games_for_your_site.xml');
