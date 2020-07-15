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
