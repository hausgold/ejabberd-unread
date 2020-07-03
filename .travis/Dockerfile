FROM ubuntu:bionic
RUN \
  sed -i 's/# deb-src/deb-src/g' /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y build-essential wget curl sudo
