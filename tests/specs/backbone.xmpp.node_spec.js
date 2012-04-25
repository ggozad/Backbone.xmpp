(function ($, _, Backbone, Strophe, jasmine, xmppMocker, PubSubStorage, PubSubItem, PubSubItems) {

    describe('PubSubItem/PubSubItems model/collection', function () {

        var connection, response, p, successHandler, errorHandler, json, entry,
            item, items;

        var Model = PubSubItem.extend({
            }),
            Collection = PubSubItems.extend({
                model: Model
            });

        beforeEach(function () {
            connection = xmppMocker.mockConnection();
            successHandler = jasmine.createSpy('successHandler');
            errorHandler = jasmine.createSpy('errorHandler');
            json = {title: 'An entry',
                            geolocation: {latitude: 10.23, longitude: 20.45},
                            published: '1974-06-05T09:13:00Z'},
            entry = $build('entry').t(JSON.stringify(json)).tree();

        });

        it('uses Backbone.xmppSync', function () {
            items = new Collection();
            expect(items.sync).toEqual(Backbone.xmppSync);
            item = new Model();
            expect(item.sync).toEqual(Backbone.xmppSync);
        });

        it('contructs the node attribute when initialized with an id', function () {
            items = new Collection([], {id: 'anode', connection: connection});
            expect(items.node.id).toEqual('anode');
            expect(items.node.connection).toEqual(connection);
        });

        it('adds an item to the collection upon receiving an PEP notification on a non-existing item and fires the "add" event.', function () {
            items = new PubSubItems([], {id: 'anode', connection: connection});
            message = $msg({from: connection.PubSub.service, to: connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'item_id'})
                .cnode(entry);
            items.on('add', successHandler);
            xmppMocker.receive(connection, message);
            expect(successHandler).toHaveBeenCalled();
            item = items.get('item_id');
            expect(item).toBeDefined();
            expect(item.get('title')).toEqual('An entry');
            expect(item.get('published')).toEqual('1974-06-05T09:13:00Z');
            expect(item.get('geolocation')).toEqual({latitude: 10.23, longitude: 20.45});
        });

        it('updates an item in the collection upon receiving an PEP notification on an existing item', function () {
            items = new PubSubItems([], {id: 'anode', connection: connection});
            json.id = 'item_id';
            items.add(json);
            json.title = 'An updated entry';
            entry = $build('entry').t(JSON.stringify(json)).tree();
            message = $msg({from: connection.PubSub.service, to: connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'item_id'})
                .cnode(entry);
            items.on('change', successHandler);
            xmppMocker.receive(connection, message);
            expect(successHandler).toHaveBeenCalled();
            item = items.get('item_id');
            expect(item).toBeDefined();
            expect(item.get('title')).toEqual('An updated entry');
            expect(items.models.length).toEqual(1);
        });

    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker,
   this.PubSubStorage, this.PubSubItem, this.PubSubItems);