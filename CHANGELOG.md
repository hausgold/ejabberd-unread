## next

* Migrated from Travis CI to Github Actions (#6)
* Upgraded to PostgreSQL 15.2 and Redis 7.0 (#17)
* Upgraded PostgreSQL to 16.4 (#19)
* Upgraded PostgreSQL to 16.6 (#20)
* Upgraded PostgreSQL to 17.2 (#21)
* Upgraded PostgreSQL to 17.4 (#22)
* Upgraded PostgreSQL to 17.5 (#23)
* Upgraded to node.js 22 (#24)

## 1.0.4

* Improved the MAM result manipulation to directly change the XML elements
  instead of using the XMPP parsed variant, this will keep user defined
  non-XMPP custom XML elements (stanzas) in place

## 1.0.3

* Added a testing chat client to debug bugs and the implementation easily
* Corrected the MAM result matching and made it more robust to varying element
  order

## 1.0.2

* Do not remove the meta.user data from a MUC packet in order to not interfere
  with other modules (eg. mod_mam2sidekiq)

## 1.0.1

* Corrected a module boot up configuration bug, we just fall back to the
  original [mod_read_markers](https://github.com/hausgold/ejabberd-read-markers)
  solution

## 1.0.0

* Initial release of the ejabberd-unread (mod_unread) module
* Implementation of the initial concept (IQ handler, database (SQL) backend)
* Added a simple test suite to verify the functional state of the module
