(function ($, _, Backbone, Strophe, jasmine, xmppMocker) {

    describe('PubSub Plugin', function () {

        var successHandler, errorHandler, request, response, promise;

        beforeEach(function () {
            Strophe.connection = xmppMocker.mockConnection();
            successHandler = jasmine.createSpy('successHandler');
            errorHandler = jasmine.createSpy('errorHandler');
            request = '';
        });

        it('fires a "xmpp:pubsub:item-published" event when a PEP message is received for a newly published item', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            var itemPublishedOnNodeHandler = jasmine.createSpy('itemPublishedOnNodeHandler');

            Strophe.connection.PubSub.events.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-published', itemPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-published:anode', itemPublishedOnNodeHandler);

            var message = $msg({from: Strophe.connection.PubSub.service, to: Strophe.connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'some_id'})
                .c('entry').t('some_text');

            xmppMocker.receive(Strophe.connection, message);
            expect(itemPublishedHandler).wasCalled();
            var argument = itemPublishedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.id).toEqual('some_id');
            expect(argument.entry.isEqualNode($build('entry').t('some_text').tree())).toBeTruthy();
            expect(itemPublishedOnNodeHandler).wasCalled();
            expect(lastPublishedHandler).wasNotCalled();
        });

        it('fires a "xmpp:pubsub:item-published" event when a PEP message is received without a payload with an null entry', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            var itemPublishedOnNodeHandler = jasmine.createSpy('itemPublishedOnNodeHandler');

            Strophe.connection.PubSub.events.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-published', itemPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-published:anode', itemPublishedOnNodeHandler);

            var message = $msg({from: Strophe.connection.PubSub.service, to: Strophe.connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'some_id'});

            xmppMocker.receive(Strophe.connection, message);
            expect(itemPublishedHandler).wasCalled();
            var argument = itemPublishedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.id).toEqual('some_id');
            expect(argument.entry).toBeNull();
            expect(itemPublishedOnNodeHandler).wasCalled();
            expect(lastPublishedHandler).wasNotCalled();
        });

        it('fires the "xmpp:pubsub:last-published-item" event when a PEP message is received for the last published item', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var lastPublishedOnNodeHandler = jasmine.createSpy('lastPublishedOnNodeHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-published', itemPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:last-published-item:anode', lastPublishedOnNodeHandler);

            var message = $msg({from: Strophe.connection.PubSub.service, to: Strophe.connection.jid})
                .c('delay', {xmlns: Strophe.NS.DELAY, stamp: '2011-12-01T10:00:00Z'}).up()
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'some_id'})
                .c('entry').t('some_text');
            xmppMocker.receive(Strophe.connection, message);
            expect(lastPublishedHandler).toHaveBeenCalled();
            var argument = lastPublishedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.timestamp).toEqual('2011-12-01T10:00:00Z');
            expect(argument.id).toEqual('some_id');
            expect(argument.entry.isEqualNode($build('entry').t('some_text').tree())).toBeTruthy();
            expect(lastPublishedOnNodeHandler).toHaveBeenCalled();
            expect(itemPublishedHandler).wasNotCalled();
        });

        it('fires the "xmpp:pubsub:last-published-item" event with a null entry when a PEP message is received without a payload for the last published item', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var lastPublishedOnNodeHandler = jasmine.createSpy('lastPublishedOnNodeHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-published', itemPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:last-published-item:anode', lastPublishedOnNodeHandler);

            var message = $msg({from: Strophe.connection.PubSub.service, to: Strophe.connection.jid})
                .c('delay', {xmlns: Strophe.NS.DELAY, stamp: '2011-12-01T10:00:00Z'}).up()
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'some_id'});
            xmppMocker.receive(Strophe.connection, message);
            expect(lastPublishedHandler).toHaveBeenCalled();
            var argument = lastPublishedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.timestamp).toEqual('2011-12-01T10:00:00Z');
            expect(argument.id).toEqual('some_id');
            expect(argument.entry).toBeNull();
            expect(lastPublishedOnNodeHandler).toHaveBeenCalled();
            expect(itemPublishedHandler).wasNotCalled();
        });

        it('fires the "xmpp:pubsub:item-deleted" event when a PEP message is received for a retracted item', function () {
            var itemDeletedHandler = jasmine.createSpy('itemDeletedHandler');
            var itemDeletedOnNodeHandler = jasmine.createSpy('itemDeletedOnNodeHandler');
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-deleted', itemDeletedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-deleted:anode', itemDeletedOnNodeHandler);
            var message = $msg({from: Strophe.connection.PubSub.service, to: Strophe.connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('retract', {id: 'some_id'});
            xmppMocker.receive(Strophe.connection, message);
            expect(itemDeletedHandler).toHaveBeenCalled();
            var argument = itemDeletedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.id).toEqual('some_id');
            expect(itemDeletedOnNodeHandler).toHaveBeenCalled();
        });

        it('does not fire an event when a transient PEP message is received', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            Strophe.connection.PubSub.events.bind('xmpp:pubsub:item-published', itemPublishedHandler);

            var message = $msg({from: Strophe.connection.PubSub.service, to: Strophe.connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'});
            xmppMocker.receive(Strophe.connection, message);
            expect(lastPublishedHandler).wasNotCalled();
            expect(itemPublishedHandler).wasNotCalled();
        });

        it('creates a PubSub node with default configuration', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > create', request).attr('node')).toEqual('anode');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.createNode('anode', null);
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('creates a PubSub node with custom configuration', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > create', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > configure > x > field[var="pubsub#title"] > value', request).text()).toEqual('A node');
                expect($('iq > pubsub > configure > x > field[var="pubsub#max_items"] > value', request).text()).toEqual('1');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.createNode('anode', {'pubsub#title': 'A node', 'pubsub#max_items': 1});
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('deletes a PubSub node', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB_OWNER);
                expect($('iq > pubsub > delete', request).attr('node')).toEqual('anode');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.deleteNode('anode');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it("returns the node's configuration on calling getNodeConfig()", function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB_OWNER);
                expect($('iq > pubsub > configure', request).attr('node')).toEqual('anode');
                var form = new Strophe.x.Form({type: 'form',
                                               fields: [new Strophe.x.Field({'var': 'pubsub#title',
                                                                             'type': 'text-single',
                                                                             'label': 'A friendly name for the node'})]});
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB_OWNER})
                    .c('configure', {node: 'anode'})
                    .cnode(form.toXML())
                    .tree();
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.getNodeConfig('anode');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith([{type: 'text-single',
                                                          'var': 'pubsub#title',
                                                          required: false,
                                                          desc: '',
                                                          label: 'A friendly name for the node',
                                                          values: [],
                                                          options : []}]);
        });

        it('returns child nodes of the service on calling discoverNodes() without a node ', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > query', request).attr('xmlns')).toEqual(Strophe.NS.DISCO_ITEMS);
                expect($('iq > query', request).attr('node')).toBeUndefined();
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('query', {xmlns: Strophe.NS.DISCO_ITEMS})
                    .c('item', {jid: Strophe.connection.PubSub.service, node: 'anode'}).up()
                    .c('item', {jid: Strophe.connection.PubSub.service, node: 'some_other_node'})
                    .tree();
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.discoverNodes(null);
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith(['anode', 'some_other_node']);
        });

        it('returns child nodes of the service on calling discoverNodes() on a node', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > query', request).attr('xmlns')).toEqual(Strophe.NS.DISCO_ITEMS);
                expect($('iq > query', request).attr('node')).toEqual('root_node');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('query', {xmlns: Strophe.NS.DISCO_ITEMS, node: 'root_node'})
                    .c('item', {jid: Strophe.connection.PubSub.service, node: 'anode'}).up()
                    .c('item', {jid: Strophe.connection.PubSub.service, node: 'some_other_node'})
                    .tree();
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.discoverNodes('root_node');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith(['anode', 'some_other_node']);
        });

        it('publishes an xml item on a PubSub node', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > publish', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > publish > item', request).attr('id')).toEqual('some_id');
                expect($('iq > pubsub > publish > item > entry', request).text()).toEqual('Hello world');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('publish', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .tree();
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.publish('anode', $build('entry').t('Hello world').tree(), 'some_id');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith('some_id');
        });

        it('deletes an item from a PubSub node', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > retract', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > retract > item', request).attr('id')).toEqual('some_id');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.deleteItem('anode', 'some_id');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('deletes an item from a PubSub node and notifies when notify is set', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > retract', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > retract', request).attr('notify')).toEqual('true');
                expect($('iq > pubsub > retract > item', request).attr('id')).toEqual('some_id');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.deleteItem('anode', 'some_id', true);
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('returns the items of a PubSub node', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > items', request).attr('node')).toEqual('anode');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('items', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .c('entry', {some_attr: 'some_val'}, 'Hello world.')
                    .up()
                    .c('item', {id: 'another_id'})
                    .c('entry')
                    .c('field').t('Goodbye world.')
                    .tree();
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.items('anode');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('will request a max number of items if items() is called with max_items in its options', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > items', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > items', request).attr('max_items')).toEqual('10');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('items', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .c('entry', {some_attr: 'some_val'}, 'Hello world.')
                    .up()
                    .c('item', {id: 'another_id'})
                    .c('entry')
                    .c('field').t('Goodbye world.')
                    .tree();
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.items('anode', {max_items: 10});
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('will request specific items if items() is called with a list of item ids in its options', function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > items', request).attr('node')).toEqual('anode');
                var item_ids = _.map($('iq > pubsub > items > item', request), function (item) { return $(item).attr('id'); });
                expect(item_ids).toEqual(['some_id', 'another_id']);

                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('items', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .c('entry', {some_attr: 'some_val'}, 'Hello world.')
                    .up()
                    .c('item', {id: 'another_id'})
                    .c('entry')
                    .c('field').t('Goodbye world.')
                    .tree();
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.items('anode', {item_ids: ['some_id', 'another_id']});
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it("subscribes the user's bare JID to a node when subscribe() is called", function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > subscribe', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > subscribe', request).attr('jid')).toEqual(Strophe.getBareJidFromJid(Strophe.connection.jid));
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.subscribe('anode');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it("unsubscribes the user's bare JID from a node when unsubscribe() is called", function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > unsubscribe', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > unsubscribe', request).attr('jid')).toEqual(Strophe.getBareJidFromJid(Strophe.connection.jid));
                expect($('iq > pubsub > unsubscribe', request).attr('subid')).toEqual('sub_id');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.unsubscribe('anode', 'sub_id');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it("returns the user's subscriptions to the service when getSubscriptions() is called", function () {
            spyOn(Strophe.connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(Strophe.connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > subscriptions', request).length).toEqual(1);
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('subscription', {jid: Strophe.connection.jid, node: 'anode', subid: '123', subscription: 'subscribed'})
                    .tree();
                xmppMocker.receive(Strophe.connection, response);
            });
            promise = Strophe.connection.PubSub.getSubscriptions();
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith([{jid: Strophe.connection.jid, node: 'anode', subid: '123', subscription: 'subscribed'}]);
        });

    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);