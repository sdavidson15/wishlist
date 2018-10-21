package websocket

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"wishlist/common"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// FIXME: get rid of global vars
var (
	manager   = &common.Manager{}
	clientMap = make(map[string][]*websocket.Conn)
	broadcast = make(chan response)
	upgrader  = websocket.Upgrader{}
)

type response struct {
	resp    string
	session string
}

func Start(m *common.Manager, router *mux.Router, uri string) {
	manager = m

	router.HandleFunc("/ws/{session:[a-zA-Z]+}", handleMessages)
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

	session := strings.Split(r.RequestURI, "/")[2]
	clientMap[session] = append(clientMap[session], ws)

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Printf("%v", err)
			break
		}

		resp, err := handleMessage(manager, string(msg))
		if err != nil {
			log.Printf("Failed to handle websocket message: %v", err)
			broadcast <- response{"server-error", session}
			continue
		}

		broadcast <- response{resp, session}
	}
}

func broadcaster(manager *common.Manager) {
	for {
		r := <-broadcast

		for session, clients := range clientMap {
			if r.session != session {
				continue
			}

			remainingClients := []*websocket.Conn{}
			for _, client := range clients {
				err := client.WriteMessage(1, []byte(r.resp))
				if err != nil {
					log.Printf("A client failed to broadcast: %v", err)
					client.Close()
				} else {
					remainingClients = append(remainingClients, client)
				}
			}
			clientMap[session] = remainingClients
			break
		}
	}
}
