var request = require('request');
var cheerio = require('cheerio');
var async =  require('async');
const fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
var imgur = require('imgur');
var wait=require('wait.for-es6');
var host = "http://truyenfull.vn";
var urlStory = "http://truyenfull.vn/danh-sach/truyen-moi/";

let categories = [];

function getOptions(url){
  return  {
          url: url,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
          },
          proxy: 'http://proxy.fpt.vn:80'
  };
}
var DoneFunction = function(result){
    result = result.map(rs => {
        rs.date = {
            $date: new Date(rs.date)
        };
        return rs;
    });
    var filename = 'stories.json';
    fs.writeFile(filename, JSON.stringify(result));
    console.log('Stories data saved in: ' + __dirname + '/' + filename);
    console.log('Total chap: ' + result.length);
    var filename1 = 'category.json';
    fs.writeFile(filename1, JSON.stringify(categories));
    console.log('Stories metadata save in: ' + __dirname + '/' + filename1)
    
};


function GetRequestPage(url){
    request.get(getOptions(url), function(error, response, body) {
        if(error || response.statusCode != 200) {
        console.log("Error: " + error);
        }
        let $ = cheerio.load(body, { decodeEntities: false });
        let lstStories = $($('.list.list-truyen.col-xs-12')[0]).find('.row').map((i, element) => {
            let category = {};
            category._id = new ObjectID().toString('hex');
            category.author = $(element).find('span.author').html().split('</span> ')[1];
            category.totalchap = 0;
            category.stories = [];
            category.img = '';
            category.postby = {
                $oid: '58d0a633f36d281bf6178b97'
            }
            category.introduce = '';
            category.types = [];

            let link = $(element).find('.truyen-title a').attr('href');
            return {category: category, link};
        });
        
        var tasks = lstStories.map((i, element) => {
            request(getOptions(element.link), function(err, response, body){
                let $ = cheerio.load(body, { decodeEntities: false });
                let cat = element.category;
                cat.text_pre = $('.desc-text.desc-text-full').text();
                cat.img_pre = $('.book img').attr('src');
                cat.name = $('h3.title').html();
                let max = -1;
                if ($('ul.pagination').length != 0)
                {
                    let length = $('ul.pagination li a').length;
                    
                    if (length <= 4)
                    {
                        max = $($('ul.pagination li a')[length - 2]).html();
                         console.log(cat.name);
                            console.log(max);
                    }
                    else
                    {
                        if ($($('ul.pagination li a')[length - 1]).html().indexOf('Cuối') >= 0)
                        {
                            max = $($('ul.pagination li a')[length - 1]).attr('title').split('- Trang ')[1];
                            console.log(cat.name);
                            console.log(max);
                        }
                        else
                        {
                            max = $($('ul.pagination li a')[length - 2]).attr('title').split('- Trang ')[1];
                            console.log(cat.name);
                            console.log(max);
                        }
                    }
                }
                else max = 1;
                

            })
        })
        async.parallel(tasks, function(err, results){
            if (err)
            {
                console.log(err);
            }
            else
            {

            }
        });


        
        category = new ObjectID().toString('hex');
        category
    });

}

GetRequestPage(urlStory);
