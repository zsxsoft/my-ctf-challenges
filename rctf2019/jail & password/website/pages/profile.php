<?php require './includes/check-auth.php'; ?>
<?php
if (count($_POST) > 0) {
  if (isset($_FILES['avatar'])) {
    $avatar = $_FILES['avatar'];
    $path = pathinfo($avatar["name"]);
    $ext = $path['extension'] ?? 'jpg';
    if (preg_match('/ph|htm/i', $ext)) {
      $ext = 'jpg';
    }
    $fileName = 'uploads/' . md5(uniqid($user['id'], true)) . '.' . $ext;
    move_uploaded_file($avatar['tmp_name'], $fileName);
    $stmt = $db->prepare('UPDATE `users` SET `avatar` = ? WHERE `id` = ? ');
    $stmt->execute(['/' . $fileName, $user['id']]);
    $_SESSION['user']['avatar'] = '/' . $fileName;
  }
}
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
    <form method="post" enctype="multipart/form-data">
      <div class="ui form">
        <div class="field">
          <label>New Avatar</label>
          <input type="file" id="avatar" name="avatar" accept="image/*" />
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
