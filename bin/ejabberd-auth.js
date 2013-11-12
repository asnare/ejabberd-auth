#!/usr/bin/env node
//
// NodeJS script that implements an authentication daemon for eJabberd.
//
'use strict;';

var assert  = require('assert'),
    etc     = require('etc'),
    yml     = require('etc-yaml'),
    conf    = etc().use(yml).etc().add({
        "ejabberd-auth": {
            method: 'ldap',
            ldap: {
                uri: 'ldap://127.0.0.1',
                filter: '(objectClass=*)'
            }
        }
    }),
    ldapConf = conf.get('ejabberd-auth:ldap');
assert.equal(conf.get('ejabberd-auth:method'), 'ldap', "LDAP is currently the only supported method.");

require('../lib/auth-ldap').start(ldapConf);
