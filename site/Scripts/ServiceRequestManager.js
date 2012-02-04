/// <reference path="~/Scripts/Namespaces.js" />

(function (window) {
    "use strict"
    window.registerNamespace('ElBlogo');

    ElBlogo.ServiceRequestManager = function () {
    }

    ElBlogo.ServiceRequestManager.prototype = {
        getPosts1: function (opts) {
            /// <summary>
            /// requests the current directory list from the service.
            /// </summary>
            /// <param name="opts" type="String">path to the feed/dir to fetch from</param>
            var posts = [],
                post1,post2,
                differ = $.Deferred(),
                resp = {};

            post1 = {
                id: 'post1',
                timestamp: (new Date()).getTime(),
                author: 'uri golani',
                title: 'the book of eli',
                body: 'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times' +
                    'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times ' +
                    'some chunk of words copied a few times',
                tags: ['mechanics', 'sports']
            }
            post2 = {
                id: 'post2',
                timestamp: (new Date()).getTime(),
                author: 'mor yaakobi',
                title: 'blues',
                body: 'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times' +
                    'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times ' +
                    'some chunk of words copied a few times',
                tags: ['basketball', 'sports']
            }

            posts.push(post1);
            posts.push(post2);
            resp.totalSearchPosts = 2;
            resp.lastPartitionKey = 50;
            resp.posts = posts;
            differ.resolve(resp);
            return differ.promise();
        },
        getPosts: function (opts) {
            /// <summary>
            /// requests the current directory list from the service.
            /// </summary>
            /// <param name="opts" type="String">path to the feed/dir to fetch from</param>
            var posts = [],
                post1,
                differ = $.Deferred(),
                resp = {};
            for(var i = 0; i < 25; i++){
                post1 = {
                    id: 'post1',
                    timestamp: (new Date()).getTime(),
                    author: 'uri golani',
                    title: 'the book of eli',
                    body: 'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times' +
                        'some chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few timessome chunk of words copied a few times ' +
                        'some chunk of words copied a few times',
                    tags: ['mechanics', 'sports']
                }
                posts.push(post1);
            }


            resp.totalSearchPosts = 25;
            resp.lastPartitionKey = 50;
            resp.posts = posts;
            differ.resolve(resp);
            return differ.promise();
        },


        getFeeds: function (onSuccess, path, filters) {
            /// <summary>
            /// Gets the feeds from the given directory
            /// </summary>
            /// <param name="onSuccess" type="Function">method to be applied on the feeds</param>
            /// <param name="path" type="String">path to the feed/dir to fetch from</param>
            /// <param name="filters" type="Object">filters to apply on the feeds</param>

            var request = new ElBlogo.HttpRequestBase(),
                fitlersFormatted = '',
                filterKey;

            if (!onSuccess || !path) {
                console.error("misisng arguments in call to getFeeds");
                return;
            }
            if (filters) {
                for (filterKey in filters) {
                    fitlersFormatted += filterKey + '=' + filters[filterKey] + '&';
                }
                fitlersFormatted = fitlersFormatted.substring(0, fitlersFormatted.length - 1);
            }

            request.uri = path + '?' + fitlersFormatted;
            request.responseType = 'xml';
            request.httpMethod = "GET";
            $.ajax({
                type: request.httpMethod,
                url: request.uri,
                contentType: request.contentType,
                dataType: request.responseType
            })
            .done(function (data, textStatus) {
                if (textStatus === "success") return onSuccess(data);
            });
        },
        addFeed: function (onSuccess, path, uri) {
            /// <summary>
            /// add the feed to the given path
            /// </summary>
            /// <param name="onSuccess" type="Function">method to be applied upon service approval of the addition</param>
            /// <param name="path" type="String">path to the feed/dir to add to</param>
            /// <param name="uri" type="String">uri for the feed</param>

            var request = new ElBlogo.HttpRequestBase(),
                fitlersFormatted = ''

            if (!onSuccess || !path || !uri) {
                console.error("misisng arguments in call to addFeed");
                return;
            }

            request.uri = path;
            request.contentType = 'text/xml';
            request.responseType = 'xml';
            request.requestBody = uri;
            request.httpMethod = "PUT";
            $.ajax({
                type: request.httpMethod,
                url: request.uri,
                data: request.requestBody,
                contentType: request.contentType
            })
            .done(function (data, textStatus) {
                if (textStatus === "success") return onSuccess();
            });
        },
        deleteFeed: function (onSuccess, path) {
            /// <summary>
            /// delete the feed in the given path
            /// </summary>
            /// <param name="onSuccess" type="Function">method to be applied upon service approval for the deletion</param>
            /// <param name="path" type="String">path to the feed/dir delete</param>

            var request = new ElBlogo.HttpRequestBase(),
                fitlersFormatted = ''

            if (!onSuccess || !path) {
                console.error("misisng arguments in call to deleteFeed");
                return;
            }

            request.uri = path;
            request.responseType = 'xml';
            request.httpMethod = "DELETE";

            // OnSuccess is appended to always since, some delete requests will fail. 
            // given that created directory locally has yet been updated the service.
            // Also, assuming local directory was built with the server's consent, delete failures will 
            // occur only for the the before mentioned case.
            $.ajax({
                type: request.httpMethod,
                url: request.uri,
                contentType: request.contentType
            })
            .always(function (data, textStatus) {
                return onSuccess();
            });
        }
    }
})(window)