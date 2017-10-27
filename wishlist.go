package main

import (
	"github.com/sdavidson15/wishlist/common"
	"github.com/sdavidson15/wishlist/rest"
	"github.com/sdavidson15/wishlist/storage"
)

func main() {
	// TODO: Start database connection, wrap it in a storage struct, and wrap that storage struct in a manager.
	rest.Start(&common.NewManager(storage.Storage{}))
}
