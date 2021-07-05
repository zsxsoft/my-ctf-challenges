<?php
highlight_file(__FILE__);
$host = $_GET['host'] ?? '127.0.0.1';
$options = ['hostname' => $host, 'port' => 8983, 'path' => '/solr'];
$client = new SolrClient($options);
$query = new SolrQuery();
$query->setQuery('lucene');
$query_response = $client->query($query);
$response = $query_response->getResponse();
print_r($response);
// Dont scan, only index.php & phpinfo.php available
