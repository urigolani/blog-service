var express = require('express').createServer(),
    fs = require('fs'),
    path = require('path'),
    sanitizer = require('sanitizer');
    dbClient = require('dbClientMock'); // TODO - replace with require('dbClient');

// add a body parser to the service
express.use(require('express').bodyParser());

// static file server api:
express.get('/CSS/:fileName',function (req, res){
    var filePath = path.join(__dirname, '../site/CSS', req.params.fileName);
    res.header('Content-Type', 'text/css');
    res.sendfile(filePath);
});

express.get('/Scripts/:fileName',function (req, res){
    var filePath = path.join(__dirname, '../site/Scripts', req.params.fileName);
    res.header('Content-Type', 'text/javascript');
    res.sendfile(filePath);
});

express.get('/Scripts/bootstrap/:fileName',function (req, res){
    var filePath = path.join(__dirname, '../site/Scripts/bootstrap', req.params.fileName);
    res.header('Content-Type', 'text/javascript');
    res.sendfile(filePath);
});

express.get('/',function (req, res){
    var filePath = path.join(__dirname, '../site', 'mainPage.html');
    res.header('Content-Type', 'text/html');
    res.sendfile(filePath);
});

express.get('/assets/:fileName',function (req, res){
    var filePath = path.join(__dirname, '../site/assets', req.params.fileName);
    res.header('Content-Type', 'image/png');
    res.sendfile(filePath);
});

// web api:
express.get('/getposts',validateUser, validateOptions, function (req, res){
    if(err){
        return res.send(err.message, 400);
    }

    dbclient.getPosts(req.opts, function(posts) {
        if (err){
            return res.send(err.message, 500);
        }

        res.json(posts);
    });
});

express.post('/addpost',validateUser, function (req, res){
    if(err){
        return res.send(err.message, 400);
    }
    var post = req.body,
        author; // get author from request cookie.

    post[title] = sanitizer.sanitize(post[title] || '');
    post[content] = sanitizer.sanitize(post[content] || '');
    post[timeStamp] = (new date()).getTime();
    post[tags] = (sanitizer.sanitize(post[tags] || '')).split(',');

    dbClient.addPost(post);
    res.header('Content-Type', 'text/html');
    res.send();
});

// exports
exports.listen = function(port){
    express.listen(port);
}

//internal functions:
var tagsMaxLength = 200,
    authorMaxLength = 40;

function validateOptions (req, res, next){
    if(!req.body) return next(new Error('Invalid request. Missing body'));;

    req.opts = {};
    if(req.body.author){
        if(validateAuthor(req.body.author)){
            req.opts[auther] = req.body.author;
        } else {
            return next(new Error('Invalid author'));
        }
    }

    if(req.body.fromDate){
        if (validateDate(req.body.fromDate)){
            req.opts[fromDate] = req.body.fromDate;
        } else {
            return next(new Error('Invalid fromDate'));
        }
    }

    if(req.body.untilDate){
        if(validateDate(req.body.untilDate)){
            req.opts[untilDate] = req.body.untilDate;
        } else {
            return next(new Error('Invalid untilDate'));
        }
    }

    if(req.body.tags){
        if(validateTags(req.body.tags)) {
            req.opts[tags] = req.body.tags.split(',');
        } else {
            return next(new Error('Invalid tags'));
        }
    }

    next();
}

function validateUser (req, res, next){
    // validate cookie
}

function validateAuthor(author){
    if(typeof author !== 'string') return false;
    if(author.length > authorMaxLength) return false;

    var pat = /^\w*$/g;
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
    if(typeof tags !== 'string') return false;

    if(tags.length > tagsMaxLength) return false;
    var pat = /^([a-zA-Z]+,)*[a-zA-Z]+$/g;

    if(tags.match(pat)) return true;
}