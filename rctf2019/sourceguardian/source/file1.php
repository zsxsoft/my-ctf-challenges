<?php

function a ($q, $y, $z, $p, $e, $k) {
    return ((($z >> 5 & 0x07ffffff) ^ $y << 2) + (($y >> 3 & 0x1fffffff) ^ $z << 4)) ^ (($q ^ $y) + ($k[$p & 3 ^ $e] ^ $z));
}

function verify($str) {    
    if (php_sapi_name() === 'phpdbg') {
        die('Sorry but no phpdbg');
    }
    if (ini_get('vld.active') == 1) {
        dir('Sorry but no vld');
    }
    $v = unpack("V*", $str. str_repeat("\0", (4 - strlen($str) % 4) & 3));
    $v = array_values($v);
    $v[count($v)] = strlen($str);
    $b = [1029560848, 2323109303, 4208702724, 3423862500, 3597800709, 2222997091, 4137082249, 2050017171, 4045896598];
    $k = [1752186684, 1600069744, 1953259880, 1836016479];
    $n = count($v) - 1;
    $z = $v[$n];
    $q = floor(6 + 52 / ($n + 1));
    $sum = 0;
    while (0 < $q--) {
        $sum = ($sum + 0x9E3779B9) & 0xffffffff;
        $e = $sum >> 2 & 3;
        for ($p = 0; $p < $n; $p++) {
            $y = $v[$p + 1];
            $z = $v[$p] = ($v[$p] + a($sum, $y, $z, $p, $e, $k)) & 0xffffffff;
        }
        $y = $v[0];
        $z = $v[$n] = ($v[$n] + a($sum, $y, $z, $p, $e, $k)) & 0xffffffff;
    }
    for ($i = 0; $i < count($v); $i++) {
        $v[$i] = $v[$i] ^ $k[$i % 4];
    }
    return $v == $b;
}

