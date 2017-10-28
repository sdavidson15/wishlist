package imdb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
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
			filePath := getFilePath(request.sessionName, request.requestType+".json")
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
			filePath := getFilePath(request.sessionName, itemsRequest+".json")
			if err := os.Remove(filePath); err != nil {
				panic(err)
			}

			file, err := os.Create(filePath)
			if err != nil {
				panic(err)
			}
			file.Close()

			itemsJson, err := json.Marshal(update.items)
			if err != nil {
				panic(err)
			}

			err = ioutil.WriteFile(filePath, itemsJson, 0644)
			if err != nil {
				panic(err)
			}
		}
		if len(update.users) > 0 {
			filePath := getFilePath(request.sessionName, usersRequest+".json")
			if err := os.Remove(filePath); err != nil {
				panic(err)
			}

			file, err := os.Create(filePath)
			if err != nil {
				panic(err)
			}
			file.Close()

			usersJson, err := json.Marshal(update.users)
			if err != nil {
				panic(err)
			}

			err = ioutil.WriteFile(filePath, usersJson, 0644)
			if err != nil {
				panic(err)
			}
		}
	}
}

func (i *Imdb) SendRequest(sessionName, requestType string) ([]model.Item, []model.User, error) {
	i.requestChan <- &request{sessionName, requestType}
	resp := <-i.responseChan
	return resp.items, resp.users, resp.err
}

func (i *Imdb) Commit(items []model.Item, users []model.User) {
	i.updateChan <- &response{items, users, nil}
}

func getFilePath(sessionName, suffix string) string {
	currentDirectory, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	return currentDirectory + "\\storage\\imdb\\db\\" +
		fmt.Sprintf("%s_%s", util.RemoveAllWhiteSpace(strings.ToLower(sessionName)), suffix)
}
