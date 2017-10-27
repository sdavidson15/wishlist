package storage

import (
	"github.com/sdavidson15/wishlist/model"
)

type Storage struct {
}

func (s Storage) ConfirmUser(sessionName, username, password string, usingCookie bool) (model.User, error) {
	if usingCookie {
		// TODO: Retrieve user without password
	} else {
		// TODO: Retrieve user with password
	}
	return model.User{}, nil
}

func (s Storage) GetUsers(sessionName string) ([]model.User, error) {
	// TODO: Retrieve users by sessionName
	return []model.User{}, nil
}

func (s Storage) GetItems(sessionName, username string) ([]model.Item, error) {
	// TODO: Retrieve items by sessionName and username
	return []model.Item{}, nil
}

func (s Storage) UpdateItems(sessionName string, newItems model.Items) error {
	// TODO: Update all the items in the list
	return nil
}
