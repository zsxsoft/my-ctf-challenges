<?php
/**
 * I used SourceGuardian to protect my ``verify`` function.
 * It's so easy and you even don't need to decompile the extension...
 *
 * If you can't run this file, download loaders from https://www.sourceguardian.com/loaders.html
 */

require dirname(__FILE__) . '/protected.php';
if (verify('FLAG_HERE')) {
	echo 'Correct!';
} else {
	echo 'Wrong!';
}