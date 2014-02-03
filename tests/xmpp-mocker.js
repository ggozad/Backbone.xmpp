(function ($, Strophe) {
    window.xmppMocker = {

        jquerify: function (builder) {
            var xml = '';
            if (builder.tree) {
                xml = Strophe.serialize(builder.tree());
            } else {
                xml = Strophe.serialize(builder);
            }
            return $($.parseXML(xml));
        },

        createRequest: function (iq) {
            iq = typeof iq.tree === "function" ? iq.tree() : iq;
            var req = new Strophe.Request(iq, function () {});
            req.getResponse = function () {
                var env = new Strophe.Builder('env', {type: 'mock'}).tree();
                env.appendChild(iq);
                return env;
            };
            return req;
        },

        receive: function (c, req) {
            c._dataRecv(this.createRequest(req));
        },

        mockConnection: function (callback) {
            var c = new Strophe.Connection('');
            c.connect_callback = callback;
            c.authenticated = true;
            c.connected = true;
            c.jid = 'mocker@xmpp/r2';
            c._processRequest = function () {};
            c._changeConnectStatus(Strophe.Status.CONNECTED);
            c.disconnect = function () {
                c._doDisconnect();
            };
            return c;
        }
    };

})(this.jQuery, this.Strophe);
