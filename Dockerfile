FROM hausgold/ejabberd:18.01
MAINTAINER Hermann Mayer <hermann.mayer@hausgold.de>

# Install custom supervisord units
COPY config/supervisor/* /etc/supervisor/conf.d/

# Install system packages and the ruby bundles
RUN rm -rf /var/lib/apt/lists/* && \
  sed -Ei 's/^# deb-src /deb-src /' /etc/apt/sources.list && \
  apt-get update -yqqq && \
  apt-get install -y \
    build-essential libicu-dev locales sudo curl wget \
    vim bash-completion inotify-tools git libexpat1-dev \
    fakeroot dpkg-dev libssl-dev libyaml-dev libgd-dev libwebp-dev && \
  echo 'en_US.UTF-8 UTF-8' >> /etc/locale.gen && /usr/sbin/locale-gen

# Install nodejs 16
RUN rm -rf /var/lib/apt/lists/* && \
  curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
  apt-get install -y nodejs

# Setup additional build dependencies for ejabberd/erlang
RUN cd /tmp && \
  apt-get source ejabberd && \
  apt-get build-dep -y ejabberd

# Setup the runtime directories for ejabberd
RUN mkdir /run/ejabberd && chmod ugo+rwx /run/ejabberd

# Setup a contrib modules directory
RUN mkdir -p /opt/modules.d/sources && \
  chmod ugo+rwx /opt/modules.d

# Add new app user
RUN mkdir /app && \
  adduser app --home /home/app --shell /bin/bash \
    --disabled-password --gecos ""
COPY config/docker/shell/* /home/app/
COPY config/docker/shell/* /root/
RUN chown app:app -R /app /home/app && \
  mkdir -p /home/app/.ssh

# Set the root password and grant root access to app
RUN echo 'root:root' | chpasswd
RUN echo 'app ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

WORKDIR /app
