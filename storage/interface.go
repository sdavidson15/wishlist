package storage

import "wishlist/model"

type Storage interface {
	ConfirmUser(sessionName, username, password string, usingCookie bool) (model.User, error)
	GetUsers(sessionName string) ([]model.User, error)
	GetItems(sessionName string) (model.Items, error)
	StoreNewItems(sessionName, owner string, newItems model.Items) error
	ClearUserItems(sessionName, owner string) error
}
