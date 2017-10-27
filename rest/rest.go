package rest

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"wishlist/common"
)

func Start(manager *common.Manager, restUri string) {
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
	log.Print(fmt.Sprintf("Serving on %s", restUri))
	log.Fatal(http.ListenAndServe(restUri, router))
}
