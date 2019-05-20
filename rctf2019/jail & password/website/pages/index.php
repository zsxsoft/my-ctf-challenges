<?php
require './includes/check-auth.php';
?>
<?php
if (isset($_GET['method'])) {
  switch ($_GET['method']) {
    case 'delete':
      $stmt = $db->prepare('UPDATE posts SET deleted = 1 WHERE uid = ?');
      $stmt->execute([$user['id']]);
      break;
    case 'logout':
      unset($_SESSION['user']);
      break;
  }
  header('location: /');
  exit;
}

if (count($_POST) > 0) {
  $stmt = $db->prepare('INSERT INTO posts (id, uid, content, time, deleted) VALUES (?, ?, ?, NOW(), 0)');
  $stmt->execute([md5(uniqid('', true)), $user['id'], $_POST['message'] ?? '']);
}
$stmt = $db->prepare('SELECT * FROM posts WHERE `uid` = ? AND deleted = 0 ORDER BY time DESC');
$stmt->execute([$user['id']]);
$posts = $stmt->fetchAll();
?>
<!doctype html>
<html>
<head>
  <?php require './includes/header-tags.php';?>
  <title>Guestbook</title>
</head>
<body>
  <?php require './includes/navbar.php'; ?>
  <div class="ui container list">
    <?php foreach ($posts as $post) {?>
      <div class="item"><a href="/?action=post&id=<?php echo $post['id'];?>" target="_blank">[<?php echo $post['time'];?>]</a> <?php echo htmlspecialchars($post['content']);?></div>
    <?php }?>
  </div>

  <div class="ui container">
    <form method="post">
      <div class="ui form">
        <div class="field">
          <label>New Message</label>
          <textarea name="message"></textarea>
        </div>
        <div class="field">
          <button class="ui button submit" type="submit">Submit</button>
        </div>
      </div>
    </form>
  </div>
</body>

</html>
