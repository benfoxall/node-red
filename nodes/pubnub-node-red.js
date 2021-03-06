module.exports = function(RED) {
    "use strict";
    var PN = require("pubnub");
    var pn_obj = null;

    // This is a config node holding the keys for connecting to PubNub
    function PubnubKeysNode(n) {
        RED.nodes.createNode(this,n);
        this.publish_key = n.pub_key;
        this.subscribe_key = n.sub_key;
    }
    RED.nodes.registerType("pubnub-keys",PubnubKeysNode);


    //
    // The Input Node
    //
    function PNInNode(n) {
        RED.nodes.createNode(this,n);
        this.channel = n.channel;
        this.keys = n.keys;
        this.keysConfig = RED.nodes.getNode(this.keys);

        // Establish a new connection
        if (pn_obj == null)
            PNInit(this);

        // Subscribe to a channel
        if (pn_obj != null) {
            if (this.channel) {
                this.log("Subscribing to channel (" + this.channel + ")");
                var node = this;
                pn_obj.subscribe({
                    channel  : this.channel,
                    callback : function(message) {
                        if (typeof message == 'string') {
                            node.log("Received message payload is " + message);
                            node.send({payload : message});
                        }
                        else {
                            node.error("Received message is not a string!");
                        }
                    }
                });
                this.status({fill:"green",shape:"dot",text:"listening"});
            }
            else {
                this.warn("Unknown channel name!");
                this.status({fill:"green",shape:"ring",text:"channel?"});
            }
        }
    }
    RED.nodes.registerType("pubnub in",PNInNode);


    //
    // The Output Node
    //
    function PNOutNode(n) {
        RED.nodes.createNode(this,n);
        this.channel = n.channel;
        this.keys = n.keys;
        this.keysConfig = RED.nodes.getNode(this.keys);

        // Establish a new connection
        if (pn_obj == null)
            PNInit(this);

        // Publish to a channel
        if (pn_obj != null) {
            if (this.channel) {
                var node = this;
                this.on("input", function(msg) {
                    this.log("Publishing to channel (" + node.channel + ")");
                    pn_obj.publish({
                        channel : node.channel,
                        message : msg.payload,
                        callback : function(e) {
                            node.log("Success sending message " + msg.payload +
                                "(" + e + ")");
                        },
                        error : function(e) {
                            node.log("Failure sending message " + msg.payload +
                                "(" + e + "). Please retry publish!");
                        }
                    });
                });
                this.status({fill:"green",shape:"dot",text:"published"});
            }
            else {
                this.warn("Unknown channel name!");
                this.status({fill:"green",shape:"ring",text:"channel?"});
            }
        }
    }
    RED.nodes.registerType("pubnub out",PNOutNode);


    //
    // Establish a new connection
    // (assign to pn_obj variable)
    //
    function PNInit(node) {
        node.status({fill:"red",shape:"ring",text:"disconnected"});
        var keys = node.keysConfig;
        if (keys) {
            node.log("Connecting to PubNub (" +
                keys.publish_key + ":" + keys.subscribe_key+")");
            pn_obj = PN.init({
                publish_key : keys.publish_key,
                subscribe_key : keys.subscribe_key
            });
            node.status({fill:"yellow",shape:"dot",text:"connected"});
        }
        else {
            node.error("Unknown publish and subscribe keys!");
            node.status({text:""});
        }
    }
}
