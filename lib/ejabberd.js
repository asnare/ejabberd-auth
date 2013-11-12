// Copyright 2013 Andrew Snare. All rights reserved.
'use strict';

var events = require('events'),
    util = require('util');

function EJabberdChannel(inStream, outStream) {
    events.EventEmitter.call(this);
    var channel = this;

    channel.in = inStream || process.stdin;
    channel.out = outStream || process.stdout;

    channel.buffer = new Buffer(0);

    channel.in.on('data', function(chunk) {
        channel.buffer = channel.decodeBuffer(Buffer.concat([channel.buffer, chunk]));
    });
    channel.in.on('end', function() {
        var pendingDataLength = channel.buffer.length;
        if (pendingDataLength) {
            channel.emit('error', "Unexpected end-of-input; " + pendingDataLength + " byte(s) not processed.");
        }
        channel.emit('end');
    });
    channel.in.on('error', function(error) {
        channel.emit('error', "Error reading input stream: " + error);
    });
    channel.out.on('error', function(error) {
        channel.emit('error', "Error writing to output stream: " + error);
    })
}
util.inherits(EJabberdChannel, events.EventEmitter);
EJabberdChannel.prototype.decodeBuffer = function decodeBuffer(buffer) {
    while (buffer.length > 2) {
        // Check if we have the length prefix.
        var commandLength = buffer.readUInt16BE(0),
            commandEnd    = 2 + commandLength;
        if (buffer.length < commandEnd) {
            // We don't yet have a complete command.
            break;
        }
        var command = buffer.toString('ascii',2,commandEnd).split(':'),
            eventArguments = ['command'];
        eventArguments.push.apply(eventArguments, command);
        this.emit.apply(this, eventArguments);
        buffer = buffer.slice(commandEnd);
    }
    return buffer;
};
EJabberdChannel.prototype.answer = function answer(success) {
    var data = new Buffer(4);
    data.writeUInt16BE(2, 0);
    data.writeUInt16BE(success ? 1 : 0, 2);
    this.out.write(data);
};

module.exports = {
    EJabberdChannel: EJabberdChannel
};
