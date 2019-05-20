<?php
$message = '';
if (count($_POST) > 0) {
  $stmt = $db->prepare('SELECT * FROM `users` WHERE `username` = ? AND `password` = ?');
  $stmt->execute([$_POST['username'] ?? '', $_POST['password'] ?? '']);
  $ret = $stmt->fetch();
  if ($ret === false) {
    $message = 'Login failed';
  } else {
    $_SESSION['user'] = $ret;
    header('location: /');
  }
}
?>
<!doctype html>
<html>
<head>
  <?php require './includes/header-tags.php';?>
  <title>Login</title>
</head>
<body>

<div class="ui middle aligned center aligned grid">
  <div class="column">
    <h2 class="ui image header">
      <div class="content">
        Log-in to your account
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
        <button class="ui fluid large submit button" type="submit">Login</button>
      </div>

      <div class="ui error message" style="<?php echo $message === '' ? '' : 'display: block';?>"><?php echo $message;?></div>

    </form>

    <div class="ui message">
      New to us? <a href="/?action=signup">Sign Up</a>
    </div>
  </div>
</div>

</body>

</html>
