var request = require('request'),
    async = require('async'),
    testURI = process.argv[2],
    numOfRequests = process.argv[3],
    mockUser = 'loadTest';

// a generator for posts
var generateAsyncRequest = (function(){
    var titleCounter = 0
    ,tagsList = ['sport', 'basketball', 'sleep', 'books', 'reading', 'food', 'leasure']
    ,authorList = ['uri', 'mor', 'liat'];

    function generateTags(){
        var numOfTags = Math.random() * 7
        ,i
        ,tags = '';

        for(i = 0; i < numOfTags; i++){
             tags += getRandomTag() + ',';
        }

        return tags.substring(0,tags.length - 1);
    }

    function generateAuthor(){
        var authIndex = Math.floor(Math.random() * 3);
        return authorList[authIndex];
    }

    function getRandomTag(){
        return tagsList[Math.floor(Math.random() * 7)];
    }

    function generatePost(){
        return {
            "author" : generateAuthor(),
            "title" : "LoremIpsum" + titleCounter++,
            "content" : "body",//"Lorem Ipsum dolor sit amet, consectetuer adipiscingelit. Duis tellus. Donec ante dolor, iaculis nec, gravidaac, cursus in, eros. Mauris vestibulum, felis et egestasullamcorper, purus nibh vehicula sem, eu egestas antenisl non justo. Fusce tincidunt, lorem nev dapibusconsectetuer, leo orci mollis ipsum, eget suscipit erospurus in ante.",
            s:'ss',
            "tags" : generateTags()
        }
    }

    function generateQuery(){
        return query = {
            author: generateAuthor(),
            tags: getRandomTag()
        }
    }

    function asyncRequest(httpMethod, body, target) {
        return function (cb) {
            var bodystr = JSON.stringify(body)
            ,opts = {
                method: httpMethod,
                headers: {
                    'Content-Type': 'application/json'
                },
                uri: testURI + '/' + target +'?loadtest=' + mockUser,
                body: bodystr
            };

            request(opts, function (err, response, content) {
                if (err) {
                    return cb(err);
                }

                if(response.statusCode !== 200){
                    return cb(new Error('request recieved bad status code: ' + response.statusCode + '\n'
                    + 'request body:' + bodystr));
                }
                cb(null, content);
            });
        };
    }

    // The async request generator
    return function(){
        var choice = Math.floor(Math.random() * 2)
        ,httpMethod = 'POST'
        ,body = choice ? generateQuery() : generatePost()
        ,target = choice ? 'posts' : 'addpost';

        //body = generatePost();
        //target = 'addpost';

        return asyncRequest(httpMethod, body, target);
    }
})()

function loadTest(){
    var requests = []
    ,i
    ,startTime;

    for(i = 0; i < numOfRequests; i++){
        requests.push(generateAsyncRequest());
    }

    startTime = (new Date()).getTime();
    async.parallel(requests, function (err, items) {
        var timeElapsed = (new Date()).getTime() - startTime;
        if (err){
            return console.log('load test encountered an error.\n'
                ,'timeElapsed: ', timeElapsed
                ,'err.message : ', err.message);
        }
        //console.log(items);

        console.log('all requests have returned successfuly\n'
        ,'timeElapsed: ', timeElapsed);
    });
}

// run the load test
loadTest();





