<?php
$nonce = md5(openssl_random_pseudo_bytes(16));
header("Content-Security-Policy: script-src 'nonce-$nonce' 'strict-dynamic'; style-src 'unsafe-inline'", false);
if (!isset($_COOKIE['FLAG'])) {
  setcookie('FLAG', 'flag_is_in_admin_cookie');
}

if (isset($_POST['post'])) {
  //if (!empty($_POST['g-recaptcha-response'])) {
    //require('recaptcha-1.1.3/src/autoload.php');
    //$recaptcha = new \ReCaptcha\ReCaptcha('RECAPTCHA_SECRET');
    //$resp = $recaptcha->verify((string)$_POST['g-recaptcha-response'], $_SERVER['REMOTE_ADDR']);
    //if ($resp->isSuccess()) {
      exec('python ' . escapeshellarg('/app/bot/driver.py') . ' ' . escapeshellarg('http://amp.2018.teamrois.cn' . $_SERVER['REQUEST_URI'] . '?' . $_SERVER['QUERY_STRING']));
    //} else {
    //  die('Wrong reCAPTCHA');
    //}
  //}
}
?>
<!doctype html>
<html ⚡>
  <head>
    <meta charset="utf-8">
    <script async src="https://cdn.ampproject.org/v0.js" nonce="<?php echo $nonce;?>"></script>
    <title>⚡</title>
    <link rel="canonical" href="http://example.ampproject.org/article-metadata.html">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <script type="application/ld+json" nonce="<?php echo $nonce;?>">
      {
        "@context": "http://schema.org",
        "@type": "NewsArticle",
        "headline": "Open-source framework for publishing content",
        "datePublished": "2015-10-07T12:02:41Z",
        "image": [
          "logo.jpg"
        ]
      }
    </script>
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
    <style amp-custom>body {background:url(background.jpg) no-repeat;background-size:cover;}html,body,.main{min-height:100vh;width:100%;color:#fff;}.main{align-items: center;display: flex;justify-content: center; flex-direction: column;}.main *{ zoom: 2;}.grecaptcha-badge{display: none}</style>
  </head>
  <body>
      <div class="main">
<?php if (isset($_GET['name'])) { ?>
        <p>Dear <?php echo $_GET['name'];?>:</p>
<?php if (isset($_POST['post'])) { ?>
        <h2>We logged your request and contacted admin</h2>
        <h2>However, you'd better know</h2>
        <h1>YOU HAVE NO OPTION</h1>
<?php } else { ?>
        <h1>YOU'RE BEING TRACKING</h1>
        <!-- OK, I don't care AMP Standard -->
        <!-- It just wastes my time. -->
        <script src="https://www.google.com/recaptcha/api.js" nonce="<?php echo $nonce;?>"></script>
        <script nonce="<?php echo $nonce;?>">
        function onSubmit(token) {
          document.getElementById("form").submit()
        }
         </script>
        <form method="post" id="form">
          <input type="hidden" name="post" />
          <button class="g-recaptcha" type="submit" data-sitekey="RECAPTCHA" data-callback="onSubmit">STOP TRACKING ME</button>
        </form>
<?php }} else { ?>
        <h1>HEY</h1>
        <h3>INPUT YOUR NAME AFTER QUERYSTRING</h3>
<?php } ?>
      </div>
  </body>
</html>
