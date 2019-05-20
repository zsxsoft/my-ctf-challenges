<?php
$message = '';
if (count($_POST) > 0) {
  $stmt = $db->prepare('INSERT INTO `users` (`username`, `password`, `avatar`) VALUES (?, ?, "/uploads/1x1.gif")');
  $ret = $stmt->execute([$_POST['username'] ?? '', $_POST['password'] ?? '']);
  if ($ret === false) {
    $message = 'Register failed';
  } else {
    header('Location: /?action=login');
  }
}
?>
<!doctype html>
<html>
<head>
  <?php require './includes/header-tags.php';?>
  <title>Sign Up</title>
</head>
<body>

<div class="ui middle aligned center aligned grid">
  <div class="column">
    <h2 class="ui image header">
      <div class="content">
        Signup account
      </div>
    </h2>
    <form class="ui large form" method="post">
      <div class="ui stacked segment">
        <div class="field">
          <div class="ui left icon input">
            <i class="user icon"></i>
            <input type="text" name="username" placeholder="Username">
          </div>
        </div>
        <div class="field">
          <div class="ui left icon input">
            <i class="lock icon"></i>
            <input type="password" name="password" placeholder="Password">
          </div>
        </div>
        <button class="ui fluid large submit button" type="submit">Signup</button>
      </div>

      <div class="ui error message" style="<?php echo $message === '' ? '' : 'display: block';?>"><?php echo $message;?></div>

    </form>

    <div class="ui message">
      Have account? <a href="/?action=login">Login</a>
    </div>
  </div>
</div>

</body>

</html>
