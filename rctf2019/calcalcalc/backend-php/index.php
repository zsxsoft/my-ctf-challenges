<?php
ob_start();
$input = file_get_contents('php://input');
$options = MongoDB\BSON\toPHP($input);
$ret = eval('return ' . (string) $options->expression . ';');
echo MongoDB\BSON\fromPHP(['ret' => (string) $ret]);
