var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var async =  require('async');
const uuidV4 = require('uuid/v4');
const fs = require('fs');
var ObjectID = require('mongodb').ObjectID;


var urlStory = "http://www.truyenhan.com/search/label/Silent%20Horror?&max-results=10";
var totalChap = 174;
var categoryId = { $oid: "58df18813fc7d313dc6043e3"};
var lstchap = [];
var category = {};

category._id = {
  $oid: "uuidV4()"
};
category.stories = [];
function getUrlVars(url)
{
    var vars = [], hash;
    var hashes = url.slice(url.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
    
}


var urlStoryMile = urlStory.replace("?&", "?updated-max={{time}}&");


function getOptions(url){
  return  {
          url: url,
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
  };
}
var DoneFunction = function(result){
    var filename = 'stories' + uuidV4() + '.json';
    fs.writeFile(filename, JSON.stringify(result));
    console.log('Stories data saved in: ' + __dirname + '/' + filename);
    console.log('Total chap: ' + result.length);
    var filename1 = 'category' + uuidV4() + '.json';
    fs.writeFile(filename1, JSON.stringify(category));
    console.log('Stories metadata save in: ' + __dirname + '/' + filename1)
    
};

function GetRequestPage(url){
    request.get(getOptions(url), function(error, response, body) {
    if(error) {
      console.log("Error: " + error);
    }
    // Check status code (200 is HTTP OK)
    console.log("Status code: " + response.statusCode);
    if(response.statusCode === 200) {
      // Parse the document body
      var $ = cheerio.load(body, { decodeEntities: false });
      lstStories = [];
      $('.hentry').each(function(i, element){
        let link = $(element).find('a').first().attr('href');
        let name = $(element).find('div.entry-content>div').html().trim();
        lstStories.push({link: link, name: name});
      });
      if (lstStories.length == 0)
      {
            DoneFunction(lstchap);
            return;        
      }
      var lstStoriesJson = [];
      async.mapSeries(lstStories, function(item, callback){
          var options = {
            url: item.link,
            headers: {
              'Content-Type': 'text/html; charset=utf-8'
            }
          };
          var object = {};
          request(options, function(error, response, body){
              $ = cheerio.load(body, { decodeEntities: false });
              object._id = {
                $oid: new ObjectID().toString('hex')
              };
              category.stories.push(object._id);
              var title = $('.post-title').html().trim();
              object.text_pre = item.name;
              object.name = (title.split(':')[1] ? title.split(':')[1].trim(): title.split('#')[0].trim());
              object.part = totalChap--;
              object.date = $('.updated').attr('title');
              object.img_main = [];
              object.content = '';
              object.cat = categoryId;
              $('.separator>img').each(function(i, e){
                  if (i == 0)
                  {
                    object.img_pre = $(e).attr('src');
                  }
                  else object.img_main.push({"url": $(e).attr('src')});
              });
              console.log(object);
              callback(null, object);
          });
        
      }, function(err, results){
          lstchap = lstchap.concat(results);
          GetRequestPage(urlStoryMile.replace("{{time}}", results[results.length - 1].date.replace('+', '%2B')));

      });
    }
  });
}
GetRequestPage(urlStory);