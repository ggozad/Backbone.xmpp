//    Backbone XMPP PubSub Storage v0.1

//    (c) 2012 Yiorgis Gozadinos, Riot AS.
//    Backbone.xmpp is distributed under the MIT license.
//    http://github.com/ggozad/Backbone.xmpp


// A simple module to replace **Backbone.sync** with *XMPP PubSub*-based
// persistence.

(function ($, _, Backbone, Strophe) {

    // A PubSub node acting as storage.
    // Create it with the `id` the node has on the XMPP server,
    // and a Strophe `connection`.
    var PubSubStorage = function(id, connection) {
        this.id = id;
        this.connection = connection;
    };

    // Attach methods to **PubSubStorage**.
    _.extend(PubSubStorage.prototype, {

        // **create** publishes to the node the model in JSON format.
        //Resolves by setting the `id` on the item and returning it.
        create: function(model) {
            var d = $.Deferred(),
                entry = $build('entry').t(JSON.stringify(model.toJSON())).tree(),
                p = this.connection.PubSub.publish(this.id, entry);
            p.done(function (id) {
                model.id = id;
                d.resolve(model);
            }).fail(d.reject);
            return d.promise();
        },

        // **update** a model by re-publishing it on the node.
        // Resolves by returning the model
        update: function(model) {
            var d = $.Deferred(),
                entry = $build('entry').t(JSON.stringify(model.toJSON())).tree(),
                p = this.connection.PubSub.publish(this.id, entry, model.id);
            p.done(function (id) {
                d.resolve(model);
            }).fail(d.reject);
            return d.promise();
        },

        // **getItem** retrieves a model from the node by `id`.
        // Resolves by returning the attributes that are different and their values.
        getItem: function(model) {
            var d = $.Deferred(),
                p = this.connection.PubSub.items(this.id, {item_ids: [model.id]});
            p.done(function (item) {
                var updated = {},
                    attrs = JSON.parse($('entry', item).text());
                _.each(attrs, function (value, key) {
                    if (model.get(key) !== value) updated[key] = value;
                });
                d.resolve(updated);
            }).fail(d.reject);
            return d.promise();
        },

        // **getItems** retrieves all items from the node.
        // Resolves by returning a list of all the models published on the node.
        getItems: function(options) {
            var d = $.Deferred(),
                p;
            p = this.connection.PubSub.items(this.id, options);
            p.done(function (items) {
                var id, attrs;
                d.resolve(_.map(items, function (item) {
                    attrs = JSON.parse($('entry', item).text());
                    attrs.id = $(item).attr('id');
                    return attrs;
                }));
            }).fail(d.reject);
            return d.promise();
        },

        // **destroy** deletes the item correcsponding to the `model` from the node.
        // Resolves by returning the `model`.
        destroy: function(model) {
            var d = $.Deferred(),
                p = this.connection.PubSub.deleteItem(this.id, model.id);
            p.done(function () {
                d.resolve(model);
            }).fail(d.reject);
            return d.promise();
        }

    });

    // **xmppAsync** is the replacement for **sync**. It delegates sync operations
    // to the model or collection's `node` property, which should be an instance
    // of **PubSubStorage**.
    Backbone.xmppSync = function(method, model, options) {

        var p,
            node = model.node || (model.collection && model.collection.node);

        options = options || {};

        // If there is no node, fail directly, somebody did not read the docs.
        if (!node) return $.Deferred().reject().promise();

        switch (method) {
            case "read":    p = typeof model.id !== 'undefined' ? node.getItem(model) : node.getItems(options); break;
            case "create":  p = node.create(model); break;
            case "update":  p = node.update(model); break;
            case "delete":  p = node.destroy(model); break;
        }

        // Fallback for old-style callbacks.
        if (options.success) p.done(options.success);
        if (options.error) p.fail(options.error);

        return p;
    };

    this.PubSubStorage = PubSubStorage;

})(this.jQuery, this._, this.Backbone, this.Strophe);
