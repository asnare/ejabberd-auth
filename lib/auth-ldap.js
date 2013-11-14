// Copyright 2013 Andrew Snare. All rights reserved.
'use strict';

var ldap   = require('ldapjs'),
    assert = require('assert'),
    auth   = require('./auth');

function listRoots(client, callback) {
    client.search("", {
        filter: '(namingContexts=*)',
        scope: 'base',
        attributes: 'namingContexts',
        attrsOnly: true
    }, function(err, res) {
        if (err) {
            console.warn("Error searching for base contexts: " + err);
            callback();
        } else {
            var roots = [];
            res.on('searchEntry', function(entry) {
                roots.push(entry.object.namingContexts)
            });
            res.on('error', function(err) {
                console.warn("Error while searching for base contexts: " + err);
                callback();
            });
            res.on('end', function(result) {
                if (result.status === ldap.LDAP_SUCCESS) {
                    callback(roots);
                } else {
                    console.error("LDAP error searching for base contexts: " + result.status);
                    callback();
                }
            });
        }
    });
}

function start(options) {
    var base         = options.base,
        admin        = options.admin,
        url          = options.uri,
        uuidAttr     = options.uuidAttr,
        filter       = options.filter,
        objectFilter = ldap.parseFilter(filter),
        client       = ldap.createClient({ url: url });

    function bindChannel(base) {
        function findJabberUser(user, callback) {
            client.search(base, {
                filter: new ldap.AndFilter({
                    filters: [
                        objectFilter,
                        new ldap.EqualityFilter({
                            attribute: uuidAttr,
                            value: user
                        })
                    ]
                }),
                scope: 'sub',
                attributes: 'dn',
                attrsOnly: true,
                size: 2
            }, function(err, res) {
                if (err) {
                    console.error("Error starting search for user " + user + ": " + err);
                    callback();
                } else {
                    var dns = [];
                    res.on('searchEntry', function(entry) {
                        dns.push(entry.object.dn);
                    });
                    res.on('error', function(err) {
                        console.error("Error searching for user " + user + ": " + err);
                        callback();
                    });
                    res.on('end', function(result) {
                        if (result.status === ldap.LDAP_SUCCESS) {
                            switch (dns.length) {
                                case 0:
                                    console.warn("User not found: " + user);
                                    callback();
                                    break;
                                case 1:
                                    var dn = dns[0];
                                    console.warn("User found: " + dn);
                                    callback.apply(null, dns);
                                    break;
                                case 2:
                                    console.warn("Multiple users found; ignoring: " + user);
                                    callback();
                                    break;
                            }
                        } else {
                            console.error("LDAP error searching for user " + user + ": " + result.status);
                            callback();
                        }
                    });
                }
            });
        }

        var authenticator = new auth.Authenticator();
        authenticator.on('error', function(err) {
            console.error("Authenticator error: " + err);
            client.unbind();
        });
        authenticator.on('end', function() {
            console.warn("Stopping authenticator.");
            client.unbind();
        })
        authenticator.on('isuser', function(user) {
            // Here we can simply search for the user.
            findJabberUser(user, function(dn) {
                authenticator.channel.answer(dn !== undefined);
            });
        });
        authenticator.on('auth', function(user, hostIgnored, password) {
            // First we have to search the user to determine the DN.
            // Assuming we find it, we then bind using the supplied password.
            findJabberUser(user, function(dn) {
                if (dn !== undefined) {
                    ldap.createClient({ url: client.url.href })
                        .bind(dn, password, function(err) {
                            if (err && err.code !== ldap.LDAP_INVALID_CREDENTIALS) {
                                console.error("Unexpected authentication error: " + err);
                            }
                            authenticator.channel.answer(!err);
                        });
                } else {
                    authenticator.channel.answer(false);
                }
            });
        });
    }

    function bindChannelWithSearchBase(base) {
        if (base) {
            bindChannel(base);
        } else {
            listRoots(client, function(bases) {
                switch (bases.length) {
                    case 0:
                        console.error("Cannot detect root naming context. Please configure manually.");
                        break;
                    case 1:
                        var base = bases[0];
                        console.warn("Auto-detected base context: " + base);
                        bindChannel(base);
                        break;
                    case 2:
                        console.error("Multiple bases detected. Please configure manually.");
                        break;

                }
            });
        }
    }

    if (admin) {
        client.bind(admin.dn, admin.password, function(err) {
            assert.ifError(err);
            bindChannelWithSearchBase(base);
        });
    } else {
        bindChannelWithSearchBase(base);
    }
}

module.exports = {
    start: start
};
