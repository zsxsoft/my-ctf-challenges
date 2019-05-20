<?php
header("Content-Security-Policy: sandbox allow-scripts allow-same-origin; base-uri 'none';default-src 'self';script-src 'unsafe-inline' 'self';connect-src 'none';object-src 'none';frame-src 'none';font-src data: 'self';style-src 'unsafe-inline' 'self';");
