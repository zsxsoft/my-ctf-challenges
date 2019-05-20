
<div class="ui inverted menu">
    <div class="ui container">
      <a href="#" class="header item">
        Guestbook
      </a>
      <a href="/" class="item">Home</a>
      <a href="/?action=feedback" class="item">Feedback</a>
      <a href="/?action=index&method=delete" class="item">Delete all</a>
      <div class="right menu">
        <a href="/?action=index&method=logout" class="item">Logout</a>
        <a href="/?action=profile" class="item"><img src="<?php echo $user['avatar'];?>" style="width:20px;height:20px;" alt="avatar"> <?php echo htmlspecialchars($user['username']); ?></a>
      </div>
    </div>
  </div>
