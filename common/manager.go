package common

import (
	"sort"

	"github.com/sdavidson15/wishlist/model"
	"github.com/sdavidson15/wishlist/storage"
)

type Manager struct {
	storage storage.Storage
}

func NewManager(s storage.Storage) Manager {
	return Manager{s}
}

func (m *Manager) SignIn(sessionName, username, password string, usingCookie bool) (bool, error) {
	_, err := m.storage.ConfirmUser(sessionName, username, password, usingCookie)
	// TODO: If err is a row not found error, return false, nil.
	if err != nil {
		return false, err
	}
	return true, nil
}

func (m *Manager) GetLists(sessionName string) (model.Items, error) {
	items := []model.Item{}

	users, err := m.storage.GetUsers(sessionName)
	if err != nil {
		return nil, err
	}
	sort.Sort(SortableUsers(users))

	for _, user := range users {
		currentItems, err := m.storage.GetItems(sessionName, user.Name)
		if err != nil {
			return nil, err
		}
		sort.Sort(SortableItems(currentItems))
		items = append(items, currentItems...)
	}

	return items, nil
}

func (m *Manager) UpdateLists(sessionName string, userList, otherList model.Items) error {
	// TODO: Pull the current lists, compare with the lists you have, and batch an
	// update
	return nil
}
