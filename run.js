var fs = require('fs'),
	xml2js = require('xml2js'),
	request = require('request'),
	HtmlEntities = require('html-entities').Html5Entities,
	jsdom = require('jsdom'),
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
				getGameDetails(organizeGameData(data));
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

	return organizedData;
}

function getGameDetails(data) {
	var jquery = fs.readFileSync("./jquery.js", "utf-8");

	jsdom.env({
		url: data.url,
		src: [jquery],
		done: function (errors, window) {
			var $ = window.jQuery,
				achievments = [],
				$achievementsTemplate = $('#accomplishments_tab_pane_template'),
				$achievementsElement = $($achievementsTemplate.html());

			$achievementsElement.find('#accomplishment_vtab_set > li').each(function () {
				var $el = $(this),
					anchor = $el.find('a[href^="#achievements-"]').attr('href'),
					$imgElement = $el.find('.badge_image img'),
					name = $imgElement.attr('title'),
					image = $imgElement.attr('src'),
					level = $el.find('p').last().text(),
					description = $achievementsElement.find(anchor).find('.task_desc').text();

				achievments.push({
					name: name,
					level: level,
					image: image,
					//game: data.title,
					url: '', // TODO ?
					descrip: fixNewLines(description)
				});
			});

			console.log(achievments);
			data.achievements = achievments;
			createArticle(data);
		}
	});
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
	return str ? htmlEntities.decode(str).split('\n').join('<br>\n') : '';
}

htmlEntities = new HtmlEntities();
scrape('http://www.kongregate.com/games_for_your_site.xml');

//getGameDetails({url: 'http://www.kongregate.com/games/DJStatika/warlords-call-to-arms'});
//getGameDetails();