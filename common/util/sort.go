package util

import (
	"wishlist/model"
)

type SortableItems []model.Item

func (s SortableItems) Len() int {
	return len(s)
}

func (s SortableItems) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s SortableItems) Less(i, j int) bool {
	if s[i].Owner != s[j].Owner {
		return s[i].Owner < s[j].Owner
	}
	return s[i].Order < s[j].Order
}

type SortableUsers []model.User

func (s SortableUsers) Len() int {
	return len(s)
}

func (s SortableUsers) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s SortableUsers) Less(i, j int) bool {
	return s[i].Name < s[j].Name
}
