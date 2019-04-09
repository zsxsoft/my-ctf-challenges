# coding: utf-8
import sys
from os import path
from threading import Timer
from time import sleep
from selenium import webdriver

SCHEMA = 'http'
DOMAIN = 'retter.2018.teamrois.cn'
PORT = '80'


class Chrome(object):
	def __init__(self, timeout=15):
		options = webdriver.ChromeOptions()
		options.set_headless()
		options.add_argument("--enable-javascript")
		options.add_argument('--no-sandbox')
		options.add_argument('--disable-gpu')
		# options.add_argument('--user-data-dir=' + data_dir)
		# self.status_file = path.join(data_dir, 'status.json')
		self.timeout = timeout
		self.driver = webdriver.Chrome(chrome_options=options)
		self.driver.set_page_load_timeout(timeout)
		self.driver.set_script_timeout(timeout)

	def add_cookie(self, cookie_dict):
		try:
			self.driver.add_cookie(cookie_dict)
		except:
			pass

	def get(self, url):
		self.driver.get(url)

	def quit(self):
		self.driver.close()
		self.driver.quit()


def spawn_chrome(url):
	try:
		landing_page = '{}://{}:{}/'.format(SCHEMA, DOMAIN, PORT)
		browser = Chrome()
		browser.get(landing_page)
		# required keys: "name" and "value"; optional keys: "path", "domain", "secure", "expiry"
		browser.add_cookie({
			'name': 'flag',
			'value': 'fake_flag{NO_HENTAI_DONT_TOUCH_ME_I_AM_NOT_FLAG}',
			'domain': DOMAIN,
		})
		t = Timer(browser.timeout, browser.quit)  # total time for a browser
		t.start()
		browser.get(url)
		sleep(3)  # after page completely loaded
		browser.quit()
		t.cancel()
		return None
	except Exception as e:
		print(e)
		return e

spawn_chrome(sys.argv[1])
