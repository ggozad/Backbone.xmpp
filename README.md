# Backbone XMPP Pub-Sub Storage

An alternative storage layer for syncinc Backbone models/collection with XMPP Pub-Sub nodes.

## Introduction

[Backbone] makes it easy to support alternative storage layers to the default RESTful JSON requests.
This package provides such a layer on top of [XMPP Publish-Subscribe][XEP-0060] through mapping a `Backbone.Collection` instance to a Pub-Sub node and its `Backbone.Model` instances to items of the node. In addition, it provides support for handling real-time XMPP notifications on these nodes allowing to update the collections/models in real-time.

## Usage

In order for a collection to use the storage, override its `sync()` function and provide an instance of `PubSubNodeStorage` on the `node` attribute of the collection, for instance,

        var MyCollection = Backbone.Collection.extend({
            sync: Backbone.xmppSync,
            model: MyModel,
            ...
        });

        var mycollection = new MyCollection();
        mycollection.node = new PubSubNodeStorage('mymodels');

will use the `mymodels` node on your XMPP PubSub server.

For models, you do not need to specify the node (you can though), i.e. the following is sufficient:

        var MyModel = Backbone.Model.extend({
            sync: Backbone.xmppSync,
            ...
        });

        var mymodel = new MyModel();
        mycollection.add(mymodel);

That's it! Note that the storage will not take care of creating, configuring the node, or managing subscriptions. This should be typically done on the server. However, if you wish to do so in your clients, you can by means of utilising the bundled PubSub plugin for [Strophe].

## Notifications

If your user has subscribed to the node and your XMPP server is configured to support PEP-notifications you can use them to provide real-time server push to your models/collections.

Events are fired by the Strophe plugin, and you can bind to these in your collections. For example, you could in your collection's `initialize()` do

            PubSubNodeStorage.connection.PubSub.eventHandlers.on(
                'xmpp:pubsub:item-published:mycollection',
                this.itemAdded, this);

There are four relevant events fired by the `PubSub` module:

* `xmpp:pubsub:item-published` will fire whenever an item is added or updated on a PubSub node. The handler will receive an object with `node` (the id of the node), `id` (the id of the item) and the `entry` (the entry containing the XML payload) attributes. Use this event if you want a central delegation of PubSub events.
* `xmpp:pubsub:item-published:*node_id*` is the same as `xmpp:pubsub:item-published` except it fires for items of a specific node only. Use it for subscribing to events within a collection for instance. The parameters it passes to the handler are also the same ommiting of course `node`.
* `xmpp:pubsub:item-deleted` will fire whenever an item is deleted from a PubSub node. Parameters passed are `node` and `id`.
* `xmpp:pubsub:item-deleted:*node_id*` same as above, but will only fire if the item belongs to the node with id `*node_id*`.

## License

Backbone.xmpp.storage is Copyright (C) 2012 Yiorgis Gozadinos, Riot AS.
It is distributed under the MIT license.

[Backbone]: http://documentcloud.github.com/backbone
[XEP-0060]: http://xmpp.org/extensions/xep-0060.html
[Strophe]: http://strophe.im/strophejs