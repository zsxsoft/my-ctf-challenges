import os, queue, threading, datetime
from pathlib import Path
from time import sleep
from driver import spawn_chrome

DIR = '/_signal/'
THREAD_POOL_SIZE = 2  # how many Chromes can run at the same time


def worker():
	while True:
		blogid = q.get()
		os.remove(DIR + blogid)
		print('{} {} spawned'.format(datetime.datetime.now().strftime("[%b-%d %H:%M:%S]"), blogid))
		spawn_chrome(blogid)
		print('{} {} finished'.format(datetime.datetime.now().strftime("[%b-%d %H:%M:%S]"), blogid))
		q.task_done()


q = queue.Queue()
threads = []
for i in range(THREAD_POOL_SIZE):
	t = threading.Thread(target=worker)
	t.start()
	threads.append(t)

while True:
	if q.empty():
		q.join()
		signals = sorted(Path(DIR).iterdir(), key=lambda f: f.stat().st_mtime)
		for i in signals:
			q.put(i.name)
	sleep(5)
