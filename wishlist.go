package main

import (
	"wishlist/common"
	"wishlist/rest"
	"wishlist/storage"
)

func main() {
	// TODO: Start database connection, wrap it in a storage struct, and wrap that storage struct in a manager.
	m := common.NewManager(storage.Storage{})
	rest.Start(&m)
}
