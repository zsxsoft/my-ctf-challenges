<?php
require './includes/csp.php';
$stmt = $db->prepare('SELECT * FROM `posts` WHERE `id` = ? AND deleted = 0');
$stmt->execute([$_GET['id'] ?? '']);
$ret = $stmt->fetch();
setcookie('hint1', 'flag1_is_in_cookie');
setcookie('hint2', 'meta_refresh_is_banned_in_server');
?>
<script>
window.addEventListener("beforeunload", function (event) {
  event.returnValue = "Are you sure want to exit?"
  return "Are you sure want to exit?"
})
Object.freeze(document.location) <?php /* Sometimes beforeunload will not be triggered because no user interactive here, so free location to forbit redirection */ ?>
</script>
<?php
if ($ret) {
  echo $ret['content'];
}
