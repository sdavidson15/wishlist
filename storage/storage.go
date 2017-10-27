package storage

import (
	"wishlist/model"
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

func (s Storage) GetItems(sessionName string) ([]model.Item, error) {
	// TODO: Retrieve items by sessionName
	return []model.Item{}, nil
}

func (s Storage) StoreNewItems(sessionName, owner string, newItems model.Items) error {
	// TODO: Clear all the items for this user, and then add all the newItems
	return nil
}

func (s Storage) UpdateItemClaimers(sessionName, owner string, newItems model.Items) error {
	// TODO: Set the claimer row for each stored item in that appears in newItems to newItem.Claimer.
	return nil
}
