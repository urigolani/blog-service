/// <reference path="~/Scripts/Namespaces.js" />

(function (window) {
    "use strict"
    window.registerNamespace('ElBlogo');

    ElBlogo.ServiceRequestManager = function () {
    }

    ElBlogo.ServiceRequestManager.prototype = {
//        getPosts1: function (opts) {
//            /// <summary>
//            /// requests the current directory list from the service.
//            /// </summary>
//            /// <param name="opts" type="String">path to the feed/dir to fetch from</param>
//            var posts = [],
//                post1,post2,
//                differ = $.Deferred(),
//                resp = {};
//
//            post1 = {
//                id: 'post1',
//                timestamp: (new Date()).getTime(),
//                author: 'uri golani',
//                title: 'the book of eli',
//                body: 'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times' +
//                    'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times ' +
//                    'some chunk of words copied a few times',
//                tags: ['mechanics', 'sports']
//            }
//            post2 = {
//                id: 'post2',
//                timestamp: (new Date()).getTime(),
//                author: 'mor yaakobi',
//                title: 'blues',
//                body: 'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times' +
//                    'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times ' +
//                    'some chunk of words copied a few times',
//                tags: ['basketball', 'sports']
//            }
//
//            posts.push(post1);
//            posts.push(post2);
//            resp.totalSearchPosts = 2;
//            resp.lastPartitionKey = 50;
//            resp.posts = posts;
//            differ.resolve(resp);
//            return differ.promise();
//        },
//        k: 0,
//        getPosts3: function (opts) {
//            /// <summary>
//            /// requests the current directory list from the service.
//            /// </summary>
//            /// <param name="opts" type="String">path to the feed/dir to fetch from</param>
//            var posts = [],
//                post1,
//                differ = $.Deferred(),
//                resp = {},
//                i = this.k + 10;
//            for(; this.k < i; this.k++){
//                post1 = {
//                    id: 'post1',
//                    timestamp: (new Date()).getTime(),
//                    author: 'uri golani' + this.k,
//                    title: 'the book of eli',
//                    body: 'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times' +
//                        'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times ' +
//                        'some chunk of words copied a few times',
//                    tags: ['mechanics', 'sports']
//                }
//                posts.push(post1);
//            }
//
//            resp.totalSearchPosts = 40;
//            resp.lastPartitionKey = 50;
//            resp.posts = posts;
//            differ.resolve(resp);
//            return differ.promise();
//        },
        addPost: function(post){
            var differ = $.Deferred(),
                request = new ElBlogo.HttpRequestBase();

            if (!post) {
                console.error("misisng post in call to addPost");
                return;
            }

            request.uri = '/addpost';
            request.contentType = 'application/json';
            request.responseType = 'text/html';
            request.requestBody = JSON.stringify(post);
            request.httpMethod = "POST";
            $.ajax({
                type: request.httpMethod,
                url: request.uri,
                data: request.requestBody,
                contentType: request.contentType
            })
            .then(function (data, textStatus) {
                if (textStatus === "success")
                    return differ.resolve();
                else differ.reject();
            }, differ.reject);

            return differ.promise();
        },
        getPosts: function(opts) {
            var differ = $.Deferred(),
                request = new ElBlogo.HttpRequestBase();

            request.uri = '/posts';
            request.contentType = 'application/json';
            request.responseType = 'application/json';
            request.requestBody = JSON.stringify(opts || {});
            request.httpMethod = "POST";
            $.ajax({
                type: request.httpMethod,
                url: request.uri,
                data: request.requestBody,
                contentType: request.contentType
            })
            .then(function (data, textStatus) {
                if (textStatus !== "success"){
                    differ.reject('get posts - service refused with response:\n' + data);
                }
                // validate response
                var numOfPosts = data.numOfPosts,
                    posts = data.posts,
                    pKey = data.pKey,
                    i, l,
                    post,
                    date,
                    day, month, hour, minutes;

                if((numOfPosts && typeof numOfPosts !== 'number')
                    || !posts || typeof posts !== 'object' || posts.length == null
                    || pKey == null || typeof pKey !== 'string'){
                    return differ.reject('getposts - response type error');
                }

                for(i = 0, l = posts.length; i < l; i++){
                    post = posts[i];
                    if(!post.author || !post.timeStamp || typeof post.timeStamp !='number' || !post.content){
                        return differ.reject();
                    }

                    date = new Date(post.timeStamp);
                    day = date.getDate();
                    month = date.getMonth();
                    hour = date.getHours();
                    minutes = date.getMinutes();
                    post.date = (day >= 10 ? '' : '0') + day + '/'
                        + (month >= 10 ? '' : '0') + month + '/'
                        + date.getFullYear() + ' '
                        + (hour >= 10 ? '' : '0') + hour + ':'
                        + (minutes >= 10 ? '' : '0') + minutes;
                }

                return differ.resolve(data);
            }, function(jqXHR, textStatus){ // TODO - check the format of jQuery promise error
                    differ.reject('getposts - ajax request failed with statuscode' + jqXHR.status);
                }
            );

            return differ.promise();
        },
        signout: function(){
            var differ = $.Deferred(),
                request = new ElBlogo.HttpRequestBase();

            request.uri = '/signout';
            request.responseType = 'text/html';
            request.httpMethod = "PUT";
            $.ajax({
                type: request.httpMethod,
                url: request.uri
            })
                .then(function (data, textStatus) {
                    if (textStatus === "success")
                        return differ.resolve();
                    else differ.reject();
                }, differ.reject);

            return differ.promise();
        }
    }
})(window)