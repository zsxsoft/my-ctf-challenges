#!/bin/bash
# build in golang:1.21.3-bullseye
go build -a -gcflags=all="-l -B -wb=false" -ldflags "-s -w"
upx --brute --best clickhouse-to-hive
