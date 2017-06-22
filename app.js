(function () {
	'use strict';
	var Twitter = require('twitter');
	var client = new Twitter({
	  consumer_key: process.env.TWITTER_CONSUMER_KEY,
	  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	});
	var params = {
		screen_name: 'RealDonaldTrump',
		count: 200
	};

	var cleanArrText = (arr) => {
		return arr.map(word => {
			word = (/[\)\,\:\"]$/.test(word)) ? word.substring(0, word.length - 1) : word; // remove word-final ), comma, : and "
			word = (/^[\"\(]/.test(word)) ? word.substring(1) : word; // remove word-initial " and (
			word = (word==='&amp;') ? '&' : word;
			return word;
		});
	};

	var generateFirstWordObject = (arrOfArrs) => {
		var storage = {};
		arrOfArrs.forEach(arr => {
			arr.forEach((word, idx, arr) => {
				if (idx===0 && !storage[word]) {
					storage[word] = 1;
				} else if (idx===0) {
					storage[word]++;
				}
			});
		});
		return storage;
	};

	var generateAllWordsObject = (arrOfArrs) => {
		var storage = {};
		arrOfArrs.forEach(arr => {
			arr.forEach((word, idx, arr) => {
				var nextWord = (idx+1===arr.length) ? 'END' : arr[idx+1];
				if (!storage[word]) {
					storage[word] = [nextWord];
				} else {
					storage[word].push(nextWord);
				}
			});
		});
		return storage;
	};

	var pickFirstWord = (obj) => {
		var firstWordList = Object.keys(obj);
		var random = Math.random();

		for (let i=0; i<firstWordList.length; i++) {
			let currentWord = firstWordList[i];
			random -= (obj[currentWord] / Object.keys(obj).length);
			if (random<=0) return currentWord;
		}
	};

	var pickWords = (firstWordObj, allWordsObj) => {
		var currentWord = pickFirstWord(firstWordObj);
		var i = 0;
		var sentence = currentWord.charAt(0).toUpperCase() + currentWord.slice(1);
		var random = Math.random();

		while (currentWord!=='END' && i<160 && sentence.length<140) {
			random = Math.floor(Math.random() * allWordsObj[currentWord].length);
			currentWord = allWordsObj[currentWord][random];
			sentence = (currentWord==='END') ? sentence :
				// NOTE: Probably an error here causing inconsistent spaces bn words & punctuation at the end of the sentence
				(/^[\!\?\.]{1,}$/.test(currentWord)) ? sentence + currentWord :
				sentence + ' ' + currentWord;
			i++;
		}
		console.log(`@${params.screen_name}: ${sentence}`);
		return sentence;
	};

	client
		.get('statuses/user_timeline', params, ((error, rawTweetsArr, response) => {
		  if (error) {
				const errorMsg = (error[0].message) ? error[0].message : error;
				console.log(`Twitter error message: "${errorMsg}"`);
		  } else {
				// convert array of tweet objects to array of tweet text, filtering out RTs
				var messageTexts = rawTweetsArr.filter(tweetObj => !tweetObj.text.startsWith('RT ')).map(tweetObj =>
					// add a space before end of sentence punctuation for better parsing / more human-looking tweets
					tweetObj.text.replace(/^(.*?)([/!/?/.]*)$/, (match, p1, p2) => `${p1} ${p2}`).split(' '));
				messageTexts = messageTexts.map(cleanArrText);
				var firstWords = generateFirstWordObject(messageTexts); // format: {word: num...}
				var allWords = generateAllWordsObject(messageTexts); // format: {word: [followingWord, followingWord,...]}
				return pickWords(firstWords, allWords);
			}
		}));
}());
