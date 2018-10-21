package model

type Item struct {
	Name    string
	Session string
	Owner   string
	Claimer string
	Price   string
	Order   int
	Descr   string
}

type Items []Item

type User struct {
	Name     string
	Session  string
	Password string
}
