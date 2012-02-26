var k=0;
exports.init = function () {};
exports.getPosts = function(opts,shouldCount, cb){
    /// <summary>
    /// requests the current directory list from the service.
    /// </summary>
    /// <param name="opts" type="String">path to the feed/dir to fetch from</param>
    var posts = [],
        post1,
        resp = {},
        i = k + 10;

    for(; k < i; k++){
        post1 = {
            id: 'post1',
            timeStamp: (new Date()).getTime(),
            author: 'uri golani' + k,
            title: 'the book of eli',
            content: 'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times' +
                'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times ' +
                'some chunk of words copied a few times',
            tags: ['mechanics']
        }
        posts.push(post1);
    }

    resp.numOfPosts = 40;
    resp.pKey = 'f50f';
    resp.posts = posts;
    cb(null,resp)
};


exports.addPost = function(post){
}
