#!/bin/bash
sysctl -p
exec su root -c "gunicorn app:app -c gunicorn.conf.py"
# Use ``su`` to let pam_limits works