#!/bin/bash
#
# This script will perform the installation of the mod_unread ejabberd
# module. It has the same requirements as described on the readme file.  We
# download the module and install it to your systems ejabberd files.
#
# This script was tested on Ubuntu Bionic (18), and works just on
# Ubuntu/Debian.
#
# This script should be called like this:
#
#   $ curl -L 'https://bit.ly/3esKfvM' | bash
#
# Used Ubuntu packages: wget
#
# @author Hermann Mayer <hermann.mayer92@gmail.com>

# Fail on any errors
set -eE

# Specify the module/ejabberd version
MOD_VERSION=1.0.1
SUPPORTED_EJABBERD_VERSION=18.01

# Check for Debian/Ubuntu, otherwise die
if ! grep -P 'Ubuntu|Debian' /etc/issue >/dev/null 2>&1; then
  echo 'Looks like you are not running Debian/Ubuntu.'
  echo 'This installer is only working for them.'
  echo 'Sorry.'
  exit 1
fi

# Discover the installed ejabberd version
EJABBERD_VERSION=$(dpkg -l ejabberd | grep '^ii' \
  | awk '{print $3}' | cut -d- -f1)

# Check for the ejabberd ebin repository, otherwise die
if [ -z "${EJABBERD_VERSION}" ]; then
  echo 'ejabberd is currently not installed via apt.'
  echo 'Suggestion: sudo apt-get install ejabberd'
  exit 1
fi

# Check for the correct ejabberd version is available
if [ "${EJABBERD_VERSION}" != "${SUPPORTED_EJABBERD_VERSION}" ]; then
  echo "The installed ejabberd version (${EJABBERD_VERSION}) is not supported."
  echo "We just support ejabberd ${SUPPORTED_EJABBERD_VERSION}."
  echo 'Sorry.'
  exit 1
fi

# Discover the ejabberd ebin repository on the system
EBINS_PATH=$(dirname $(dpkg -L ejabberd \
  | grep 'ejabberd.*/ebin/.*\.beam$' | head -n1))

# Check for the ejabberd ebin repository, otherwise die
if [ ! -d "${EBINS_PATH}" ]; then
  echo 'No ejabberd ebin repository path was found.'
  echo 'Sorry.'
  exit 1
fi

# Download the module binary distribution and install it
URL="https://github.com/hausgold/ejabberd-unread/releases/"
URL+="download/${MOD_VERSION}/ejabberd-unread-${MOD_VERSION}.tar.gz"

cd /tmp
rm -rf ejabberd-unread ejabberd-unread.tar.gz

mkdir ejabberd-unread
wget -O ejabberd-unread.tar.gz "${URL}"
tar xf ejabberd-unread.tar.gz \
  --no-same-owner --no-same-permissions -C ejabberd-unread

echo "Install ejabberd-unread to ${EBINS_PATH} .."
sudo chown root:root ejabberd-unread/{sql,ebin}/*
sudo chmod 0644 ejabberd-unread/{sql,ebin}/*
sudo cp -far ejabberd-unread/ebin/* "${EBINS_PATH}"
sudo mkdir -p "${EBINS_PATH}/../sql"
sudo cp -far ejabberd-unread/sql/* \
  "${EBINS_PATH}/../sql/mod_unread.sql"
rm -rf ejabberd-unread ejabberd-unread.tar.gz

echo -e "\n\n"
echo -n 'The SQL migration file was installed to: '
echo $(realpath "${EBINS_PATH}/../sql/mod_unread.sql")
echo -n 'Take care of the configuration of mod_unread on '
echo '/etc/ejabberd/ejabberd.yml'
echo 'Restart the ejabberd server afterwards.'
echo
echo 'Done.'
