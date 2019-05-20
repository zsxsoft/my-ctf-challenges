<?php require './includes/check-auth.php'; ?>
<?php
if (count($_POST) > 0) {
  while (true) {
    if ($_POST['captcha'] != $_SESSION['captcha']) {
      $message = 'Captcha error!';
      break;
    }
    $id = preg_replace('/[^a-zA-Z0-9]/', '', $_POST['id'] ?? '');
    file_get_contents('http://bot:3000/query/' . $id);
    $message = 'Admin will view your post soon.';
    break;
  }
}
$_SESSION['captcha'] = random_int(1, 10000000);

?>
<!doctype html>
<html>
<head>
  <?php require './includes/header-tags.php';?>
  <title>Profile</title>
</head>
<body>
  <?php require './includes/navbar.php'; ?>

  <div class="ui container">
    <form method="post">
      <div class="ui form">
        <div class="ui error message" style="<?php echo $message === '' ? '' : 'display: block';?>"><?php echo $message;?></div>
        <div class="field">
          <label>Post ID</label>
          <input type="text" id="id" name="id" />
        </div>
        <div class="field">
          <label>Captcha: substr(md5(captcha), 0, 6) == "<?php echo substr(md5($_SESSION['captcha']), 0, 6);?>"</label>
          <input type="text" id="captcha" name="captcha" />
        </div>
        <div class="field">
          <button class="ui button submit" type="submit">Submit</button>
        </div>
      </div>
      <input type="hidden" name="test" value="1" />
    </form>
  </div>

</body>

</html>
