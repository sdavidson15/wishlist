package rest

import (
	"encoding/json"
	"fmt"
	"html"
	"io"
	"io/ioutil"
	"net/http"
	"strings"

	"wishlist/common"
	"wishlist/model"

	"github.com/gorilla/mux"
)

const byteLimit int64 = 1048576

type Handler struct {
	manager *common.Manager
}

type UpdateTextRequest struct {
	Text string
}

type SignInRequest struct {
	SessionName string
	Username    string
	Password    string
}

type UpdateRequest struct {
	Username   string
	UserItems  model.Items
	OtherItems model.Items
}

// This func only exists as my control variable. If this isn't working,
// then something more than just my code is going wrong.
func (h *Handler) GetText(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, %q", html.EscapeString(r.URL.Path))
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) SignIn(w http.ResponseWriter, r *http.Request) {
	var sir SignInRequest
	body, err := ioutil.ReadAll(io.LimitReader(r.Body, byteLimit))
	if err != nil {
		sendServerError(w, r, err)
		return
	}
	if err := r.Body.Close(); err != nil {
		sendServerError(w, r, err)
		return
	}
	if err := json.Unmarshal(body, &sir); err != nil {
		sendResponse(w, r, err, http.StatusUnprocessableEntity)
		return
	}

	success, err := h.manager.SignIn(sir.SessionName, sir.Username, sir.Password, false)
	switch {
	case err != nil:
		sendServerError(w, r, err)
	case !success:
		sendResponse(w, r, "Sign in failed.", http.StatusUnauthorized)
	case success:
		sendResponse(w, r, "Signed in.", http.StatusOK)
	}
}

func (h *Handler) CookieSignIn(w http.ResponseWriter, r *http.Request) {
	var sir SignInRequest
	body, err := ioutil.ReadAll(io.LimitReader(r.Body, byteLimit))
	if err != nil {
		sendServerError(w, r, err)
		return
	}
	if err := r.Body.Close(); err != nil {
		sendServerError(w, r, err)
		return
	}
	if err := json.Unmarshal(body, &sir); err != nil {
		sendResponse(w, r, err, http.StatusUnprocessableEntity)
		return
	}

	success, err := h.manager.SignIn(sir.SessionName, sir.Username, sir.Password, true)
	switch {
	case err != nil:
		sendServerError(w, r, err)
	case !success:
		sendResponse(w, r, "Sign in failed.", http.StatusUnauthorized)
	case success:
		sendResponse(w, r, "Signed in.", http.StatusOK)
	}
}

func (h *Handler) GetLists(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	sessionName := params["session"]
	sessionName = strings.Replace(sessionName, "%20", " ", -1)

	items, err := h.manager.GetLists(sessionName)
	if err != nil {
		if err.Error() == "Session not found" {
			sendResponse(w, r, err, http.StatusNotFound)
		}
		sendServerError(w, r, err)
		return
	}

	sendResponse(w, r, items, http.StatusOK)
}

func (h *Handler) UpdateLists(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	sessionName := params["session"]
	sessionName = strings.Replace(sessionName, "%20", " ", -1)

	var ur UpdateRequest
	body, err := ioutil.ReadAll(io.LimitReader(r.Body, byteLimit))
	if err != nil {
		sendServerError(w, r, err)
		return
	}
	if err := r.Body.Close(); err != nil {
		sendServerError(w, r, err)
		return
	}
	if err := json.Unmarshal(body, &ur); err != nil {
		sendResponse(w, r, err, http.StatusUnprocessableEntity)
		return
	}

	err = h.manager.UpdateLists(sessionName, ur.Username, ur.UserItems, ur.OtherItems)
	if err != nil {
		sendServerError(w, r, err)
		return
	}

	sendResponse(w, r, "Lists updated.", http.StatusOK)
}
