<?php
if (!isset($_FILES['file'])) exit;
$file = $_FILES['file'];
$zip = new ZipArchive();
if (true !== $zip->open($file['tmp_name'])) {
	echo 'No a valid zip';
	exit;
}
if (false === $zip->getFromName('tmp/random.txt')) {
	echo 'No file';
	exit;
}

$dest = 'uploads/' . md5($_SERVER['REMOTE_ADDR']) . hash('sha256', file_get_contents($file['tmp_name'])) . '.zip';
move_uploaded_file($file['tmp_name'], $dest);
echo 'Saved into ' . $dest;