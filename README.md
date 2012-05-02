# Backbone XMPP Pub-Sub Storage

An alternative storage layer for syncing Backbone models/collection with XMPP Pub-Sub nodes

## Introduction

[Backbone] makes it easy to support alternative storage layers to its default RESTful JSON requests.
This package provides such a layer on top of [XMPP Publish-Subscribe][XEP-0060] through mapping `Backbone.Collection` instances to Pub-Sub nodes and their `Backbone.Model` instances to items of the node. In addition, it provides support for handling real-time XMPP notifications on these nodes, pushing live updates to the collections/models.

## Usage

In order for a collection to use the storage, override its `sync()` function and provide an instance of `PubSubStorage` on the `node` attribute of the collection, for instance:

        var MyCollection = Backbone.Collection.extend({
            sync: Backbone.xmppSync,
            model: MyModel,
            ...
        });

        var mycollection = new MyCollection();
        mycollection.node = new PubSubStorage('mymodels', connection);

where the arguments `'mymodels'`, and `connection` are the node id on your XMPP PubSub server, and Strophe's connection object, respectively.

For models, it is not necessary to specify the node (though you can, on the rare occasion where you sync a model *without* a collection), i.e. the following is sufficient:

        var MyModel = Backbone.Model.extend({
            sync: Backbone.xmppSync,
            ...
        });

        var mymodel = new MyModel();
        mycollection.add(mymodel);

That's it! Note that the storage will not take care of creating, configuring the node or managing subscriptions. This should be typically done on the server. However, if you wish to do so client-side, you can by means of utilising the bundled [PubSub plugin](http://github.com/ggozad/strophe.plugins) for [Strophe].

## Notifications

If your XMPP server is configured to support PEP-notifications and the user connected is subscribed to the node, you can push real-time updates to your models/collections.

Events are fired by the PubSub Strophe plugin, and you can bind to these in your collections. For example, in the `initialize()` of your collection's view, you can do

        connection.PubSub.on(
            'xmpp:pubsub:item-published:mycollection',
            this.itemPublished, this);

in order to bind the `xmpp:pubsub:item-published` event of the `mycollection` node to the `itemPublished` function.

There are four relevant events fired by the `PubSub` module:

* `xmpp:pubsub:item-published` will fire whenever an item is added or updated on a PubSub node. The handler will receive an object with the folliwing attributes:`node` (the id of the node), `id` (the id of the item) and `entry` (the entry containing the XML payload). Bind to this event if you want a central delegation of PubSub events.
* `xmpp:pubsub:item-published:*node_id*` is the same as `xmpp:pubsub:item-published` except it fires for items of a specific node only. The parameters it passes to the handler are also the same, omitting of course `node`.
* `xmpp:pubsub:item-deleted` will fire whenever an item is deleted from a PubSub node. Parameters passed are `node` and `id`.
* `xmpp:pubsub:item-deleted:*node_id*` same as above, but will only fire if the item belongs to the node with id `*node_id*`.

## Base collection/model

Base collection/models using the Pub-Sub storage are provided in `backbone.xmpp.node.js`, namely `PubSubNode` (the collection) and `PubSubItem` (the model). These will automatically subscribe to the add/update/delete XMPP events and will trigger the `add`, `change`, `remove` Backbone events, respectively. You can directly extend from them:


        var MyModel = PubSubItem.extend({
            ...
        });

        var MyCollection = PubSubNode.extend({
            model: MyModel,
            ...
        });

        var mycollection = new MyCollection([], {id: 'mymodels', connection: connection});

Note that passing `options` to initialize with `id` and `connection` will initialize the `node` as well as setup event handling.

## API documentation

Please refer to the annotated source:

* [backbone.xmpp.storage.js](http://ggozad.com/Backbone.xmpp/docs/backbone.xmpp.storage.html)
* [backbone.xmpp.mode.js](http://ggozad.com/Backbone.xmpp/docs/backbone.xmpp.node.html)
* [strophe.pubsub.js](http://ggozad.com/strophe.plugins/docs/strophe.pubsub.html)
* [strophe.forms.js](http://ggozad.com/strophe.plugins/docs/strophe.forms.html)


## License

Backbone.xmpp.storage is Copyright (C) 2012 Yiorgis Gozadinos, Riot AS.
It is distributed under the MIT license.

[Backbone]: http://documentcloud.github.com/backbone
[XEP-0060]: http://xmpp.org/extensions/xep-0060.html
[Strophe]: http://strophe.im/strophejs