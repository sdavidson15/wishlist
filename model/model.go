package model

type Item struct {
	Name    string `json:"Name"`
	Session string `json:"Session"`
	Owner   string `json:"Owner"`
	Claimer string `json:"Claimer"`
	Price   string `json:"Price"`
	Order   int    `json:"Order"`
	Descr   string `json:"Descr"`
}

type Items []Item

type User struct {
	Name     string
	Session  string
	Password string
}
