MAKEFLAGS += --warn-undefined-variables -j1
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:
.PHONY: package

# Environment switches
MODULE ?= ejabberd-unread
VERSION ?= 18.01
MOD_VERSION ?= latest

# Directories
INCLUDE_DIRS ?= ../include
EBIN_DIRS ?= ../ebin
SRC_DIR ?= ../src

# Host binaries
APTGET ?= apt-get
CD ?= cd
CP ?= cp
DOCKER ?= docker
DPKGBUILDPACKAGE ?= dpkg-buildpackage
ERLC ?= erlc
FIND ?= find
MKDIR ?= mkdir
PATCH ?= patch
PWD ?= pwd
SED ?= sed
SUDO ?= sudo
TAR ?= tar
TEST ?= test
WGET ?= wget

.install-ejabberd-build-deps:
	# Install the ejabberd $(VERSION) build dependencies
	@$(SUDO) $(APTGET) update -y
	@$(SUDO) $(APTGET) build-dep -y ejabberd
	@$(SUDO) $(APTGET) install -y \
		libssl-dev libyaml-dev libgd-dev libwebp-dev fakeroot

.build-ejabberd:
	# Build ejabberd $(VERSION) from source
	@$(SUDO) $(APTGET) source ejabberd
	@cd ejabberd-$(VERSION) && $(SUDO) $(DPKGBUILDPACKAGE) -us -uc

.find-deps:
	# Find all build dependencies
	$(eval INCLUDES = $(addprefix -I ,\
		$(shell $(FIND) `$(PWD)` -type d -name include) $(INCLUDE_DIRS)))
	$(eval EBINS = $(addprefix -pa ,\
		$(shell $(FIND) `$(PWD)` -type d -name ebin) $(EBIN_DIRS)))

install: \
	.install-ejabberd-build-deps \
	.build-ejabberd

build:
	# Setup a build environment
	@$(DOCKER) build -t $(MODULE):build .
	@$(DOCKER) run --rm -v $(shell pwd)/..:/build $(MODULE):build bash -c \
		'make -C /build/.travis build-module'

build-module: clean install .find-deps
	# Build $(MODULE) module from source
	@$(MKDIR) -p $(EBIN_DIRS)
	@$(PATCH) -p1 -d .. < ubuntu.patch
	@$(ERLC) \
		-o $(EBIN_DIRS) \
		$(INCLUDES) \
		$(EBINS) \
		-DLAGER \
		-DNO_EXT_LIB \
		$(SRC_DIR)/*.erl

package:
	# Create a new release package ($(MODULE)-$(MOD_VERSION).tar.gz)
	@$(MKDIR) -p package package/{conf,sql}
	@$(CP) -r $(EBIN_DIRS) package/
	@$(CP) ../LICENSE ../README.md ../INSTALL.md \
		../mod_unread.spec ../CHANGELOG.md \
		package/
	@$(CP) ../config/mod_unread.yml package/conf/
	@$(CP) ../config/postgres/99-pg-unread.sql package/sql/pg.sql
	@$(SED) -i -e '/\\connect/d' -e '/^$$/d' package/sql/pg.sql
	@$(CD) package && \
		$(TAR) cfvz ../$(MODULE)-$(MOD_VERSION).tar.gz --owner=0 --group=0 .
	@$(RM) -rf package

clean:
	# Clean all build results and temporary files
	@$(RM) -rf ejabberd*
