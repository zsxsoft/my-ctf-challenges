<?php
ob_start();
$input = file_get_contents('php://input');
$options =json_decode($input);
$ret = eval('return ' . (string) $options->expression . ';');
echo json_encode(['ret' => (string) $ret]);
