package main

import (
	"fmt"
	"net/http"
	"strings"

	"wishlist/common"
	"wishlist/rest"
	"wishlist/storage"
	"wishlist/storage/datastore"
)

func EntryPoint(w http.ResponseWriter, r *http.Request) {
	handler := rest.Handler{}
	handler.SetManager(common.NewManager(getDatastore()))

	fields := strings.Split(r.URL.Path, `/`)
	if len(fields) < 2 {
		fmt.Fprintf(w, `Wishlist API base path`)
		return
	}

	switch fields[1] {
	case ``:
		fmt.Fprintf(w, `Wishlist API base path`)
		return
	case `signin`:
		handler.SignIn(w, r)
		return
	case `csignin`:
		handler.CookieSignIn(w, r)
		return
	case `lists`:
		if r.Method == `GET` {
			handler.GetLists(w, r)
			return
		}
		if r.Method == `PUT` {
			handler.UpdateLists(w, r)
			return
		}
	}

	http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
}

func getDatastore() storage.Storage {
	return datastore.NewDatastore()
}
