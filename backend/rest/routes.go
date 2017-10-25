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
	Route{"Get Text", "GET", "/text", GetText},
	Route{"Update Text", "POST", "/text", UpdateText},
}
