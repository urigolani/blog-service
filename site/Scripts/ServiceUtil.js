(function(window){
    window.registerNamespace = function (namespace) {
        /// <summary>Registers a new namespace</summary>
        /// <returns type="Object">The new namespace object</returns>
        /// <remarks>Returns the existing namespace if the namespace already exists</remarks>
        var path = namespace.split('.'),
            subNamespace = null,
            currentScope = window;

        function isDefined(o, name) {
            return ({}).hasOwnProperty.call(o, name);
        }
        while (path.length > 0) {
            subNamespace = path.shift();
            if (!isDefined(currentScope, subNamespace)) {
                currentScope[subNamespace] = { __namespace: true };
            }
            currentScope = currentScope[subNamespace];
        }

        return currentScope;
    };

    // Array Remove - By John Resig (MIT Licensed)
    Array.prototype.remove = function(from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };

    window.getUrlParameters = function (url) {
        var urlParams = {},
            e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            q = url.match(/\?(.*$)/);
        if (q) {
            q = q[1];
            while (e = r.exec(q)) {
                urlParams[d(e[1])] = d(e[2]);
            }
        }
        return urlParams;
    };
})(window)