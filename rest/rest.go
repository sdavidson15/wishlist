package rest

import (
	"net/http"

	"github.com/gorilla/mux"

	"wishlist/common"
)

func Setup(manager *common.Manager, restUri string) *mux.Router {
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

	return router
}
