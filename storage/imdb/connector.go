package imdb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"
	"strings"

	"wishlist/common/util"
	"wishlist/model"
)

type Imdb struct {
	requestChan  chan *request
	responseChan chan *response
	updateChan   chan *response
}

type request struct {
	sessionName string
	requestType string
}

type response struct {
	items []model.Item
	users []model.User
	err   error
}

func (i *Imdb) StartConnection() {
	i.requestChan = make(chan *request)
	i.responseChan = make(chan *response)
	i.updateChan = make(chan *response)
	go i.Run()
	log.Print("Connected to file system database.")
}

func (i *Imdb) Run() {
	for {
		request := <-i.requestChan

		resp := &response{}
		if request.requestType != noRequest {
			filePath := getFilePath(request.sessionName, request.requestType+".json", false)
			bytes, err := ioutil.ReadFile(filePath)
			if err != nil {
				i.responseChan <- &response{err: fmt.Errorf("Session not found")}
				continue
			}

			if request.requestType == itemsRequest {
				var items []model.Item
				if err := json.Unmarshal(bytes, &items); err != nil {
					i.responseChan <- &response{err: err}
					continue
				}
				resp = &response{items: items}
			} else if request.requestType == usersRequest {
				var users []model.User
				if err := json.Unmarshal(bytes, &users); err != nil {
					i.responseChan <- &response{err: err}
					continue
				}
				resp = &response{users: users}
			}
		}
		i.responseChan <- resp

		update := <-i.updateChan

		if len(update.items) > 0 {
			itemsJson, err := json.Marshal(update.items)
			if err != nil {
				panic(err)
			}

			filePath := getFilePath(request.sessionName, itemsRequest+".json", false)
			if err := os.Remove(filePath); err != nil {
				panic(err)
			}

			writeFile(filePath, itemsJson);

			snapshotPath := getFilePath(timestamp() + "_" + 
				request.sessionName, itemsRequest+"_snapshot.json", true)
			
			writeFile(snapshotPath, itemsJson)
		}
		if len(update.users) > 0 {
			usersJson, err := json.Marshal(update.users)
			if err != nil {
				panic(err)
			}

			filePath := getFilePath(request.sessionName, usersRequest+".json", false)
			if err := os.Remove(filePath); err != nil {
				panic(err)
			}

			writeFile(filePath, usersJson);

			snapshotPath := getFilePath(timestamp() + "_" +
				request.sessionName, usersRequest+"_snapshot.json", true)
			
			writeFile(snapshotPath, usersJson)
		}
	}
}

func (i *Imdb) SendRequest(sessionName, requestType string) ([]model.Item, []model.User, error) {
	// TODO: Send uuid request id as well, so that you can always correlate a request with a commit.
	// That way you can get rid of the update channel and use just the response channel.
	// If a message received on the responseChan does not match the current request id, then it's a noop.
	// That way i.Commit() can be called as often as possible without the fear of changing data if no prior
	// request was sent.
	i.requestChan <- &request{sessionName, requestType}
	resp := <-i.responseChan
	return resp.items, resp.users, resp.err
}

func (i *Imdb) Commit(items []model.Item, users []model.User) {
	i.updateChan <- &response{items, users, nil}
}

func writeFile(filePath string, data []byte) {
	file, err := os.Create(filePath)
	if err != nil {
		panic(err)
	}
	file.Close()

	err = ioutil.WriteFile(filePath, data, 0644)
	if err != nil {
		panic(err)
	}
}

func getFilePath(sessionName, suffix string, isSnapshot bool) string {
	currentDirectory, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	pathSuffix := ""
	if isSnapshot {
		pathSuffix = "/snapshot"
	}

	return currentDirectory + "/storage/imdb/db" + pathSuffix +
		fmt.Sprintf("/%s_%s", util.RemoveAllWhiteSpace(strings.ToLower(sessionName)), suffix)
}

func timestamp() string {
	// Hold for 10 ms to ensure unique timestamps
	time.Sleep(10 * time.Millisecond)

	str := time.Now().Format("2006Jan_2_15:04:05:06")
	return strings.Replace(str, ":", "꞉", -1) // Replace U+003A with U+A789
}
