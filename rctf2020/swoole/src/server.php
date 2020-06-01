#!/usr/bin/env php
<?php
Swoole\Runtime::enableCoroutine($flags = SWOOLE_HOOK_ALL);
$http = new Swoole\Http\Server("0.0.0.0", 9501);
$http->on("request",
    function (Swoole\Http\Request $request, Swoole\Http\Response $response) {
        Swoole\Runtime::enableCoroutine();
        $response->header('Content-Type', 'text/plain');
        // $response->sendfile('/flag');
        if (isset($request->get['phpinfo'])) {
            // Prevent racing condition
            // ob_start();phpinfo();
            // return $response->end(ob_get_clean());
            return $response->sendfile('phpinfo.txt');
        }
        if (isset($request->get['code'])) {
            try {
                $code = $request->get['code'];
                if (!preg_match('/\x00/', $code)) {
                    $a = unserialize($code);
                    $a();
                    $a = null;
                }
            } catch (\Throwable $e) {
                var_dump($code);
                var_dump($e->getMessage());
                // do nothing
            }
            return $response->end('Done');
        }
        $response->sendfile(__FILE__);
    }
);
$http->start();
