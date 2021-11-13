package ddb

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"os"
	"sort"

	"wishlist/common/util"
	"wishlist/model"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

const SESSION_USERS_ATTRIBUTE_NAME string = `sessionUsers`
const SESSION_ITEMS_ATTRIBUTE_NAME string = `sessionItems`

type Ddb struct {
	dynamoDb  *dynamodb.DynamoDB
	tableName string
}

func NewDdb() (*Ddb, error) {
	session, err := session.NewSession()
	if err != nil {
		return nil, err
	}
	region := os.Getenv(`AWS_DEFAULT_REGION`)
	if len(region) < 1 {
		region = `us-east-1`
	}
	tableName := os.Getenv(`DDB_TABLE_NAME`)
	if len(tableName) < 1 {
		tableName = `pwl-ddb-table`
	}
	return &Ddb{
		dynamoDb:  dynamodb.New(session, aws.NewConfig().WithRegion(region)),
		tableName: tableName,
	}, nil
}

func (d *Ddb) ConfirmUser(sessionName, username, password string, usingCookie bool) (model.User, error) {
	users, err := d.getUsers(sessionName)
	if err != nil {
		return model.User{}, err
	}
	for _, user := range users {
		if user.Name == username && user.Session == sessionName && (usingCookie || user.Password == password) {
			user.Password = ""
			return user, nil
		}
	}
	return model.User{}, fmt.Errorf("User not found")
}

func (d *Ddb) GetUsers(sessionName string) ([]model.User, error) {
	users, err := d.getUsers(sessionName)
	if err != nil {
		return []model.User{}, err
	}
	return users, nil
}

func (d *Ddb) GetItems(sessionName string) (model.Items, error) {
	items, err := d.getItems(sessionName)
	if err != nil {
		return []model.Item{}, err
	}
	return items, nil
}

func (d *Ddb) StoreNewItems(sessionName, owner string, newItems model.Items) error {
	items, err := d.getItems(sessionName)
	if err != nil {
		return err
	}
	items = append(items, newItems...)
	sort.Sort(util.SortableItems(items))
	return d.writeItems(sessionName, items)
}

func (d *Ddb) ClearUserItems(sessionName, owner string) error {
	items, err := d.getItems(sessionName)
	if err != nil {
		return err
	}

	finalItems := model.Items{}
	for _, item := range items {
		if item.Owner != owner {
			finalItems = append(finalItems, item)
		}
	}
	sort.Sort(util.SortableItems(finalItems))
	return d.writeItems(sessionName, finalItems)
}

func (d *Ddb) getUsers(sessionName string) ([]model.User, error) {
	sessionHash := d.getSessionHash((sessionName))
	projectionExpression := SESSION_USERS_ATTRIBUTE_NAME
	output, err := d.dynamoDb.GetItem(&dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			`key`: {
				S: &sessionHash,
			},
		},
		ProjectionExpression: &projectionExpression,
		TableName:            &d.tableName,
	})
	if err != nil {
		return []model.User{}, err
	}

	if output.Item[SESSION_USERS_ATTRIBUTE_NAME].S == nil {
		return []model.User{}, fmt.Errorf(fmt.Sprintf(`Incorrect type for "%s" attribute in DDB storage`, SESSION_USERS_ATTRIBUTE_NAME))
	}

	var users []model.User
	usersJson := *output.Item[SESSION_USERS_ATTRIBUTE_NAME].S
	if err := json.Unmarshal([]byte(usersJson), &users); err != nil {
		return []model.User{}, err
	}
	return users, nil
}

func (d *Ddb) getItems(sessionName string) (model.Items, error) {
	sessionHash := d.getSessionHash((sessionName))
	projectionExpression := SESSION_ITEMS_ATTRIBUTE_NAME
	output, err := d.dynamoDb.GetItem(&dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			`key`: {
				S: &sessionHash,
			},
		},
		ProjectionExpression: &projectionExpression,
		TableName:            &d.tableName,
	})
	if err != nil {
		return []model.Item{}, err
	}

	if output.Item[SESSION_ITEMS_ATTRIBUTE_NAME].S == nil {
		return []model.Item{}, fmt.Errorf(fmt.Sprintf(`Incorrect type for "%s" attribute in DDB storage`, SESSION_ITEMS_ATTRIBUTE_NAME))
	}

	var items []model.Item
	itemsJson := *output.Item[SESSION_ITEMS_ATTRIBUTE_NAME].S
	if err := json.Unmarshal([]byte(itemsJson), &items); err != nil {
		return []model.Item{}, err
	}
	return items, nil
}

func (d *Ddb) writeItems(sessionName string, newItems model.Items) error {
	bytes, err := json.Marshal(newItems)
	if err != nil {
		return err
	}
	newItemsJson := string(bytes)

	sessionHash := d.getSessionHash((sessionName))
	updateExpression := fmt.Sprintf("SET %s = :items", SESSION_ITEMS_ATTRIBUTE_NAME)
	_, err = d.dynamoDb.UpdateItem(&dynamodb.UpdateItemInput{
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			`:items`: {
				S: &newItemsJson,
			},
		},
		Key: map[string]*dynamodb.AttributeValue{
			`key`: {
				S: &sessionHash,
			},
		},
		TableName:        &d.tableName,
		UpdateExpression: &updateExpression,
	})
	return err
}

func (d *Ddb) getSessionHash(sessionName string) string {
	return fmt.Sprintf("%x", md5.Sum([]byte(sessionName)))
}
