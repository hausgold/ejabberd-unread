# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples

export LANG=en_US.UTF-8
export LANGUAGE=en_US.UTF-8
export LC_ALL=en_US.UTF-8

_GEM_PATHS=$(ls -d1 ${HOME}/.gem/ruby/*/bin 2>/dev/null | paste -sd ':')
_APP_PATHS=$(ls -d1 /app/vendor/bundle/ruby/*/bin 2>/dev/null | paste -sd ':')

export PATH="${_GEM_PATHS}:${_APP_PATHS}:${PATH}"
export PATH="/app/node_modules/.bin:${HOME}/.bin:/app/bin:${PATH}"

if [ "${MDNS_STACK}" = 'true' ]; then
  # Disable the autostart of all supervisord units
  sudo sed -i 's/autostart=.*/autostart=false/g' /etc/supervisor/conf.d/*

  # Start the supervisord (empty, no units)
  sudo supervisord >/dev/null 2>&1 &

  # Wait for supervisord
  while ! supervisorctl status >/dev/null 2>&1; do sleep 1; done

  # Boot the mDNS stack
  echo '# Start the mDNS stack'
  sudo supervisorctl start dbus avahi
  echo
fi

if [ "${SSH_STACK}" = 'true' ]; then
  # Start the ssh-agent
  echo '# Start the SSH agent'
  eval "$(ssh-agent -s)" >/dev/null

  # Run a user script for adding the relevant ssh keys
  if [ -f ~/.ssh/add-all ]; then
    . ~/.ssh/add-all
  fi
fi

# If not running interactively, don't do anything
case $- in
    *i*) ;;
    *) return;;
esac

# Clear the color for the first time
echo -e "\e[0m"

export HISTCONTROL="ignoreboth:erasedups"
export HISTSIZE=1000000

# Enable less mouse scrolling
export LESS=-r

# Default Editor
export EDITOR=vim

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "${debian_chroot:-}" ] && [ -r /etc/debian_chroot ]; then
  debian_chroot=$(cat /etc/debian_chroot)
fi

# If this is an xterm set the title to user@host:dir
case "$TERM" in
xterm*|rxvt*)
  PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
  ;;
*)
  ;;
esac

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
  test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" \
    || eval "$(dircolors -b)"
fi

if [ -f ~/.bash_aliases ]; then
  . ~/.bash_aliases
fi

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi

export COLOR_OPTIONS='--color=auto'

alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias .....="cd ../../../.."
alias ls='ls $COLOR_OPTIONS --group-directories-first --time-style="+%F, %T "'
alias ll='ls $COLOR_OPTIONS -lh'
alias l='ls $COLOR_OPTIONS -lAh'
alias grep='grep $COLOR_OPTIONS'
alias egrep='egrep $COLOR_OPTIONS'
alias g='git'
alias p='pwd'
alias mkdir='mkdir -p -v'
alias less='less -R'
alias x='exit'

# Bash won't get SIGWINCH if another process is in the foreground.
# Enable checkwinsize so that bash will check the terminal size when
# it regains control.  #65623
# http://cnswww.cns.cwru.edu/~chet/bash/FAQ (E11)
shopt -s checkwinsize

# Enable history appending instead of overwriting.
shopt -s histappend

# Enable extended globbing
shopt -s extglob

# Enable globbing for dotfiles
shopt -s dotglob

# Enable globstars for recursive globbing
shopt -s globstar

# Auto "cd" when entering just a path
shopt -s autocd

# Disable XOFF (interrupt data flow)
stty -ixoff

# Disable XON (interrupt data flow)
stty -ixon

bind "set completion-ignore-case on" # note: bind used instead of sticking these in .inputrc
bind "set bell-style none"           # no bell
bind "set show-all-if-ambiguous On"  # show list automatically, without double tab

# use ctl keys to move forward and back in words
bind '"\e[1;5C": forward-word'
bind '"\e[1;5D": backward-word'
bind '"\e[5C": forward-word'
bind '"\e[5D": backward-word'
bind '"\e\e[C": forward-word'
bind '"\e\e[D": backward-word'

# use arrow keys to fast search
bind '"\e[A": history-search-backward'
bind '"\e[B": history-search-forward'

# Enable colors for ls, etc.  Prefer ~/.dir_colors #64489
if type -P dircolors >/dev/null ; then
  if [[ -f ~/.dir_colors ]] ; then
    eval $(dircolors -b ~/.dir_colors)
  elif [[ -f /etc/DIR_COLORS ]] ; then
    eval $(dircolors -b /etc/DIR_COLORS)
  fi
fi

function watch-run()
{
  while [ 1 ]; do
    inotifywait --quiet -r `pwd` -e close_write --format '%e -> %w%f'
    bash -c "$@"
  done
}

PROMPT_COMMAND='RET=$?;'
RET_OUT='$(if [[ $RET = 0 ]]; then echo -ne "\[\e[0;32m\][G]"; else echo -ne "\[\e[0;31m\][Err: $RET]"; fi;)'
RET_OUT="\n$RET_OUT"

HOST="${MDNS_HOSTNAME}"
if [ -z "${HOST}" ]; then
  HOST="\h"
fi

_TIME='\t'
_FILES="\$(ls -a1 | grep -vE '\.$' | wc -l)"
_SIZE="\$(ls -lah | head -n1 | cut -d ' ' -f2)"
_META="${_TIME} | Files: ${_FILES} | Size: ${_SIZE} | \[\e[0;36m\]\w"
META=" \[\e[0;31m\][\[\e[1;37m\]${_META}\[\e[0;31m\]]\[\e[0;32m\]\033]2;\w\007"

PSL1=${RET_OUT}${META}
PSL2="\n\[\e[0;31m\][\u\[\e[0;33m\]@\[\e[0;37m\]${HOST}\[\e[0;31m\]] \[\e[0;31m\]$\[\e[0;32m\] "

export PS1=${PSL1}${PSL2}

# Rebind enter key to insert newline before command output
trap 'echo -e "\e[0m"' DEBUG
