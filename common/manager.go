package common

import (
	"sort"

	"github.com/sdavidson15/wishlist/model"
)

func SignIn(sessionName, username, password string, usingCookie bool) (bool, error) {
	_, err := ctx.storage.ConfirmUser(sessionName, username, password, usingCookie)
	if err == model.ErrUserNotFound {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return true, nil
}

func GetLists(sessionName string) (model.Items, error) {
	items := []model.Item{}

	users, err := ctx.storage.GetUsers(sessionName)
	if err != nil {
		return nil, err
	}
	sort.Sort(SortableUsers(users))

	for _, user := range users {
		currentItems, err := ctx.storage.GetItems(sessionName, user)
		if err != nil {
			return nil, err
		}
		sort.Sort(SortableItems(currentItems))
		item = append(items, currentItems)
	}

	return items, nil
}

func UpdateLists(sessionName string, userList, otherList model.Items) error {
	// TODO: Pull the current lists, compare with the lists you have, and batch an
	// update
	return nil
}
