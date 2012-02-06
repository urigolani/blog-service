var express = require('express').createServer(),
    fs = require('fs'),
    path = require('path');

// add a body parser to the service
express.use(require('express').bodyParser());

// web api:
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

// exports
exports.listen = function(port){
    express.listen(port);
}

//internal methods

