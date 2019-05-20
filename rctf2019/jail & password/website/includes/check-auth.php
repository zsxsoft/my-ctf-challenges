<?php
if (!isset($_SESSION['user'])) {
  header('location: /?action=login');
  exit;
}
$user = &$_SESSION['user'];
?>
