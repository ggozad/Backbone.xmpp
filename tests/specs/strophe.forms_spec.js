(function ($, _, Backbone, Strophe, jasmine, xmppMocker) {

    describe('Forms Plugin', function () {

        var successHandler, errorHandler, request, response, promise;

        beforeEach(function () {
            Strophe.connection = xmppMocker.mockConnection();
            successHandler = jasmine.createSpy('successHandler');
            errorHandler = jasmine.createSpy('errorHandler');
            request = '';
        });

        it('registers as a plugin with Strophe', function () {
            expect(Strophe.x).toBeDefined();
        });

        describe('Option', function () {

            it('provides default values', function () {
                var o = new Strophe.x.Option();
                expect(o.value).toEqual('');
                expect(o.label).not.toBeDefined();
            });

            it('can be converted to XML', function () {
                var o = new Strophe.x.Option({label: 'foo', value: 'bar'}),
                    $o = $(o.toXML());
                expect($o.attr('label')).toEqual('foo');
                expect($('value', $o).text()).toEqual('bar');
            });

            it('can be constructed from XML', function () {
                var o, xml = '<option label="foo"><value>bar</value>';
                o = Strophe.x.Option.fromXML(xml);
                expect(o.label).toEqual('foo');
                expect(o.value).toEqual('bar');
            });

            it('can be converted to JSON', function () {
                var o = new Strophe.x.Option({label: 'foo', value: 'bar'}),
                    json = o.toJSON();
                expect(json.label).toEqual('foo');
                expect(json.value).toEqual('bar');
            });

        });

        describe('Field', function () {

            it('provides default values', function () {
                var f = new Strophe.x.Field();
                expect(f.type).toEqual('text-single');
                expect(f['var']).toEqual('undefined');
                expect(f.desc).not.toBeDefined();
                expect(f.label).not.toBeDefined();
                expect(f.required).toBeFalsy();
                expect(f.options).toEqual([]);
                expect(f.values).toEqual([]);
            });

            it('can be converted to XML', function () {
                var options = [
                        new Strophe.x.Option({label: '10', value: 10}),
                        new Strophe.x.Option({label: '20', value: 20})
                    ],
                    f = new Strophe.x.Field({
                        label: 'foo',
                        'var': 'bar',
                        type: 'list-single',
                        value: 20,
                        options: options,
                        required: true,
                        desc: 'A field'
                    }),

                $f = $(f.toXML());
                expect($f.attr('label')).toEqual('foo');
                expect($f.attr('var')).toEqual('bar');
                expect($f.attr('type')).toEqual('list-single');
                expect($('desc', $f).text()).toEqual('A field');
                expect($('required', $f).length>0).toBeTruthy();
                expect($('>value', $f).text()).toEqual('20');
                expect($('option', $f).length).toEqual(2);
            });

            it('can be constructed from XML', function () {
                var f,
                    xml = '<field type="list-single" label="Foo" var="bar"> \
                            <desc>A field</desc> \
                            <value>20</value> \
                            <option label="10"><value>10</value></option> \
                            <option label="20"><value>20</value></option> \
                           </field>';
                f = Strophe.x.Field.fromXML(xml);
                expect(f.label).toEqual('Foo');
                expect(f.type).toEqual('list-single');
                expect(f['var']).toEqual('bar');
                expect(f.desc).toEqual('A field');
                expect(f.options.length).toEqual(2);
                expect(f.values).toEqual(['20']);
            });

            it('can be converted to JSON', function () {
                var options = [
                        new Strophe.x.Option({label: '10', value: 10}),
                        new Strophe.x.Option({label: '20', value: 20})
                    ],
                    f = new Strophe.x.Field({
                        label: 'foo',
                        'var': 'bar',
                        type: 'list-single',
                        value: 20,
                        options: options,
                        required: true,
                        desc: 'A field'
                    }),
                    json = f.toJSON();
                expect(json.label).toEqual('foo');
                expect(json.type).toEqual('list-single');
                expect(json['var']).toEqual('bar');
                expect(json.required).toBeTruthy();
                expect(json.desc).toEqual('A field');
                expect(json.options).toEqual([{label: '10', value: 10}, {label: '20', value: 20}]);
            });

        });

        describe('Form', function () {

            it('provides default values', function () {
                var f = new Strophe.x.Form();
                expect(f.type).toEqual('form');
                expect(f.fields).toEqual([]);
                expect(f.title).not.toBeDefined();
                expect(f.instructions).not.toBeDefined();
            });

            it('can be converted to XML', function () {
                var field = new Strophe.x.Field({'var': 'bar'}),
                    f = new Strophe.x.Form({title: 'A form', instructions: 'Fill me in', fields: [field]});
                $f = $(f.toXML());
                expect($f.attr('xmlns')).toEqual('jabber:x:data');
                expect($f.attr('type')).toEqual('form');
                expect($f.attr('type')).toEqual('form');
                expect($('title', $f).text()).toEqual('A form');
                expect($('instructions', $f).text()).toEqual('Fill me in');
            });

            it('can be constructed from XML', function () {
                var f,
                    xml = '<x xmlns="jabber:x:data" type="form"> \
                             <title>A form</title> \
                             <instructions>Fill me in</instructions> \
                             <field label="Foo" var="bar"> \
                                <value>10</value> \
                             </field> \
                            </x>';
                f = Strophe.x.Form.fromXML(xml);
                expect(f.title).toEqual('A form');
                expect(f.type).toEqual('form');
                expect(f.instructions).toEqual('Fill me in');
                expect(f.fields.length).toEqual(1);
            });

            it('can be converted to JSON', function () {
                var field = new Strophe.x.Field({'var': 'bar'}),
                    f = new Strophe.x.Form({title: 'A form', instructions: 'Fill me in', fields: [field]});
                    json = f.toJSON();
                expect(json.title).toEqual('A form');
                expect(json.type).toEqual('form');
                expect(json.instructions).toEqual('Fill me in');
                expect(json.fields).toEqual([{ type: 'text-single', 'var': 'bar', desc: undefined, label: undefined, required: false, options: [], values : []}]);
            });

        });

    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);