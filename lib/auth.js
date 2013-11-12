// Copyright 2013 Andrew Snare. All rights reserved.
'use strict;'

var events = require('events'),
    util = require('util');

function Authenticator(channel) {
    events.EventEmitter.call(this);
    var authenticator = this;
    var ejabberd = require('./ejabberd');
    authenticator.channel = channel || new ejabberd.EJabberdChannel();
    authenticator.validCommands = {
        "auth": true,
        "isuser": true,
        "setpass": true,
        "tryregister": true,
        "removeuser": true,
        "removeuser3": true
    };
    authenticator.channel.on('command', function(command) {
        console.warn("Command received: " + command + "(" + Array.prototype.slice.call(arguments).slice(1) + ")");
        if (!authenticator.validCommands[command]
            || !authenticator.emit.apply(authenticator, arguments)) {
            authenticator.channel.answer(false);
        }
    });
    authenticator.channel.on('error', function(error) {
        authenticator.emit('error', "Channel error: " + error);
    });
    authenticator.channel.on('end', function() {
        console.warn("Channel closed.");
        authenticator.emit('end');
    });
}
util.inherits(Authenticator, events.EventEmitter);

module.exports = {
    Authenticator: Authenticator
}
