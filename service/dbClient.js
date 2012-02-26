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
        body: String,
        timestamp: {type: Number}
    }),

    // create a post model
    PostModel = mongoose.model('Post', PostSchema);

exports.init = function(host, dbName ,port){
    mongoose.connect(host, dbName, port);
}

exports.getPosts = function(params, shouldCount, cb) {
    var fields = ['author','tags','title','body','timestamp','_id'],
        conditions;

    if (!params){
        return cb(new Error('missing params'));
    }

    conditions = {};
    if(params.pKey)
        conditions['_id'] = {$lt : params.pKey};
    if(params.author)
        conditions['author'] = params.author;
    if(params.fromDate)
        conditions['timestamp'] = {$gte : params.fromDate};
    if(params.untilDate){
        if(conditions['timestamp']) {
            conditions['timestamp'].$lte = params.untilDate;
        } else {
            conditions['timestamp'] = {$lte : params.untilDate};
        }
    }

    if(params.tags)
        conditions['tags'] = {$all : params.tags};

    conditions['limit'] = postsPageSize;
    conditions['sort'] = {'timestamp': -1};

    function callback(err, posts){
        if (err) return cb(err);

        cb(null, {
            pKey: posts[posts.length-1]._id || _id || 0,
            posts: posts || []
        });
    }

    if(shouldCount){
        var prev_cb = cb;
        cb = function(err, result){
            if(err) return prev_cb(err);

            // remove the limit and the sort for the count;
            delete conditions['limit'];
            delete conditions['sort'];
            PostModel.count(conditions, function(err, count){
                if(err) return prev_cb(err);

                result.numOfPosts = count;
                return prev_cb(null, result);
            });
        }
    }

    PostModel.find(conditions, function(err, posts){
        if (err) return cb(err);

        cb(null, {
            pKey: posts[posts.length-1]._id || _id || 0,
            posts: posts || []
        });
    });
}

exports.addPost = function(params, cb) {
    var author = params.author;
    var tags = params.tags || [];
    var title = params.title || '';
    var body = params.body;
    var timestamp = params.timestamp;

    if (!author || !body || !timestamp){
        return cb(new Error("missing parameters"));
    }

    var _post = {
        'author': author,
        'tags': tags,
        'title': title ,
        'body': body,
        'timestamp': timestamp
    }
    PostModel.create( _post, cb);
}
