#!/bin/bash

if [ ! -f /flag ]; then
	echo $FLAG > /flag
	chown root:root /flag && chmod 0600 /flag
	chmod u+s /readflag && chmod +x /readflag
fi

export FLAG=
exec su user -c "java -jar /app/duckknows.jar"
