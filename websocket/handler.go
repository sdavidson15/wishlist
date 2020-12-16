package websocket

import (
	"encoding/json"
	"fmt"
	"strings"

	"wishlist/common"
	"wishlist/model"
)

type Update struct {
	Session    string
	User       string
	UserItems  model.Items
	ClaimItems model.Items
}

func handleMessage(manager *common.Manager, msg string) (string, error) {
	if !strings.HasPrefix(msg, "update:") {
		return ``, fmt.Errorf("Unrecognized message format")
	}

	var u Update
	jsonStr := strings.TrimPrefix(msg, "update:")

	if err := json.Unmarshal([]byte(jsonStr), &u); err != nil {
		return ``, fmt.Errorf("Malformed message")
	}

	if err := manager.UpdateLists(
		u.Session,
		u.User,
		u.UserItems,
		u.ClaimItems,
	); err != nil {
		return fmt.Sprintf("save-fail:%s", u.User), nil
	}

	return fmt.Sprintf("save-success:%s", u.User), nil
}
