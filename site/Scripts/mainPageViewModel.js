/// <reference path="~/Scripts/Namespaces.js" />
/// <reference path="~/Scripts/ServiceRequestManager.js"/>
///
/*globals, window, document, $ , Hogan*/

(function (window, $, Hogan) {
    "use strict"
    window.registerNamespace('ElBlogo');

    ElBlogo.MainController = function () {
    }

    ElBlogo.MainController.prototype = {
        ///<summary>
        /// The id counter used for name generation
        ///</summary>
        postsList: null,

        ///<summary>
        /// the index to the post list, starting from it, the posts displayed.
        ///</summary>
        postsIndex: 0,

        ///<summary>
        /// the number of posts to display.
        ///</summary>
        postChunk: 10,

        ///<summary>
        /// The total number of blog posts matching the last search query.
        ///</summary>
        totalSearchPosts: 0,

        ///<summary>
        /// The partition key for the last search.
        ///</summary>
        lastPartitionKey: 0,

        ///<summary>
        /// The service request manager
        ///</summary>
        serviceRequestManager: null,

        ///<summary>
        /// The blog post template
        ///</summary>
        postTemplate: null,

        ///<summary>
        /// The current element in the tree.
        ///</summary>
        currentItem: null,

        ///<summary>
        /// The user name
        ///</summary>
        userName: null,

        init: function () {
            var self = this;

            this.postsList = [];
            this.userName = decodeURIComponent(document.cookie.split('=')[1].trim());
            $('#userNameHeader').html(this.userName);

            this.serviceRequestManager = new ElBlogo.ServiceRequestManager();
            this.postTemplate = Hogan.compile($('#blogPostTmpl').html());
            this.setView('mainView');
            this.serviceRequestManager.getPosts({}).then(this.getPostsInitSuccess.bind(self), this.getPostsError.bind(self));
        },
        getPostsInitSuccess: function(getResp){
            ///<summary>
            /// success callback to be called on the posts retrieved via a successful getPosts
            ///</summary>
            this.clearPosts();
            this.postsList = getResp.posts;
            this.lastPartitionKey = getResp.pKey;
            this.totalSearchPosts = getResp.totalSearchPosts;
            this.traversePostsList('init');
        },
        getPostsError: function(err){

        },
        traversePostsList: function(state){
            ///<summary>
            /// traverses the posts list at postChunk at a time.
            /// Accepts 3 states 'init', 'next', and 'prev'
            /// 'init' is used to display all posts starting from position 0.
            /// 'next' is used to display all posts starting from min{postsIndex + postChunk, postsList.length}.
            /// 'prev' is used to display all posts starting from max{0, postsIndex - postChunk}.
            ///</summary>
            var childPosts = '',
                nextIndex,
                range,
                i, l, j, k, // indexes
                post,
                tagName;

            switch(state) {
                case 'init':
                    nextIndex = 0;
                    break;
                case 'next':
                    nextIndex = this.postsIndex + this.postChunk;
                    if(nextIndex > this.postsList.length) {
                        console.error('traverseListPost - out of bounds : ', nextIndex);
                        return;
                    }
                    break;
                case 'prev':
                    nextIndex = this.postsIndex - this.postChunk;
                    if(nextIndex < 0) {
                        console.error('traverseListPost - out of bounds : ', nextIndex);
                        return;
                    }
                    break;
                default:
                    console.error('traverseListPost - illegal state : ', state);
                    return;
            }

            this.postsIndex = nextIndex;
            $('#blogContainer').children().remove();

            for(i = nextIndex, l = Math.min(nextIndex + this.postChunk, this.postsList.length); i < l; i++){
                post = this.postsList[i];

                // modify tags for the blog post template
                for(j = 0, k = post.tags.length; j < k && !post.tagsReplaced; j++){
                    tagName = post.tags[j];
                    post.tags[j] = ({'name': tagName});
                }

                post.tagsReplaced = true;
                childPosts += this.postTemplate.render(post);
            }
            $('#blogContainer').append(childPosts);
            $('html, body').animate({ scrollTop: 0 }, 'slow');
            this.checkToggleNext();
            this.checkTogglePrev();
        },
        clearPosts: function(){
            var i, l;

            for(i = 0, l = this.postsList.length; i < l; i++){
                delete this.postsList[i];
            }

            this.postsList.remove(0, l);
        },
        checkToggleNext: function() {
            ///<summary>
            /// checks whether or not to display the 'next' button, depending on the
            /// number of total blog post available and the location of the current index
            ///</summary>

            if (this.postsIndex + this.postChunk < this.totalSearchPosts) {
                $('#btnNext').show();
            } else {
                $('#btnNext').hide();
            }
        },
        checkTogglePrev: function() {
            ///<summary>
            /// checks whether or not to display the 'prev' button, depending on the
            /// current post index.
            ///</summary>

            if (this.postsIndex >= this.postChunk) {
               $('#btnPrev').show();
            } else {
                $('#btnPrev').hide();
            }
        },
        setView : function(view){
            ///<summary>
            /// Changes the current screen (or view) to the one stated in the argument 'view'.
            /// displays and hide elements relevant for each screen and shows relevant animations.
            ///</summary>

            switch (view) {
                case 'mainView':
                    $('.searchOptions').hide();  // hide the side options
                    $('.traversePostButton').hide(); // hide traverse posts button.
                    $('.addPostView').hide(); // hide the add post view
                    $('.mainView').show(); // make sure the main view is visible
                    $('.centerContainer').animate({'background-color': '#2C4762'}, 'slow');
                    break;
                case 'addPostView':
                    $('.addPostInput').val(''); // make sure addPost page has clean inputs
                    $('.mainView').hide(); // hide the main view
                    $('.addPostView').show(); // show the add post view
                    $('.centerContainer').animate({'background-color': '#E0E0E0'}, 'slow');
                    break;
            }
        },
        bind: function(){
            var jqDoc = $(document),
                self = this;

            // init site handler
            jqDoc.on('click', '.initSite', function (event) {
                self.setView('mainView');
                self.serviceRequestManager.getPosts({})
                    .then(self.getPostsInitSuccess.bind(self), self.getPostsError);
            });

            // sign out handler:
            jqDoc.on('click', '.signOutLink', function (event) {
                self.serviceRequestManager.signout().done(function(){
                    window.location = '/';
                });
            });

            // blog posts - next and prev buttons handlers
            jqDoc.on('click', '#btnNext', function (event) {
                var opts = {
                    pKey: self.lastPartitionKey
                    },
                    getPostsPromise;

                event.stopPropagation();
                // check if we need to get more posts from the service
                if(self.postsList.length < self.totalSearchPosts && self.postsIndex + self.postChunk >= self.postsList.length) {
                    getPostsPromise = self.serviceRequestManager.getPosts(opts);
                    getPostsPromise.done(function(postsResponse) {
                        self.totalSearchPosts = postsResponse.totalSearchPosts;
                        self.lastPartitionKey = postsResponse.pKey;
                        self.postsList = self.postsList.concat(postsResponse.posts);
                        self.traversePostsList('next');
                    });
                } else {
                    // we have enough posts locally, or there is no more posts to milk from the service for
                    // the current search
                    self.traversePostsList('next');
                }
            });

            jqDoc.on('click', '#btnPrev', function (event) {
                self.traversePostsList('prev');
            });

            // side options event handlers
            jqDoc.on('click', '#btnMyArea', function (event) {
                var opts = {
                    author: self.userName,
                    pKey: self.lastPartitionKey
                };
                self.serviceRequestManager.getPosts(opts).then(self.getPostsInitSuccess.bind(self), self.getPostsError.bind(self));
            });

            jqDoc.on('click', '#btnAddPost', function (event) {
                self.setView('addPostView');
            });

            jqDoc.on('click', '#btnSearchOptions', function (event) {
                $('.searchOptions').toggle();
                $('.searchOptionsInput').val('');
            });

            jqDoc.on('click', '#addPostCreatePostBtn', function (event) {
                var title = $('.addPostTitleInput').val(),
                    postContent = $('.addPostContentInput').val(),
                    tags = $('.addPostTagsInput').val().split(','),
                    post = {
                        'author': self.userName,
                        'title': title,
                        'content': postContent,
                        'tags': tags
                    };

                function createPostSuccess(posts) {
                    self.serviceRequestManager.getPosts({'author': self.userName}).done(self.getPostsInitSuccess.bind(self));
                }

                function createPostError(err) {
                    alert('Service error - Post could not be added');
                }

                self.serviceRequestManager.addPost(post).then(createPostSuccess, createPostError);
                self.setView('mainView');
            });

            jqDoc.on('click', '.blogPostTag', function (event) {
                var opts,
                    jqText = $(this).text(),
                    tag = jqText.substring(1, jqText.length);
                opts = {
                    tags: [tag]
                };
                self.serviceRequestManager.getPosts(opts).then(self.getPostsInitSuccess.bind(self), self.getPostsError.bind(self));
            });

            jqDoc.on('click', '#searchOptionsSearchButton', function (event) {
                var opts,
                    tags = $('#searchOptionsTagsInput').val(),
                    fromDate = $('#searchOptionsfromDateInput').val(),
                    untilDate = $('#searchOptionsUntilDateInput').val(),
                    author = $('#searchOptionsAuthorInput').val();

                event.stopPropagation();

                if(author) {
                    if(validateAuthor(author)){
                        opts['author'] = author;
                    } else {
                        return alert('Please check the format of the AUTHOR field'); //alert error
                    }
                }

                if(fromDate){
                    if(validateDate(fromDate)){
                        opts['fromDate'] = fromDate;
                    } else {
                        return alert('Please check the format of the DATING FROM field'); //alert error
                    }
                }

                if(untilDate){
                    if(validateDate(untilDate)){
                        opts['untilDate'] = untilDate;
                    } else {
                        return alert('Please check the format of the DATING UNTIL field'); //alert error
                    }
                }

                if(tags){
                    if(validateTags(tags)){
                        opts['tags'] = tags;
                    } else {
                        return alert('Please check the format of the TAGS field'); //alert error
                    }
                }

                self.serviceRequestManager.getPosts(opts).then(self.getPostsInitSuccess.bind(self), self.getPostsError.bind(self));
            });
        }
    }

    //internal methods:
    var tagsMaxLength = 200,
        authorMaxLength = 40;
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
        if(typeof tags !== 'string') return false;

        if(tags.length > tagsMaxLength) return false;
        var pat = /^([a-zA-Z]+,)*[a-zA-Z]+$/g;

        if(tags.match(pat)) return true;
    }

    window.MainController = new ElBlogo.MainController();

    $(document).ready(function () {
        window.MainController.init();
        window.MainController.bind();
    });
})(window, jQuery, Hogan)