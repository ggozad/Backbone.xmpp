(function ($, _, Backbone, Strophe, jasmine, xmppMocker, PubSubStorage) {

    describe('PubSub Storage', function () {

        var connection, response, p, model, collection, node, successHandler, errorHandler, json;

        var Model = Backbone.Model.extend({
                sync: Backbone.xmppSync

            }),
            Collection = Backbone.Collection.extend({
                model: Model,
                sync: Backbone.xmppSync
            });

        beforeEach(function () {
            connection = xmppMocker.mockConnection();
            node = new PubSubStorage('node', connection);
            successHandler = jasmine.createSpy('successHandler');
            errorHandler = jasmine.createSpy('errorHandler');
            json = {
                content: 'Hello world',
                count: 3
            };
        });

        it('publishes a model to the node when sync() is called with a "create"', function () {
            spyOn(connection.PubSub, 'publish').andCallFake(function (nodeid, entry) {
                var d = $.Deferred();
                expect(nodeid).toEqual('node');
                expect(entry.textContent).toEqual(JSON.stringify(json));
                d.resolve('foo');
                return d.promise();
            });
            model = new Model(json);
            model.node = node;
            p = model.sync('create', model);
            p.done(successHandler);
            p.fail(errorHandler);
            expect(successHandler).toHaveBeenCalledWith(model);
            expect(errorHandler).wasNotCalled();
            expect(model.id).toEqual('foo');
        });

        it('publishes a model to the node when sync() is called with a "update"', function () {
            spyOn(connection.PubSub, 'publish').andCallFake(function (nodeid, entry, itemid) {
                var d = $.Deferred();
                expect(nodeid).toEqual('node');
                expect(itemid).toEqual('foo');
                expect(entry.textContent).toEqual(JSON.stringify(json));
                d.resolve('foo');
                return d.promise();
            });
            model = new Model(json);
            model.node = node;
            model.id = 'foo';
            p = model.sync('update', model);
            p.done(successHandler);
            p.fail(errorHandler);
            expect(successHandler).toHaveBeenCalledWith(model);
            expect(errorHandler).wasNotCalled();
        });

        it("returns the model's attributes that have changed on the node when sync() is called with a 'read' action on a model", function () {
            spyOn(connection.PubSub, 'items').andCallFake(function (nodeid, options) {
                var d = $.Deferred();
                expect(nodeid).toEqual('node');
                expect(options.item_ids).toEqual(['foo']);
                response = $build('item', {id: 'foo'})
                    .c('entry')
                    .t(JSON.stringify(json));
                d.resolve([response.tree()]);
                return d.promise();
            });
            model = new Model({id: 'foo', content: 'Hello world'});
            model.node = node;
            p = model.sync('read', model);
            p.done(successHandler);
            p.fail(errorHandler);
            expect(successHandler).toHaveBeenCalledWith({count: 3});
        });

        it("returns all models on the node when sync() is called with a 'read' action on a collection", function () {
            spyOn(connection.PubSub, 'items').andCallFake(function (nodeid, options) {
                var d = $.Deferred();
                expect(nodeid).toEqual('node');
                response = [
                    $build('item', {id: 'foo'})
                        .c('entry')
                        .t(JSON.stringify({content: 'Hello world', count: 3})).tree(),
                    $build('item', {id: 'bar'})
                        .c('entry')
                        .t(JSON.stringify({content: 'Bye bye world', count: 4})).tree()];
                d.resolve(response);
                return d.promise();
            });
            collection = new Collection();
            collection.node = node;
            p = collection.sync('read', collection);
            p.done(successHandler);
            p.fail(errorHandler);
            expect(successHandler).toHaveBeenCalledWith(
                [{id: 'foo', content: 'Hello world', count: 3},
                {id: 'bar', content: 'Bye bye world', count: 4}]);
        });

        it('retrieves only max_items items from the node when a fetch is called with options defining max_items', function () {
            spyOn(connection.PubSub, 'items').andCallFake(function (nodeid, options) {
                expect(options.max_items).toEqual(10);
                var d = $.Deferred();
                d.resolve([]);
                return d.promise();
            });
            collection = new Collection();
            collection.node = node;
            collection.fetch({max_items: 10});
        });

        it("deletes the model from the node when sync() is called with a 'delete' action", function () {
            spyOn(connection.PubSub, 'deleteItem').andCallFake(function (nodeid, options) {
                var d = $.Deferred();
                d.resolve();
                return d.promise();
            });
            model = new Model({id: 'foo'});
            model.node = node;
            p = model.sync('delete', model);
            p.done(successHandler);
            p.fail(errorHandler);
            expect(successHandler).toHaveBeenCalledWith(model);
        });

    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker, this.PubSubStorage);