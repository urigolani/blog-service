var express = require('express'),
    app = express.createServer(),
    path = require('path'),
    sanitizer = require('sanitizer');
    dbClient = require('./dbClient');

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(authenticate);
    app.use(signInRouter);
    app.use(express.static(path.join(__dirname, '../site')));
    app.use(express.staticCache());
});

// exports
exports.listen = function(port){
    dbClient.init('localhost', 'liatz', 27017);
    app.listen(port);
}

// consts :
var maxPostLength = 50000,
    tagsMaxLength = 200,
    authorMaxLength = 40;

// web api:
app.post('/posts', verifyAuthentication, validateOptions, function (req, res){
    dbClient.getPosts(req.opts, req.opts.shouldCount, function(err, posts) {
        if (err){
            return res.send(err.message, 400);
        }

        res.json(posts);
    });
});

app.put('/signout', verifyAuthentication, function (req, res){
    res.clearCookie('username');
    res.send(200);
});

app.post('/addpost', verifyAuthentication, function (req, res){
    var post = req.body,
        err = false;
        author = req.cookies.username; // get author from request cookie.
        res.header('Content-Type', 'text/html');

    if(post['title']){
        if(typeof post['title'] === 'string' ){
            post['title'] = sanitizer.sanitize(post['title']);
        } else {
            err = true;
        }
    }

    if(post['content']){
        if(typeof post['content'] === 'string' && post['content'].length > 0 && post['content'].length < maxPostLength){
            post['content'] = sanitizer.sanitize(post['content']);
        } else {
            err = true
        }
    }

    if(post['tags'] ){
        if(typeof post['tags'] === 'string' && post['tags'].length < tagsMaxLength && validateTags(post['tags'])) {
            post['tags'] = (sanitizer.sanitize(post['tags'])).split(',');
        } else {
            err = true;
        }
    }

    post['timeStamp'] = (new Date()).getTime();

    if(err) {
        return res.send('bad reuqest', 400);
    }

    dbClient.addPost(post, function(err){
        if(err) {
            return res.send(err, 400);
        }

        res.send(200);
    });
});

//internal functions:
function validateOptions (req, res, next){
    if(!req.body) return next(new Error('Invalid request. Missing body'));
    var parsedDate;

    req.opts = {};
    if(req.body.author){
        if(validateAuthor(req.body.author)){
            req.opts['author'] = req.body.author;
        } else {
            return next(new Error('Invalid author'));
        }
    }

    if(req.body.fromDate){
        if (validateDate(req.body.fromDate)){
            parsedDate = req.body.fromDate.split('/');
            req.opts['fromDate'] = new Date(parsedDate[2],parsedDate[1], parsedDate[0]).getTime();
        } else {
            return next(new Error('Invalid fromDate'));
        }
    }

    if(req.body.untilDate){
        if(validateDate(req.body.untilDate)){
            parsedDate = req.body.untilDate.split('/');
            req.opts['untilDate'] = new Date(parsedDate[2],parsedDate[1], parsedDate[0]).getTime();
        } else {
            return next(new Error('Invalid untilDate'));
        }
    }

    if(req.body.tags){
        if(validateTags(req.body.tags)) {
            req.opts['tags'] = req.body.tags.split(',');
        } else {
            return next(new Error('Invalid tags'));
        }
    }

    req.opts.shouldCount = req.body.shouldCount;
    req.opts.pKey = req.body.pKey;
    next();
}

function authenticate (req, res, next){
    // validate cookie
    var userName = req.cookies.username || (req.url.split('?')[0] === '/' ? req.query.username : null)
        // load test special authentication permission. user is taken from the loadtest
        || req.query.loadtest
    if(userName && validateAuthor(userName)) {
        req.authenticated = true;
        req.username = userName;
        // set the userName cookie if missing from the request
        if(!req.cookies.username){
            res.cookie('username', userName, { expires: new Date(Date.now() + 11186409000), httpOnly: true });
        }
    } else {
        req.authenticated = false;
    }

    next();
}

function signInRouter (req, res, next){
    var url = req.url.split('?')[0].toLowerCase();
    if(req.authenticated) {
        if(url === '/' || url === '/signinpage.htm'){
            req.originalUrl = req.url = '/mainPage.html';
            res.cookie('name', req.username, { expires: new Date(Date.now() + 100000)});
        }
    } else  {
        if(url === '/' || url === '/mainpage.html'){
            req.originalUrl = req.url = '/signinpage.htm';
        }
    }
    next();
}

function verifyAuthentication(req, res, next){
    if(!req.authenticated){
        return res.send('not authenticated', 403);
    }

    next();
}

function validateAuthor(author){
    if(typeof author !== 'string') return false;
    if(author.length > authorMaxLength) return false;

    var pat = /^\w[\w ]*$/g;
    if(author.match(pat)) return true;
}

function validateDate(date){
    if(typeof date !== 'string') return false;
    if(date.length !== 10) return false;

    var pat = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/g;

    if(!date.match(pat))
        return false;

    var day = date.replace(pat, '$1');
    var month = date.replace(pat, '$2');
    var year = date.replace(pat, '$3');

    if (day == 31 && (month == 4 || month == 6 || month == 9 || month == 11)) {
        return false; // 31st of a month with 30 days
    } else if (day >= 30 && month == 2) {
        return false; // February 30th or 31st
    } else if (month == 2 && day == 29 && !(year % 4 == 0 && (year % 100 != 0 || year % 400 == 0))) {
        return 0; // February 29th outside a leap year
    } else {
        return true;
    }
}

function validateTags(tags){
    if(typeof tags !== 'string' || tags.length > tagsMaxLength) return false;
    var pat = /^([a-zA-Z]+,)*[a-zA-Z]+$/g;

    if(tags.match(pat)) return true;
}