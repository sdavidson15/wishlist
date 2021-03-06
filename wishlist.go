package main

import (
	"bufio"
	"flag"
	"log"
	"os"
	"strings"
	"wishlist/common"
	"wishlist/rest"
	"wishlist/storage"
	"wishlist/storage/imdb"
	"wishlist/storage/mysql"
	"wishlist/websocket"
)

func main() {
	flags := flag.NewFlagSet("wishlist-flag-set", flag.ExitOnError)
	inmem := flags.Bool("inmem", false, "Enter value true to use a database system that writes files into this project directory, rather than a MySQL database.")

	flags.Parse(os.Args[1:])

	dbDriver, dbSource, restUri := getConfiguration("config.txt")
	store := getStorage(dbDriver, dbSource, *inmem)
	manager := common.NewManager(store)

	// Check of SSL certificates exist
	_, err1 := os.Stat("cert.pem")
	_, err2 := os.Stat("key.pem")

	useTLS := true
	if os.IsNotExist(err1) || os.IsNotExist(err2) {
		log.Printf("Missing a SSL certificate.")
		restUri = ":8080"
		useTLS = false
	}

	router := rest.Setup(manager, restUri)
	websocket.Start(manager, router, restUri, useTLS)
}

func getConfiguration(filePath string) (dbDriver, dbSource, restUri string) {
	f, err := os.Open(filePath)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)

	scanner.Scan()
	dbDriverSpec := scanner.Text()
	if err := scanner.Err(); err != nil {
		panic(err)
	}

	scanner.Scan()
	dbSourceSpec := scanner.Text()
	if err := scanner.Err(); err != nil {
		panic(err)
	}

	scanner.Scan()
	restUriSpec := scanner.Text()
	if err := scanner.Err(); err != nil {
		panic(err)
	}

	dbDriver = strings.Split(dbDriverSpec, "=")[1]
	dbSource = strings.Split(dbSourceSpec, "=")[1]
	restUri = strings.Split(restUriSpec, "=")[1]
	return
}

func getStorage(dbDriver, dbSource string, inmem bool) storage.Storage {
	var store storage.Storage
	if inmem {
		imdb := &imdb.Imdb{}
		imdb.StartConnection()
		store = imdb
	} else {
		mysqlDB := &mysql.MySqlDb{}
		err := mysqlDB.StartConnection(mysql.NewConfig(dbDriver, dbSource))
		if err != nil {
			panic(err)
		}
		store = mysqlDB
	}

	return store
}
