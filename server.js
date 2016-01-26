var express = require('express'),
	exphbs = require('express-handlebars'),
	http = require('http'),
	mongoose = require('mongoose'),
	twitter = require('twit'),
	_ = require('underscore');

var app = express();
var port = process.env.PORT || 3000;

// mongoose.connect('mongodb://localhost/DATABASE');

app.get('/', function (req, res) {

	res.send('Hello World!');

});

app.listen(3000, function () {

	var debug = false;

	// var debug = true;

	var verbose = false;

	var twitConfigXavierDeFrutos = {
		consumer_key:        'hHVryVa7qUIhfNIhkdJQ26kcY',
		consumer_secret:     'xCzg5oi7vXeiPI6Q8VtrFTMkx5V0FCla3QFXYRKcbzc1UW37vu',
		access_token:        '4027243637-paHzv6Q27aV5OUSa8qWpCYqKej3pptxXFdvS63A',
		access_token_secret: 'e8qGSjgGiU9pXVhykBo16dBFd378jtrmdK3mv6A2nQuhD'	
	};

	var Twit = new twitter(twitConfigXavierDeFrutos);

	var trackFields = "#git #stackoverflow #2dart #animation #autodesk #mobilegame #voxel #blender #lowpoly #3dart #blender #b3d #magicavoxel node.js #nodejs nodejs #visualstudio #typescript #threejs #socket.io #gamemaker #Coding #gamedev #indiedev #indiegame #hameart #conceptart #indiegamedev #css #html5 #programming #javascript #js #angular #angularJS #react #C# C# #untiy3D #pixelart #retrogaming #drawing #websites"
	var trackers = trackFields.split(" ");

	var blackListForRetweet = [];

	var scheduler = {
		TenSecondsEveryHour : { tickInterval : 10000, tickReturnToZero : 360 },
		TenSecondsEveryHalfHour : { tickInterval : 10000, tickReturnToZero : 180 },
		TenSecondsEveryTenMinutes : { tickInterval : 10000, tickReturnToZero : 60 },
		TenSecondsEveryFiveMinutes : { tickInterval : 10000, tickReturnToZero : 30 },
		TenSecondsEveryMinute : { tickInterval : 10000, tickReturnToZero : 6 }
	}

	var messages = {
		"greetings" : "Hi, thanks for following me ! I share cool posts about my passion for development and indie games. Please take a look at what I am working on : https://www.linkedin.com/profile/preview?vpa=pub&locale=fr_FR"
	}

	var gate = false;
	// var schedule = scheduler.TenSecondsEveryMinute;
	var schedule = scheduler.TenSecondsEveryHour;
	var tickCounter = 0;

	var mediaOnlyRetweet = true;

	var autoRetweetOnSchedule = true;

	var listID = "232350487";

	var followList = "";

	var followersList = [];


	var sendDirectMessage = function(user, msg) {

		console.log(" ======================================================  SEND DIRECT MESSAGE TO  :::  ", user);
		console.log(" ======================================================  MESSAGE  :::  ", messages[msg]);
		if(!debug)
		{
			Twit.post('direct_messages/new', { user_id: user, text: messages[msg]}, function (err, data, response) {
				console.log(data)
			});
		}

	}

	var tweet = function(tweet) {

	}

	var retweet = function(tweet) {
		var output = verbose == true ? tweet : tweet.id_str ;
		if(!debug){
			if(mediaOnlyRetweet){
				if(tweet.entities.media){
					Twit.post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
						console.log("------------------------------- [media only]");
						console.log(output);
						if(err)
						{
							console.log(data);
							console.log("------------------------------> Retweet FAILED");
						} else {
							console.log("------------------------------> Retweet OK");
						}
					});
				}
			} else {
				Twit.post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
					console.log(tweet);
					if(err)
					{
						console.log(data);
						console.log("------------------------------> Retweet FAILED");
					} else {
						console.log("------------------------------> Retweet OK");
					}
				});
			}
		} else {
			if(mediaOnlyRetweet){
				if(tweet.entities.media){
					console.log("------------------------------- [media only]");
					console.log(output);
					console.log("------------------------------> Retweet FAILED [DEBUG MODE]");
				} else {
					console.log("------------------------------- Retweet Abord NO MEDIA");
				}
			} else {
				console.log(output);
				console.log("------------------------------> Retweet FAILED [DEBUG MODE]");
			}
		}
	}

	var greetNewFollowers = function() {

		Twit.get('followers/list', {count: 200}, function(err, data, response) {
			var updatedFollowersList = [];
			var newFollowersList = [];
			_.each(data.users, function(d){
				updatedFollowersList.push(d.id_str);
			});

			if(followersList.length != 0){
				newFollowersList = _.difference(updatedFollowersList, followersList);

				_.each(newFollowersList, function(user){
					sendDirectMessage(user, "greetings");
				});
			}

			followersList = updatedFollowersList;

		});

	}

	var getFollowersList = function() {

		Twit.get('followers/list', {count: 200}, function(err, data, response) {
			console.log("*****************************")
			_.each(data.users, function(d){
				console.log("---");
				followersList.push(d.id_str);
				console.log(d.id_str);
				console.log("*****************************")
			});
		});

	}


	var retweetFromList = function() {

		Twit.get('lists/members', {list_id : listID}, function(err, data, response) {

			// console.log(data);
			_.each(data.users, function(d){
				console.log("---");
				console.log(d.id_str);
				followList += ','+d.id_str;
			});

			// console.log(data);
			Twit.get('lists/statuses', { list_id : listID, count : 100 }, function (err, data, response) {

				_.each(data, function(tweet){

					console.log("------------------------------- Retweet from list ", listID);
					retweet(tweet);

				});

			});

		});	


	}

	var TwitterBot = function() {

		
	}


	var streamStatuses = Twit.stream('statuses/filter', { follow: followList, track: trackers });
	// var streamStatuses = Twit.stream('statuses/filter', { track: trackers });

	streamStatuses.on('tweet', function (tweet) {
		
		if(gate == true && autoRetweetOnSchedule == true)
		{

			console.log("------------------------------- Retweet from Home Timeline ");
			retweet(tweet);
			

		}

	});


	getFollowersList();


	setInterval(function(){

		console.log("Tick");

		if(tickCounter == 0)
		{
			console.log("----  ", tickCounter);
			gate = true;

		} 
		else 
		{
			
			console.log("----  ", tickCounter);
			gate = false;

			if(tickCounter == schedule.tickReturnToZero)
			{
				greetNewFollowers();
				retweetFromList();
				tickCounter = -1;

			}
		}

		tickCounter++;

	}, schedule.tickInterval);


});
