package storage

import (
	"database/sql"
	"log"

	"wishlist/model"

	_ "github.com/go-sql-driver/mysql"
)

type Config struct {
	driver     string
	dataSource string
}

type Storage struct {
	db *sql.DB
}

func NewConfig(driver, dataSource string) Config {
	return Config{driver, dataSource}
}

func (s *Storage) StartConnection(cfg Config) error {
	db, err := sql.Open(cfg.driver, cfg.dataSource)
	if err != nil {
		return err
	}
	if err = db.Ping(); err != nil {
		return err
	}
	s.db = db
	log.Print("Connected to mysql database.")
	return s.initTables()
}

func (s *Storage) initTables() error {
	if err := s.initUsersTable(); err != nil {
		return err
	}
	return s.initItemsTable()
}

func (s *Storage) initUsersTable() error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	stmt, err := tx.Prepare(mySQLCreateUsersTable)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec()
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Storage) initItemsTable() error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	stmt, err := tx.Prepare(mySQLCreateItemsTable)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec()
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Storage) ConfirmUser(sessionName, username, password string, usingCookie bool) (model.User, error) {
	var rows *sql.Rows
	if usingCookie {
		rows, err := s.db.Query(mySQLGetUserNoPassword, sessionName, username)
		if err != nil {
			return model.User{}, err
		}
		defer rows.Close()
	} else {
		rows, err := s.db.Query(mySQLGetUser, sessionName, username, password)
		if err != nil {
			return model.User{}, err
		}
		defer rows.Close()
	}

	var name string
	if rows.Next() {
		if err := rows.Scan(&name); err != nil {
			return model.User{}, err
		}
	}
	if err := rows.Err(); err != nil {
		return model.User{}, err
	}

	return model.User{name, sessionName, ""}, nil
}

func (s *Storage) GetUsers(sessionName string) ([]model.User, error) {
	rows, err := s.db.Query(mySQLGetSessionUsers, sessionName)
	if err != nil {
		return []model.User{}, err
	}
	defer rows.Close()

	names := []string{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}

		names = append(names, name)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	users := []model.User{}
	for _, name := range names {
		users = append(users, model.User{name, sessionName, ""})
	}
	return users, nil
}

func (s *Storage) GetItems(sessionName string) ([]model.Item, error) {
	rows, err := s.db.Query(mySQLGetSessionItems, sessionName)
	if err != nil {
		return []model.Item{}, err
	}
	defer rows.Close()

	items := []model.Item{}
	for rows.Next() {
		var name, session, owner, claimer string
		var order int
		if err := rows.Scan(&name, &session, &owner, &claimer, &order); err != nil {
			return nil, err
		}

		items = append(items, model.Item{
			Name:    name,
			Session: session,
			Owner:   owner,
			Claimer: claimer,
			Order:   order,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Storage) StoreNewItems(sessionName, owner string, newItems model.Items) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	stmt, err := tx.Prepare(mySQLAddItem)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, i := range newItems {
		_, err := stmt.Exec(i.Name, i.Session, i.Owner, i.Claimer, i.Order)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *Storage) ClearUserItems(sessionName, owner string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	stmt, err := tx.Prepare(mySQLDeleteUserItems)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(sessionName, owner)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *Storage) UpdateItemClaimers(sessionName, owner string, newItems model.Items) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	stmt, err := tx.Prepare(mySQLUpdateItemClaimer)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, i := range newItems {
		_, err := stmt.Exec(i.Claimer, sessionName, owner, i.Name)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
