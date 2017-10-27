package common

import (
	"sort"
	"wishlist/model"
)

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
