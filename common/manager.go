package common

import (
	"fmt"
	"sort"

	"wishlist/common/util"
	"wishlist/model"
	"wishlist/storage"
)

type Manager struct {
	storage storage.Storage
}

func NewManager(s storage.Storage) *Manager {
	return &Manager{s}
}

func (m *Manager) SignIn(sessionName, username, password string, usingCookie bool) (bool, error) {
	_, err := m.storage.ConfirmUser(sessionName, username, password, usingCookie)
	if err != nil {
		if err.Error() == "User not found" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (m *Manager) GetLists(sessionName string) (model.Items, error) {
	items, err := m.storage.GetItems(sessionName)
	if err != nil {
		return nil, err
	}
	sort.Sort(util.SortableItems(items))

	return items, nil
}

func (m *Manager) UpdateLists(sessionName, username string, updatedUserItems, updatedClaimItems model.Items) error {
	for i, item := range updatedUserItems {
		for j, jtem := range updatedUserItems {
			if i != j && item.Name == jtem.Name {
				return fmt.Errorf("Duplicate item names are not permitted")
			}
		}
	}

	storedItems, err := m.storage.GetItems(sessionName)
	if err != nil {
		return err
	}

	err = m.updateUserList(sessionName, username, updatedUserItems, storedItems)
	if err != nil {
		return err
	}
	return m.updateClaims(sessionName, username, updatedClaimItems, storedItems)
}

func (m *Manager) updateUserList(sessionName, username string, updatedUserItems, storedItems model.Items) error {
	storedUserItems := model.Items{}
	for _, storedItem := range storedItems {
		if storedItem.Owner == username {
			storedUserItems = append(storedUserItems, storedItem)
		}
	}

	finalUserItems := model.Items{}

	// Update the order and the claimers on the updatedUserItems
	// Keep track of which items have been added to the finalUserItems
	finalItemsMap := make(map[string]model.Item, 0)
	for _, storedUserItem := range storedUserItems {
		for _, updatedUserItem := range updatedUserItems {
			if storedUserItem.Name == updatedUserItem.Name {
				updatedUserItem.Claimer = storedUserItem.Claimer
				finalUserItems = append(finalUserItems, updatedUserItem)
				finalItemsMap[updatedUserItem.Name] = updatedUserItem
			}
		}
	}
	if len(finalUserItems) < len(updatedUserItems) {
		// If there are more updated items than the ones matched
		// from storage, then item(s) have been added to this user.
		for _, updatedUserItem := range updatedUserItems {
			if _, ok := finalItemsMap[updatedUserItem.Name]; !ok {
				finalUserItems = append(finalUserItems, updatedUserItem)
			}
		}
	}
	sort.Sort(util.SortableItems(finalUserItems))

	err := m.storage.ClearUserItems(sessionName, username)
	if err != nil {
		return err
	}
	return m.storage.StoreNewItems(sessionName, username, finalUserItems)
}

func (m *Manager) updateClaims(sessionName, username string, updatedItems, storedItems model.Items) error {
	finalItems := model.Items{}

	// Copy all the storedItems to finalItems, updating the item's
	// claimer if needed.
	for _, storedItem := range storedItems {
		for _, updatedItem := range updatedItems {
			if storedItem.Owner == updatedItem.Owner && storedItem.Name == updatedItem.Name {
				storedItem.Claimer = updatedItem.Claimer
				break
			}
		}
		finalItems = append(finalItems, storedItem)
	}

	// Break the finalItems up into a mapping of owner to item list
	mapping := make(map[string]model.Items)
	sort.Sort(util.SortableItems(finalItems))
	for _, finalItem := range finalItems {
		if _, ok := mapping[finalItem.Owner]; !ok {
			mapping[finalItem.Owner] = model.Items{}
		}
		mapping[finalItem.Owner] = append(mapping[finalItem.Owner], finalItem)
	}

	for owner, newItems := range mapping {
		if owner == username {
			// A user can't update the claims on his/her own list
			continue
		}

		err := m.storage.ClearUserItems(sessionName, owner)
		if err != nil {
			return err
		}
		err = m.storage.StoreNewItems(sessionName, owner, newItems)
		if err != nil {
			return err
		}
	}
	return nil
}
