package common

import (
	"sort"

	"wishlist/model"
	"wishlist/storage"
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
	items, err := m.storage.GetItems(sessionName)
	if err != nil {
		return nil, err
	}
	sort.Sort(SortableItems(items))

	return items, nil
}

// This is not thread-safe. This should block at some point, probably on arrival to this func.
func (m *Manager) UpdateLists(sessionName, username string, userItems, otherItems model.Items) error {
	storedItems, err := m.storage.GetItems(sessionName)
	if err != nil {
		return err
	}

	users, err := m.storage.GetUsers(sessionName)
	if err != nil {
		return err
	}
	sort.Sort(SortableUsers(users))

	// Convert the incoming items into a map of owners to their list of items
	updatedMapping := m.getListMapping(username, userItems, otherItems)
	// Convert the stored items into a map of owners to their list of items
	storedMapping := m.getListMapping("", nil, storedItems)

	// List of items to replace the requesting user's current items in the database
	resultUserList := model.Items{}

	// For the requesting user, compare the stored items to the updated items.
	// If a stored item's name matches an updated item's name, collect the stored
	// item, but use the updated item's order. The item may have been moved up
	// or down the list.
	// FIXME: This will fail if duplicate item names are allowed
	matchedItemNames := []string{}
	for _, storedItem := range storedMapping[username] {
		for _, updatedItem := range updatedMapping[username] {
			if storedItem.Name == updatedItem.Name {
				resultUserList = append(resultUserList, model.Item{
					Name:    storedItem.Name,
					Session: storedItem.Session,
					Owner:   storedItem.Owner,
					Claimer: storedItem.Claimer,
					Order:   updatedItem.Order,
				})
				matchedItemNames = append(matchedItemNames, storedItem.Name)
				break
			}
		}
	}

	if len(matchedItemNames) != len(updatedMapping[username]) {
		// If the number of matchedItemNames is less than the number
		// of updated items for the requesting user, then new items
		// were added to this user's list.
		for _, item := range updatedMapping[username] {
			found := false
			for _, matchedItemName := range matchedItemNames {
				if item.Name == matchedItemName {
					found = true
					break
				}
			}
			if !found {
				item.Claimer = ""
				resultUserList = append(resultUserList, item)
			}
		}
	}
	sort.Sort(SortableItems(resultUserList))
	err = m.storage.StoreNewItems(sessionName, username, resultUserList)
	if err != nil {
		return err
	}

	// For all the other users that are not the requesting user, only the claimer needs to be updated
	for _, user := range users {
		if user.Name == username {
			// This user's update has already been processed
			continue
		}

		updatedClaimItems := model.Items{}
		for _, storedItem := range storedMapping[user.Name] {
			for _, updatedItem := range updatedMapping[user.Name] {
				if storedItem.Name == updatedItem.Name && storedItem.Claimer == "" || storedItem.Claimer == username {
					// If the stored item is one of the updated items, and the stored item's
					// claimer is empty or equal to the username, then update the claimer on
					// this item.
					updatedClaimItems = append(updatedClaimItems, model.Item{
						Name:    storedItem.Name,
						Session: storedItem.Session,
						Owner:   storedItem.Owner,
						Claimer: updatedItem.Claimer,
						Order:   storedItem.Order,
					})
				}
			}
		}
		if len(updatedClaimItems) > 0 {
			err = m.storage.UpdateItemClaimers(sessionName, user.Name, updatedClaimItems)
			if err != nil {
				// TODO: Check for special cases that are evidence of bad state
				return err
			}
		}
	}
	return nil
}

func (m *Manager) getListMapping(username string, userItems, otherItems model.Items) map[string]model.Items {
	mapping := make(map[string]model.Items, 0)

	if userItems != nil {
		sort.Sort(SortableItems(userItems))
		mapping[username] = userItems
	}

	splitItems := m.splitItemsByOwner(otherItems)
	for _, currentItems := range splitItems {
		if len(currentItems) == 0 {
			continue
		}

		mapping[currentItems[0].Owner] = currentItems
	}

	return mapping
}

func (m *Manager) splitItemsByOwner(items model.Items) []model.Items {
	if len(items) < 2 {
		return []model.Items{items}
	}
	sort.Sort(SortableItems(items))

	result := []model.Items{
		model.Items{},
	}
	resultIndex := 0
	prevOwner := items[0].Owner
	for _, item := range items {
		if item.Owner != prevOwner {
			result = append(result, model.Items{})
			resultIndex++
		}
		result[resultIndex] = append(result[resultIndex], item)
	}
	return result
}
