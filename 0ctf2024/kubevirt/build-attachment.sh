#!/bin/sh
tar --exclude=challenge/virtctl* --exclude=./calicoctl --exclude=./challenge/.kubeconfig --exclude=./challenge/logs --exclude=attachment.tar.xz --exclude=.git --exclude=writeup -a -c -v -f attachment.tar.xz .
