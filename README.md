eJabberd Authentication Daemon
==============================

This package is a simple authentication daemon for [eJabberd](http://www.ejabberd.im/).
At present it implements LDAP authentication and is a drop-in replacement for the
builtin support for LDAP authentication that eJabberd provides.

The authentication daemon should work with any eJabberd version that supports the
external authentication protocol, and any LDAP server configured to allow simple
binding. (It has been tested with eJabberd 2.1.10 and OpenLDAP 2.4.31.)

Configuration
-------------

For OpenLDAP the default settings may suffice, assuming anonymous
searches are allowed. Edit the file `etc/ejabberd-auth.yaml` to
review the default configuration and adjust anything necessary.

*Note that installing globally (below) will copy this file to global location.*

Installation
------------

The daemon uses [NodeJS](http://nodejs.org) to run, with dependencies managed by
[npm](http://npmjs.org). To install:

    % npm -g install

You may need to perform this as root (e.g. using `sudo`) depending on your system.

Next edit the eJabberd configuration to use external authentication. For versions
prior to 13.10, that means setting the following:

    {auth_method, external}.
    {extauth_program, "/usr/bin/ejabberd-auth"}.

*Note: adjust the path to account for where `npm` installs global package on your
system.*

Frequently Asked Questions
--------------------------

Q. eJabberd has built-in support for LDAP authentication. Why bother?

A. The built-in support was broken on some versions packaged by Debian and Ubuntu due
   to changes in the underlying Erlang environment. Having no Erlang experience and
   not wishing to dive into the intricacies of custom .deb packages, I built this as
   (at least) an interim stop-gap.

Q. Are there plans to support anything beyond LDAP?

A. If there's demand, yes.
