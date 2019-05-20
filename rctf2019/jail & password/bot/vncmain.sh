#!/bin/bash
# Set them to empty is NOT SECURE but avoid them display in random logs.
export VNC_PASSWD='z5xVncPd'
export USER_PASSWD='user'
export DISPLAY=:11

sleep 5
xterm &
keepass2 /bot/password.kdbx -pw=12345678 &
node /bot/index.js


