package rest

import (
	"log"
	"net/http"
	"strings"
	"wishlist/common"

	"github.com/gorilla/mux"
)

func Setup(manager *common.Manager, restUri string) *mux.Router {
	// Redirect http to https
	// go http.ListenAndServe(":80", http.HandlerFunc(redirect))

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

func redirect(w http.ResponseWriter, r *http.Request) {
	host := strings.Split(r.Host, ":")[0]
	target := "https://" + host + r.URL.Path
	// Concatenate query params here, if necessary
	log.Printf("Redirect to %s", target)
	http.Redirect(w, r, target, http.StatusTemporaryRedirect)
}
