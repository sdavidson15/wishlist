package mysql

var (
	mySQLCreateUsersTable = `CREATE TABLE IF NOT EXISTS Users (
		Name VARCHAR(150),
		Session VARCHAR(150),
		Password VARCHAR(80));`
	mySQLCreateItemsTable = `CREATE TABLE IF NOT EXISTS Items (
		Name VARCHAR(150),
		Session VARCHAR(150),
		Owner VARCHAR(150),
		Claimer VARCHAR(150),
		_Order INT NOT NULL);`

	mySQLGetUser           = `SELECT Name FROM Users WHERE Session = ? AND Name = ? AND Password = ?;`
	mySQLGetUserNoPassword = `SELECT Name FROM Users WHERE Session = ? AND Name = ?;`
	mySQLGetSessionUsers   = `SELECT Name FROM Users WHERE Session = ?;`
	mySQLGetSessionItems   = `SELECT * FROM Items WHERE Session = ?;`

	mySQLAddItem         = `INSERT INTO Items (Name, Session, Owner, Claimer, _Order) VALUES (?, ?, ?, ?, ?);`
	mySQLDeleteUserItems = `DELETE FROM Items WHERE Session = ? AND Owner = ?;`
)
