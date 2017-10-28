package imdb

import (
	"fmt"
	"sort"

	"wishlist/common/util"
	"wishlist/model"
)

const (
	usersRequest = "users"
	itemsRequest = "items"
	noRequest    = "no"
)

func (i *Imdb) ConfirmUser(sessionName, username, password string, usingCookie bool) (model.User, error) {
	_, users, err := i.SendRequest(sessionName, usersRequest)
	if err != nil {
		return model.User{}, err
	}
	defer i.Commit([]model.Item{}, []model.User{})

	for _, user := range users {
		if user.Name == username && user.Session == sessionName && (usingCookie || user.Password == password) {
			user.Password = ""
			return user, nil
		}
	}

	return model.User{}, fmt.Errorf("User not found")
}

func (i *Imdb) GetUsers(sessionName string) ([]model.User, error) {
	_, users, err := i.SendRequest(sessionName, usersRequest)
	if err != nil {
		return []model.User{}, err
	}
	defer i.Commit([]model.Item{}, []model.User{})

	return users, nil
}

func (i *Imdb) GetItems(sessionName string) (model.Items, error) {
	items, _, err := i.SendRequest(sessionName, itemsRequest)
	if err != nil {
		return []model.Item{}, err
	}
	defer i.Commit([]model.Item{}, []model.User{})

	return items, nil
}

func (i *Imdb) StoreNewItems(sessionName, owner string, newItems model.Items) error {
	items, _, err := i.SendRequest(sessionName, itemsRequest)
	if err != nil {
		return err
	}

	items = append(items, newItems...)
	sort.Sort(util.SortableItems(items))

	i.Commit(items, []model.User{})
	return nil
}

func (i *Imdb) ClearUserItems(sessionName, owner string) error {
	items, _, err := i.SendRequest(sessionName, itemsRequest)
	if err != nil {
		return err
	}

	finalItems := model.Items{}
	for _, item := range items {
		if item.Owner != owner {
			finalItems = append(finalItems, item)
		}
	}
	sort.Sort(util.SortableItems(finalItems))

	i.Commit(finalItems, []model.User{})
	return nil
}
