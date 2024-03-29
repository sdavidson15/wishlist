package rest

import (
	"encoding/json"
	"log"
	"net/http"
)

func sendServerError(w http.ResponseWriter, r *http.Request, err error) {
	log.Printf("[ERROR] Server error: %v\n", err)
	sendResponse(w, r, err, http.StatusInternalServerError)
}

func sendResponse(w http.ResponseWriter, r *http.Request, resp interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		panic(err)
	}
}
