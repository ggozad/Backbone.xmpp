//    XMPP plugins for Strophe v0.1

//    (c) 2012 Yiorgis Gozadinos, Riot AS.
//    strophe.plugins is distributed under the MIT license.
//    http://github.com/ggozad/strophe.plugins


// A Pub-Sub plugin partially implementing
// [XEP-0060 Publish-Subscribe](http://xmpp.org/extensions/xep-0060.html)

(function ($, _, Backbone, Strophe) {

    // Add the **PubSub** plugin to Strophe
    Strophe.addConnectionPlugin('PubSub', {

        _connection: null,
        service: null,
        events: {},

        // **init** adds the various namespaces we use, as well as extends `events` from
        // **Backbone.Events**.
        init: function (conn) {
            this._connection = conn;
            Strophe.addNamespace('PUBSUB', 'http://jabber.org/protocol/pubsub');
            Strophe.addNamespace('PUBSUB_EVENT', Strophe.NS.PUBSUB + '#event');
            Strophe.addNamespace('PUBSUB_OWNER', Strophe.NS.PUBSUB + '#owner');
            Strophe.addNamespace('PUBSUB_NODE_CONFIG', Strophe.NS.PUBSUB + '#node_config');
            Strophe.addNamespace('ATOM', 'http://www.w3.org/2005/Atom');
            Strophe.addNamespace('DELAY', 'urn:xmpp:delay');
            _.extend(this.events, Backbone.Events);
        },

        // Register to PEP events when connected
        statusChanged: function (status, condition) {
            if (status === Strophe.Status.CONNECTED || status === Strophe.Status.ATTACHED) {
                this.service =  'pubsub.' + Strophe.getDomainFromJid(this._connection.jid);
                this._connection.addHandler(this._onReceivePEPEvent.bind(this), null, 'message', null, null, this.service);
            }
        },

        // Handle PEP events and trigger own events.
        _onReceivePEPEvent: function (ev) {
            var that = this,
                delay = $('delay[xmlns="' + Strophe.NS.DELAY + '"]', ev).attr('stamp');
            $('item', ev).each(function (idx, item) {
                var node = $(item).parent().attr('node'),
                    id = $(item).attr('id'),
                    entry = $('entry', item).filter(':first');
                if (entry.length) {
                    entry = entry[0];
                } else {
                    entry = null;
                }

                if (delay) {

                    // PEP event for the last-published item on a node.
                    that.events.trigger('xmpp:pubsub:last-published-item', {
                        node: node,
                        id: id,
                        entry: entry,
                        timestamp: delay
                    });
                    that.events.trigger('xmpp:pubsub:last-published-item:' + node, {
                        id: id,
                        entry: entry,
                        timestamp: delay
                    });
                } else {

                    // PEP event for an item newly published on a node.
                    that.events.trigger('xmpp:pubsub:item-published', {
                        node: node,
                        id: id,
                        entry: entry
                    });
                    that.events.trigger('xmpp:pubsub:item-published:' + node, {
                        id: id,
                        entry: entry
                    });
                }
            });

            // PEP event for the item deleted from a node.
            $('retract', ev).each(function (idx, item) {
                var node = $(item).parent().attr('node'),
                    id = $(item).attr('id');
                that.events.trigger('xmpp:pubsub:item-deleted', {node: node, id: id});
                that.events.trigger('xmpp:pubsub:item-deleted:' + node, {id: id});
            });

            return true;
        },

        // **createNode** creates a PubSub node with id `node` with configuration options defined by `options`.
        // See [http://xmpp.org/extensions/xep-0060.html#owner-create](http://xmpp.org/extensions/xep-0060.html#owner-create)
        createNode: function (node, options) {
            var d = $.Deferred(),
                iq = $iq({to: this.service, type: 'set', id: this._connection.getUniqueId('pubsub')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('create', {node: node}),
                fields = [],
                option,
                form;

            if (options) {
                fields.push(new Strophe.x.Field({'var': 'FORM_TYPE', type: 'hidden', value: Strophe.NS.PUBSUB_NODE_CONFIG}));
                _.each(options, function (value, option) {
                    fields.push(new Strophe.x.Field({'var': option, value: value}));
                });
                form = new Strophe.x.Form({type: 'submit', fields: fields});
                iq.up().c('configure').cnode(form.toXML());
            }
            this._connection.sendIQ(iq, d.resolve, d.reject);
            return d.promise();
        },

        // **deleteNode** deletes the PubSub node with id `node`.
        // See [http://xmpp.org/extensions/xep-0060.html#owner-delete](http://xmpp.org/extensions/xep-0060.html#owner-delete)
        deleteNode: function (node) {
            var d = $.Deferred(),
                iq = $iq({to: this.service, type: 'set', id: this._connection.getUniqueId('pubsub')})
                .c('pubsub', {xmlns: Strophe.NS.PUBSUB_OWNER})
                .c('delete', {node: node});

            this._connection.sendIQ(iq, d.resolve, d.reject);
            return d.promise();
        },

        // **getNodeConfig** returns the node's with id `node` configuration options in JSON format.
        // See [http://xmpp.org/extensions/xep-0060.html#owner-configure](http://xmpp.org/extensions/xep-0060.html#owner-configure)
        getNodeConfig: function (node) {
            var d = $.Deferred(),
                iq = $iq({to: this.service, type: 'get', id: this._connection.getUniqueId('pubsub')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB_OWNER})
                    .c('configure', {node: node}),
                form;
            this._connection.sendIQ(iq, function (result) {
                form = Strophe.x.Form.fromXML($('x', result));
                d.resolve(form.toJSON().fields);
            }, d.reject);
            return d.promise();
        },

        // **discoverNodes** returns the nodes of a *Collection* node with id `node`.
        // If `node` is not passed, the nodes of the root node on the service are returned instead.
        // See [http://xmpp.org/extensions/xep-0060.html#entity-nodes](http://xmpp.org/extensions/xep-0060.html#entity-nodes)
        discoverNodes: function (node) {
            var d = $.Deferred(),
                iq = $iq({to: this.service, type: 'get', id: this._connection.getUniqueId('pubsub')});

            if (node) {
                iq.c('query', {xmlns: Strophe.NS.DISCO_ITEMS, node: node});
            } else {
                iq.c('query', {xmlns: Strophe.NS.DISCO_ITEMS});
            }
            this._connection.sendIQ(iq,
                function (result) {
                    d.resolve($.map($('item', result), function (item, idx) { return $(item).attr('node'); }));
                }, d.reject);
            return d.promise();
        },

        // **publish** publishes `item`, an XML tree typically built with **$build** to the node specific by `node`.
        // Optionally, takes `item_id` as the desired id of the item.
        // Resolves on success to the id of the item on the node.
        // See [http://xmpp.org/extensions/xep-0060.html#publisher-publish](http://xmpp.org/extensions/xep-0060.html#publisher-publish)
        publish: function (node, item, item_id) {
            var d = $.Deferred();
            var iq = $iq({to: this.service, type: 'set', id: this._connection.getUniqueId('pubsub')})
                .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                .c('publish', {node: node})
                .c('item', item_id ? {id: item_id} : {})
                .cnode(item);
            this._connection.sendIQ(iq.tree(),
                function (result) {
                    d.resolve($('item', result).attr('id'));
                }, d.reject);
            return d.promise();
        },

        // **deleteItem** deletes the item with id `item_id` from the node with id `node`.
        // `notify` specifies whether the service should notify all subscribers with a PEP event.
        // See [http://xmpp.org/extensions/xep-0060.html#publisher-delete](http://xmpp.org/extensions/xep-0060.html#publisher-delete)
        deleteItem: function(node, item_id, notify) {
            notify = notify || true;
            var d = $.Deferred(),
                iq = $iq({to: this.service, type: 'set', id: this._connection.getUniqueId('pubsub')})
                .c('pubsub', {xmlns: Strophe.NS.PUBSUB })
                .c('retract', notify ? {node: node, notify: "true"} : {node: node})
                .c('item', {id: item_id});
            this._connection.sendIQ(iq.tree(), d.resolve, d.reject);
            return d.promise();
        },

        // **items** retrieves the items from the node with id `node`.
        // Optionally, you can specify `max_items` to retrieve a maximum number of items,
        // or a list of item ids with `item_ids` in `options` parameters.
        // See [http://xmpp.org/extensions/xep-0060.html#subscriber-retrieve](http://xmpp.org/extensions/xep-0060.html#subscriber-retrieve)
        items: function (node, options) {
            var d = $.Deferred(),
                iq = $iq({to: this.service, type: 'get'})
                .c('pubsub', {xmlns: Strophe.NS.PUBSUB })
                .c('items', {node: node});

            options = options || {};

            if (options.max_items) iq.attrs({max_items: options.max_items});
            if (options.item_ids) {
                _.each(options.item_ids, function (id) {
                    iq.c('item', {id: id}).up();
                });
            }

            this._connection.sendIQ(iq.tree(),
                function (res) {
                    d.resolve(_.map($('item', res), function (item) {
                        return item.cloneNode(true);
                    }));
                }, d.reject);
            return d.promise();
        },

        // **subscribe** subscribes the user's bare JID to the node with id `node`.
        // See [http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe](http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe)
        subscribe: function (node) {
            var d = $.Deferred();
            var iq = $iq({to: this.service, type: 'set', id: this._connection.getUniqueId('pubsub')})
                .c('pubsub', {xmlns: Strophe.NS.PUBSUB })
                .c('subscribe', {node: node, jid: Strophe.getBareJidFromJid(this._connection.jid)});
            this._connection.sendIQ(iq, d.resolve, d.reject);
            return d.promise();
        },

        // **unsubscribe** unsubscribes the user's bare JID from the node with id `node`. If managing multiple
        // subscriptions it is possible to optionally specify the `subid`.
        // See [http://xmpp.org/extensions/xep-0060.html#subscriber-unsubscribe](http://xmpp.org/extensions/xep-0060.html#subscriber-unsubscribe)
        unsubscribe: function (node, subid) {
            var d = $.Deferred();
            var iq = $iq({to: this.service, type: 'set', id: this._connection.getUniqueId('pubsub')})
                .c('pubsub', {xmlns: Strophe.NS.PUBSUB })
                .c('unsubscribe', {node: node, jid: Strophe.getBareJidFromJid(this._connection.jid)});
            if (subid) iq.attrs({subid: subid});
            this._connection.sendIQ(iq, d.resolve, d.reject);
            return d.promise();
        },

        // **getSubscriptions** retrieves the subscriptions of the user's bare JID to the service.
        // See [http://xmpp.org/extensions/xep-0060.html#entity-subscriptions](http://xmpp.org/extensions/xep-0060.html#entity-subscriptions)
        getSubscriptions: function () {
            var d = $.Deferred();
            var iq = $iq({to: this.service, type: 'get', id: this._connection.getUniqueId('pubsub')})
                .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                .c('subscriptions'),
                $item;

            this._connection.sendIQ(iq.tree(),
                function (res) {
                    d.resolve(_.map($('subscription', res), function (item) {
                        $item = $(item);
                        return {
                            node: $item.attr('node'),
                            jid: $item.attr('jid'),
                            subid: $item.attr('subid'),
                            subscription: $item.attr('subscription')
                        };
                    }));
                }, d.reject);
            return d.promise();
        }
    });
})(this.jQuery, this._, this.Backbone, this.Strophe);
