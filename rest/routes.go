package rest

import "net/http"

type Route struct {
	Name        string
	Method      string
	Pattern     string
	HandlerFunc http.HandlerFunc
}

type Routes []Route

var routes = Routes{
	Route{"Get text", "GET", "/text", GetText},

	Route{"Sign in", "PUT", "/signin", SignIn},
	Route{"Sign in with cookie", "PUT", "/csignin", CookieSignIn},
	Route{"Get lists", "GET", "/lists/{session}", GetLists},
	Route{"Update lists", "PUT", "/lists/{session}", UpdateLists},
}
