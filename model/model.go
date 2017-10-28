package model

type Item struct {
	Name    string
	Session string
	Owner   string
	Claimer string
	Order   int
}

type Items []Item

type User struct {
	Name     string
	Session  string
	Password string
}
