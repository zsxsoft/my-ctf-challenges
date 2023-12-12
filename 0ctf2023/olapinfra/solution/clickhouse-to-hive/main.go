package main

import (
	"context"
	"github.com/beltran/gohive"
	"log"
	"os"
)

func main() {
	conf := gohive.NewConnectConfiguration()
	conf.Username = "root" // username maybe empty
	connection, errConn := gohive.Connect("hive", 10000, "NONE", conf)
	if errConn != nil {
		log.Fatalln(errConn)
	}
	defer connection.Close()
	cursor := connection.Cursor()
	ctx := context.Background()
	cursor.Exec(ctx, os.Args[1])
	if cursor.Err != nil {
		log.Fatalln(cursor.Err)
	}
	defer cursor.Close()
	var s string
	for cursor.HasMore(ctx) {
		cursor.FetchOne(ctx, &s)
		if cursor.Err != nil {
			log.Fatalln(cursor.Err)
		}
		log.Println(s)
	}
}
