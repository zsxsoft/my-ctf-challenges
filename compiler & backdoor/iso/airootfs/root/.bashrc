#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
PS1='[\u@\h \W]\$ '


function center () {
  COLUMNS=$(tput cols) 
  printf "%*s\n" $(((${#1}+$COLUMNS)/2)) "$1"
}


center "      ___           ___                                 "
center "     /  /\         /  /\          ___           ___     "
center "    /  /::\       /  /::\        /__/\         /  /\    "
center "   /  /:/\:\     /  /:/\:\       \  \:\       /  /::\   "
center "  /  /::\ \:\   /  /:/  \:\       \__\:\     /  /:/\:\  "
center " /__/:/\:\_\:\ /__/:/ \  \:\      /  /::\   /  /::\ \:\ "
center " \__\/~|::\/:/ \  \:\  \__\/     /  /:/\:\ /__/:/\:\ \:\\"
center "    |  |:|::/   \  \:\          /  /:/__\/ \__\/  \:\_\/"
center "    |  |:|\/     \  \:\        /__/:/           \  \:\  "
center "    |__|:|~       \  \:\       \__\/             \__\/  "
center "     \__\|         \__\/                                "
center
center

center "Welcome to RCTF compile environment!"
center
center "I prepared the latest gcc for you!"
center "This image also contains python, rsync and openssh."
center "Have fun!"