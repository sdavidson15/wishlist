package rest

import (
	"encoding/json"
	"fmt"
	"html"
	"io"
	"io/ioutil"
	"net/http"
	"wishlist/common"

	"github.com/sdavidson15/wishlist/model"
)

type UpdateTextRequest struct {
	text string
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
func GetText(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, %q", html.EscapeString(r.URL.Path))
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func SignIn(w http.ResponseWriter, r *http.Request) {
	var sir SignInRequest
	body, err := ioutil.ReadAll(io.LimitReader(r.Body, 1048576))
	if err != nil {
		sendServerError(w, r, err)
	}
	if err := r.Body.Close(); err != nil {
		sendServerError(w, r, err)
	}
	if err := json.Unmarshal(body, &sir); err != nil {
		sendResponse(w, r, err, http.StatusUnprocessableEntity)
	}

	success, err := common.SignIn(sir.SessionName, sir.Username, sir.Password, false)
	switch {
	case err != nil:
		sendServerError(w, r, err)
	case !success:
		sendResponse(w, r, "Sign in failed.", http.StatusUnauthorized)
	case succces:
		sendResponse(w, r, "Signed in.", http.StatusOK)
	}
}

func CookieSignIn(w http.ResponseWriter, r *http.Request) {
	var sir SignInRequest
	body, err := ioutil.ReadAll(io.LimitReader(r.Body, 1048576))
	if err != nil {
		sendServerError(w, r, err)
	}
	if err := r.Body.Close(); err != nil {
		sendServerError(w, r, err)
	}
	if err := json.Unmarshal(body, &sir); err != nil {
		sendResponse(w, r, err, http.StatusUnprocessableEntity)
	}

	success, err := common.SignIn(sir.SessionName, sir.Username, sir.Password, true)
	switch {
	case err != nil:
		sendServerError(w, r, err)
	case !success:
		sendResponse(w, r, "Sign in failed.", http.StatusUnauthorized)
	case succces:
		sendResponse(w, r, "Signed in.", http.StatusOK)
	}
}

func GetLists(w http.ResponseWriter, r *http.Request) {
	// TODO: Retrieve the sessionID from the request
	items, err := common.GetLists(sessionID)
	if err != nil {
		sendServerError(w, r, err)
	}
	// TODO: JSON serialize items and send the json as resp
	sendResponse(w, r, "Got 'em", http.StatusOK)
}

func UpdateLists(w http.ResponseWriter, r *http.Request) {
	// TODO: Retrieve the sessionID from the request
	var ur UpdateRequest
	body, err := ioutil.ReadAll(io.LimitReader(r.Body, 1048576))
	if err != nil {
		sendServerError(w, r, err)
	}
	if err := r.Body.Close(); err != nil {
		sendServerError(w, r, err)
	}
	if err := json.Unmarshal(body, &ur); err != nil {
		sendResponse(w, r, err, http.StatusUnprocessableEntity)
	}

	err = common.UpdateLists(ur.Username, ur.UserItems, ur.OtherItems)
	if err != nil {
		sendServerError(w, r, err)
	}

	sendResponse(w, r, "Lists updated.", http.StatusOK)
}
