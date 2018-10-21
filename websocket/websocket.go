package websocket

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"

	"wishlist/common"
	"wishlist/model"
)

type message struct {
	session    string `json:"Session"`
	user       string `json:"User"`
	userItems  model.Items
	claimItems model.Items
}

// FIXME: get rid of global vars
var (
	clients   = make(map[*websocket.Conn]bool)
	broadcast = make(chan message)
	upgrader  = websocket.Upgrader{}
)

func Start(manager *common.Manager, router *mux.Router, uri string) {
	router.HandleFunc("/ws", handleConnections)
	go handleMessages(manager)

	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./frontend")))

	log.Print(fmt.Sprintf("Serving on %s", uri))
	log.Fatal(http.ListenAndServe(uri, router))
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		// FIXME: build a list of accepted origins
		return true
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(`Failed to upgrade initial request: `, err)
	}
	defer ws.Close()

	clients[ws] = true

	for {
		var msg message

		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("Malformed message: %v", err)
			continue
		}

		broadcast <- msg
	}
}

func handleMessages(manager *common.Manager) {
	for {
		msg := <-broadcast

		log.Print(msg)
		if err := manager.UpdateLists(
			msg.session,
			msg.user,
			msg.userItems,
			msg.claimItems,
		); err != nil {

			log.Printf("Failed to update items: %v", err)
			// TODO: broadcast a "save failed" message
		}

		for client, _ := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("A client failed to broadcast a message: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}
