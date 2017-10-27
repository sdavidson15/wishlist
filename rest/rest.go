package rest

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/sdavidson15/wishlist/common"
)

func Start(manager *common.Manager) {
	router := mux.NewRouter().StrictSlash(true)
	h := &Handler{manager}
	for _, route := range h.Routes() {
		var handler http.Handler

		handler = route.HandlerFunc
		handler = Logger(handler, route.Name)

		router.
			Methods(route.Method).
			Path(route.Pattern).
			Name(route.Name).
			Handler(handler)
	}
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./frontend")))
	log.Fatal(http.ListenAndServe(":8080", router))
}
