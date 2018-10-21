package websocket

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"

	"wishlist/common"
)

// FIXME: get rid of global vars
var (
	manager = &common.Manager{}
	clients   = make(map[*websocket.Conn]bool)
	broadcast = make(chan string)
	upgrader  = websocket.Upgrader{}
)

func Start(m *common.Manager, router *mux.Router, uri string) {
	manager = m

	router.HandleFunc("/ws", handleMessages)
	go broadcaster(manager)

	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./frontend")))

	log.Print(fmt.Sprintf("Serving on %s", uri))
	log.Fatal(http.ListenAndServe(uri, router))
}

func handleMessages(w http.ResponseWriter, r *http.Request) {
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
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Printf("%v", err)
			break
		}

		resp, err := handleMessage(manager, string(msg))
		if err != nil {
			log.Printf("Failed to handle websocket message: %v", err)
			broadcast <- "server-error"
			continue
		}

		broadcast <- resp
	}
}

func broadcaster(manager *common.Manager) {
	for {
		resp := <-broadcast

		for client, _ := range clients {
			err := client.WriteMessage(1, []byte(resp))
			if err != nil {
				log.Printf("A client failed to broadcast: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}
