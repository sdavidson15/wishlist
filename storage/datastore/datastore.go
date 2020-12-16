package datastore

import (
	"wishlist/model"
)

type Datastore struct{}

func NewDatastore() *Datastore {
	return &Datastore{}
}

func (d *Datastore) ConfirmUser(sessionName, username, password string, usingCookie bool) (model.User, error) {
	// TODO: stub
	return model.User{
		Name:    username,
		Session: sessionName,
	}, nil
}

func (d *Datastore) GetUsers(sessionName string) ([]model.User, error) {
	// TODO: stub
	return []model.User{{
		Name:    `dummy-user-1`,
		Session: `dummy-session`,
	}, {
		Name:    `dummy-user-2`,
		Session: `dummy-session`,
	}, {
		Name:    `dummy-user-3`,
		Session: `dummy-session`,
	}}, nil
}

func (d *Datastore) GetItems(sessionName string) (model.Items, error) {
	// TODO: stub
	return model.Items{{
		Name:    `dummy-item-1`,
		Session: `dummy-session`,
		Owner:   `dummy-user-1`,
		Price:   `$10`,
		Order:   1,
		Descr:   `No description for this dummy item`,
	}, {
		Name:    `dummy-item-2`,
		Session: `dummy-session`,
		Owner:   `dummy-user-2`,
		Claimer: `dummy-user-1`,
		Price:   `$20`,
		Order:   1,
		Descr:   `No description for this dummy item`,
	}, {
		Name:    `dummy-item-3`,
		Session: `dummy-session`,
		Owner:   `dummy-user-3`,
		Price:   `$30`,
		Order:   1,
		Descr:   `No description for this dummy item`,
	}, {
		Name:    `dummy-item-4`,
		Session: `dummy-session`,
		Owner:   `dummy-user-3`,
		Claimer: `dummy-user-2`,
		Price:   `$5`,
		Order:   2,
		Descr:   `No description for this dummy item`,
	}}, nil
}

func (d *Datastore) StoreNewItems(sessionName, owner string, newItems model.Items) error {
	// TODO: stub
	return nil
}

func (d *Datastore) ClearUserItems(sessionName, owner string) error {
	// TODO: stub
	return nil
}
