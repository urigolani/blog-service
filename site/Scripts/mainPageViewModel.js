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
            //this.userName = document.cookie.split('=')[1].trim(),

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
                    $('.searchOptions').hide();
                    $('.traversePostButton').hide();
                    // TODO - add show props to what ever will be removed for the create post page
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

            // create post event handlers
            jqDoc.on('click', '#btnCreatePost', function (event) {
                var opts = {
                    author: self.userName,
                    pKey: self.lastPartitionKey
                };

                self.serviceRequestManager.getPosts(opts).then(self.getPostsInitSuccess.bind(self), self.getPostsError.bind(self));
                self.setView('mainView');
                // TODO - code to add post
                var postTimestamp = 0, post = {}  // TODO - remove this after adding the above code
                self.serviceRequestManager.getPosts(opts).then( function(posts){
                    if(posts.length > 0 && posts[0].timestamp != postTimestamp){
                        posts.unshift(post);
                    }
                    self.getPostsInitSuccess(posts);
                }, self.getPostsError);
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
        }
    }

    window.MainController = new ElBlogo.MainController();

    $(document).ready(function () {
        window.MainController.init();
        window.MainController.bind();
    });
})(window, jQuery, Hogan)





















































//var f = function(){}
//f.prototype = {
//        generateTemplate: function (id, parentId) {
//            /// <summary>
//            /// generate template for a part and add it to the DOM.
//            /// continue traversing the dirParts tree and create templates
//            /// for children as well.
//            /// </summary>
//            /// <param name="id" type="Number">The dir part's id in the dirparts tree</param>
//            /// <param name="parentId" type="Number">The dir part's parent id in the dirparts tree</param>
//            /// <return type="Object">The part generated</param>
//            var dirPart = this.dirParts[id],
//                childId,
//                template,
//                renderedTemplate,
//                part;
//
//            renderedTemplate = this.dirPartTemplate.render(dirPart);
//            part = $(renderedTemplate)
//                .css('margin-left', dirPart.depth * partSideOffset + 'px')
//                .hide()
//                .appendTo('#' + parentId);
//
//            if (dirPart.type) {
//                for (childId in dirPart.children) {
//                    this.generateTemplate(childId, id);
//                }
//            }
//
//            return part;
//        },
//        initOptionWindow: function (mousey, isDir) {
//            /// <summary>
//            /// initialize the floating options window by repositioning it and clearing all fields
//            /// chooses which fields to display according to the item type {isDir}
//            /// </summary>
//            /// <param name="mousey" type="Number">the mouse y coordinate</param>
//            /// <param name="isDir" type="Boolean">is the item a directory</param>
//
//            // initialize input fields
//            $('.floatingOptionsInputSet').val('');
//            $('.floatingOptionsFilterSection').hide();
//            $('#floatingOptionsFiltersButton').removeClass('buttonPressed');
//            $('.floatingOptions')
//                .css('top', mousey + 'px');
//
//            if (isDir) $('.floatingOptionsFolderSection').show();
//            else $('.floatingOptionsFolderSection').hide();
//
//        },
//        removePart: function (id) {
//            /// <summary>
//            /// Remove the part marked by 'id' from the dirPart tree, removing his corresponding element in the DOM,
//            /// as well as all of his children.
//            /// update parent part of sons removal and make sure parent's 'expanded' attribute is set to false in case
//            /// it has no more children.
//            /// </summary>
//            /// <param name="id" type="Number">the part's id</param>
//
//            var part = this.dirParts[id],
//                parentId = part.parentId,
//                children = part.children,
//                parentPartChildren,
//                self = this;
//
//            //delete children bits
//            if (children) {
//                Object.keys(children).forEach(function (childKey) {
//                    self.removePart(childKey);
//                });
//            }
//
//            // if not root
//            if (parentId) {
//                parentPartChildren = this.dirParts[parentId].children;
//                // delete child from parent's children at parts logic tree
//
//                delete parentPartChildren[id];
//
//                // if the parent has no more children, make him unexpanded
//                if (Object.keys(parentPartChildren).length === 0) {
//                    $('#' + parentId).attr('expanded', 'false');
//                }
//
//                // remove child from DOM
//                $('#' + id).remove();
//            }
//        },
//        addOrUpdatePart: function (opts) {
//            /// <summary>
//            /// Checks wether the part being inserted is already contained in the
//            /// logic tree. Does not allow duplication.
//            /// </summary>
//            /// <param name="opts" type="Object">options</param>
//
//            // if sibling exists with the same name
//            for (var childKey in opts.parentPart.children) {
//                if (opts.name === this.dirParts[childKey].name)
//                    return;
//            }
//
//            // add part
//            opts.parentPart.children[opts.id] = true;
//
//            // add folder
//            this.dirParts[opts.id] = {
//                'id': opts.id,
//                'parentId': opts.parentId,
//                'name': opts.name,
//                'path': opts.parentPart.path + opts.name + '/',
//                'type': opts.isDir,
//                'depth': opts.parentPart.depth + 1,
//                'children': opts.isDir ? {} : null
//            }
//
//            this.generateTemplate(opts.id, opts.parentId).show();
//        },
//        xmlToHTML: function (xmlString) {
//            var result = '',
//                c,
//                i,
//                counter = 0;
//            for (i in xmlString) {
//                c = xmlString[i];
//                //if (c === '<')
//                //   result += '\"<';
//                // else if (c === '>')
//                //    result += '>\"';
//                // else
//                result += c;
//
//                if(counter++ % 20  === 0)
//                    result += ' <br/> ';
//
//            }
//
//
//            return result;
//        },
//        RSStoHTML: function (rssDoc) {
//
//            var root = $('#feedsView').empty();
//
//            rowElement = document.createElement('div');
//            rowElement.setAttribute("id", "item_list");
//            rowElement.setAttribute("class", "row");
//            rowElement.setAttribute("style", "margin-left: 30px;");
//
//
//            itemElement = document.createElement('div');
//            itemElement.setAttribute("class", "hero-unit");
//            // itemElement.setAttribute("style", "border-right-width: 0;");
//
//
//            headerElement = document.createElement('H4');
//            contentElement = document.createElement('p');
//            contentElement.setAttribute("style", "color: #5A3939")
//            authorElement = document.createElement('h5');
//
//            channel = rssDoc.getElementsByTagName("channel");
//            items = rssDoc.getElementsByTagName("item");
//
//            for (var i = 0; i < items.length; i++) {
//
//                next = itemElement.cloneNode(true);
//
//                item = items[i];
//                title = item.getElementsByTagName("title")[0];
//                author = item.getElementsByTagName('author')[0];
//                description = item.getElementsByTagName('description')[0];
//                category = item.getElementsByTagName('category')[0];
//
//                if (title != null) {
//                    if (title.childNodes.length > 0) {
//                        titleE = headerElement.cloneNode(true);
//                        titleE.innerText = title.childNodes[0].nodeValue;
//                        next.appendChild(titleE);
//                    }
//                }
//
//                if (author != null) {
//                    if (author.childNodes.length > 0) {
//                        authorE = authorElement.cloneNode(true);
//                        authorE.innerText = "author: " + author.childNodes[0].nodeValue;
//                        next.appendChild(authorE);
//                    }
//                }
//
//                if (description != null) {
//                    if (description.childNodes.length > 0) {
//                        descriptionE = contentElement.cloneNode(true);
//                        descriptionE.innerHTML = description.childNodes[0].nodeValue;
//                        next.appendChild(descriptionE);
//                    }
//                }
//
//                if (category != null) {
//                    if (category.childNodes.length > 0) {
//                        categoryE = authorElement.cloneNode(true);
//                        categoryE.innerText = "category: " + category.childNodes[0].nodeValue;
//                        next.appendChild(categoryE);
//                    }
//                }
//
//                next.id = "";
//
//                rowElement.appendChild(next);
//
//            }
//            root.append(rowElement);
//        },
//        configureUI: function () {
//            var jqDoc = $(document),
//                VMContext = this;
//
//            jqDoc.on('click', '.dirPartItem', function (event) {
//                var jo = $(this),
//                    id = jo.attr('id'),
//                    isExpanded = jo.attr('expanded') === 'true' ? true : false,
//                    element = VMContext.dirParts[id],
//                    isDir = element.type,
//                    children = element.children,
//                    childId,
//                    child;
//
//                event.stopPropagation();
//                VMContext.currentItem = id;
//                VMContext.initOptionWindow(event.pageY, isDir);
//
//                if (!isExpanded) $('.floatingOptions').show();
//                else $('.floatingOptions').hide();
//
//                // invert expansion property for item. and show or hide children accordingly
//                // if the item is a feed or an empty folder. do not change the expansion property. leave it as is {false}
//                if (children) {
//                    if (Object.keys(children).length > 0)
//                        jo.attr('expanded', isExpanded ? 'false' : 'true');
//
//                    // show or hide children
//                    for (childId in children) {
//                        child = $('#' + childId);
//                        if (isExpanded) {
//                            child.hide();
//                        } else {
//                            child.show();
//                        }
//                    }
//                }
//            });
//
//            jqDoc.on('click', '#floatingOptionsCreateDirButton', function (event) {
//                var parentId = VMContext.currentItem,
//                    parentPart = VMContext.dirParts[parentId],
//                    id = VMContext.genId(),
//                    name = $('.floatingOptionsItemInput').val(),
//                    opts;
//
//                event.stopPropagation();
//
//                // exit if the dir name is empty
//                if (name.length === 0) return;
//
//                opts = {
//                    'id': id,
//                    'parentId': parentId,
//                    'name': name,
//                    'parentPart': parentPart,
//                    'isDir': true
//                };
//
//                // add folder
//                VMContext.addOrUpdatePart(opts);
//            });
//
//            jqDoc.on('click', '#floatingOptionsAddFeedButton', function (event) {
//                var parentId = VMContext.currentItem,
//                    parentPart = VMContext.dirParts[parentId],
//                    id = VMContext.genId(),
//                    name = $('.floatingOptionsItemInput').val(),
//                    url = $('.floatingOptionsUrlInput').val(),
//                    path = null;
//
//                event.stopPropagation();
//                if (url.length === 0 || name.length === 0) return;
//                path = parentPart.path + name;
//
//                // update service
//                VMContext.serviceRequestManager.addFeed(function () {
//                    var opts = {
//                        'id': id,
//                        'parentId': parentId,
//                        'name': name,
//                        'parentPart': parentPart,
//                        'isDir': false
//                    };
//
//                    // add folder
//                    VMContext.addOrUpdatePart(opts);
//                }
//                , path
//                , url);
//
//                $('.floatingOptionsInputSet').val('');
//            });
//
//            jqDoc.on('click', '#floatingOptionsDeleteButton', function (event) {
//                var id = VMContext.currentItem,
//                    currentPart = VMContext.dirParts[id];
//
//                $('.floatingOptions').hide();
//
//                // update service
//                VMContext.serviceRequestManager.deleteFeed(function () {
//                    VMContext.removePart(id);
//                }
//                , currentPart.path);
//            });
//
//            jqDoc.on('click', '#floatingOptionsFiltersButton', function (event) {
//                // show/hide filters
//                if ($('#floatingOptionsFiltersButton').hasClass('buttonPressed')) {
//                    $('#floatingOptionsFiltersButton').removeClass('buttonPressed');
//                    $('.floatingOptionsFilterSection').hide();
//                } else {
//                    $('#floatingOptionsFiltersButton').addClass('buttonPressed');
//                    $('.floatingOptionsFilterSection').show();
//                }
//            });
//
//            jqDoc.on('click', '#floatingOptionsGetFeedsButton', function (event) {
//                var id = VMContext.currentItem,
//                    currentPart = VMContext.dirParts[id],
//                    filters = {},
//                    _title = $('#floatingOptionsFilterTitle').val(),
//                    _category = $('#floatingOptionsFilterCategory').val(),
//                    _author = $('#floatingOptionsFilterAuthor').val();
//
//                if (_title.length > 0) filters['title'] = _title;
//                if (_category.length > 0) filters['category'] = _category;
//                if (_author.length > 0) filters['author'] = _author;
//
//                // get feeds from service
//                VMContext.serviceRequestManager.getFeeds(function (feeds) {
//                    VMContext.RSStoHTML(feeds);
//                }
//                , currentPart.path
//                , filters);
//            });
//        }
//    }
//
//}

