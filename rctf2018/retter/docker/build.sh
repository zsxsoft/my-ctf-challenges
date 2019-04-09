#!/bin/bash
npm run build
cp /app/docker/hosts /etc/hosts
cp /app/docker/retter /etc/nginx/conf.d/retter.conf

# Block payload:
# http://localhost:8667/</script><scr<script></script>ipt>var%20webpa<script></script>ckJsonp%20=%20(a,%20b,%20c)%20=>%20%7Bif%20(b['./universal/components/Flag.js'])%20console.log(a,%20b['./universal/components/Flag.js'].toString(),%20c)%7D;</script><scr<script></script>ipt%20src=http<script></script>://cdn.retter.rctf.zsxsoft.com:8664/flag_3bce8e296124f6ffeb78.js></script>

sed -i '1s/^/if (!\/for.*?push.*?Object.prototype.hasOwnProperty.call.*?shift.*?return.*\\}$\/.test(webpackJsonp.toString())) { webpackJsonp([], "DONT USE JSONP WAY"); window.webpackJsonp = undefined } else\n/' /app/build/flag*

# Block payload:
# </script><scr<script></script>ipt>var webpa<script></script>ckJsonp = (a, b, c) => {console.log(b);if (b['./universal/components/Flag.js']) console.log(a, b['./universal/components/Flag.js'].toString(), c)};</script>
sed -i '1s/^/window.webpackJsonp = undefined;/' /app/build/manifest*
