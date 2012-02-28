var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    postModel,

    // the maximum number of posts per page
    postsPageSize = 10,

    // define the post schema
    PostSchema = new Schema({
        author:  String,
        tags :[String],
        title :String,
        content: String,
        timeStamp: {type: Number}
    }),

    // csreate a post model
    PostModel = mongoose.model('Post', PostSchema);

exports.init = function(dbURI, dbPort, dbName, dbUserName, dbUserPass){
    mongoose.connect('mongodb://'.concat(dbUserName,':',dbUserPass,'@',dbURI,':',dbPort,'/',dbName));
}

exports.getPosts = function(params, shouldCount, cb) {
    var fields = ['author','tags','title','content','timeStamp','_id'],
        conditions,
        options = {};

    if (!params){
        return cb(new Error('missing params'));
    }

    conditions = {};
    if(params.pKey)
        conditions['_id'] = {$lt : params.pKey};
    if(params.author)
        conditions['author'] = params.author;
    if(params.fromDate)
        conditions['timeStamp'] = {$gte : params.fromDate};
    if(params.untilDate){
        if(conditions['timeStamp']) {
            conditions['timeStamp'].$lte = params.untilDate;
        } else {
            conditions['timeStamp'] = {$lte : params.untilDate};
        }
    }

    if(params.tags)
        conditions['tags'] = {$all : params.tags};

    options['limit'] = postsPageSize;
    options['sort'] = {'timeStamp': -1};

    if(shouldCount){
        var prev_cb = cb;
        cb = function(err, result){
            if(err) return prev_cb(err);

            PostModel.count(conditions, function(err, count){
                if(err) return prev_cb(err);

                result.numOfPosts = count;
                return prev_cb(null, result);
            });
        }
    }

    PostModel.find(conditions, fields, options, function(err, posts){
        if (err) return cb(err);

        var pKey = '';
        if(posts && (posts[posts.length-1])){
            pKey = posts[posts.length-1]._id || pKey;
        }

        cb(null, {
            'pKey': pKey,
            'posts': posts || []
        });
    });
}

exports.addPost = function(params, cb) {
    var author = params.author;
    var tags = params.tags || [];
    var title = params.title || '';
    var content = params.content;
    var timeStamp = params.timeStamp;

    if (!author || !content || !timeStamp){
        return cb(new Error("missing parameters"));
    }

    var _post = {
        'author': author,
        'tags': tags,
        'title': title ,
        'content': content,
        'timeStamp': timeStamp
    }
    return PostModel.create( _post, cb);
}
