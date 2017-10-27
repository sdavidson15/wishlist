package main

import (
	"bufio"
	"os"
	"strings"

	"wishlist/common"
	"wishlist/rest"
	"wishlist/storage"
)

func main() {
	dbDriver, dbSource, restUri := getConfiguration("config.txt")
	store := getStorage(dbDriver, dbSource)
	manager := common.NewManager(store)
	rest.Start(manager, restUri)
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

func getStorage(dbDriver, dbSource string) *storage.Storage {
	store := &storage.Storage{}
	err := store.StartConnection(storage.NewConfig(dbDriver, dbSource))
	if err != nil {
		panic(err)
	}
	return store
}
