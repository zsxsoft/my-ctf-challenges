#/bin/sh
cd /bot
wget https://github.com/pfn/passifox/archive/chromeipass-2.8.1.zip
unzip chromeipass-2.8.1.zip -d node_modules
rm chromeipass-2.8.1.zip
cat keepass.js node_modules/passifox-chromeipass-2.8.1/chromeipass/background/init.js > tmp.js
cat tmp.js > node_modules/passifox-chromeipass-2.8.1/chromeipass/background/init.js
rm tmp.js
cd /bot/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/
chown root:root chrome_sandbox
chmod 4755 chrome_sandbox
sudo cp -p chrome_sandbox /usr/local/sbin/chrome-devel-sandbox
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
