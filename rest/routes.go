package rest

import "net/http"

type Route struct {
	Name        string
	Method      string
	Pattern     string
	HandlerFunc http.HandlerFunc
}

type Routes []Route

func (h *Handler) Routes() Routes {
	return Routes{
		Route{"Get text", "GET", "/text", h.GetText},

		Route{"Sign in", "PUT", "/signin", h.SignIn},
		Route{"Sign in with cookie", "PUT", "/csignin", h.CookieSignIn},
		Route{"Get lists", "GET", "/lists/{session}", h.GetLists},
		Route{"Update lists", "PUT", "/lists/{session}", h.UpdateLists},
	}
}
