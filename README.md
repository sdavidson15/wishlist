Project Wish List
====================

Welcome to Project Wish List!
Project Wish List is a simple, collaborative way for groups to organize all their wish lists in one place.
Group members can view each other's wish lists, claim items, and edit their own wish list. All while maintaining the secrecy
of who has bought what.

## How to Run

Requirements:
1. Make sure you have [Go](https://golang.org/doc/install) installed.
2. [MySQL](https://dev.mysql.com/downloads/) is recommended, but not necessary.

Running:
1. Fork this repository and clone your fork.
2. Navigate to the root directory `wishlist` and run `go get`.
3. Build the application using `go build`.
4. Run the resulting binary with flag `-inmem` to begin serving on `localhost:8080`.

Storage:
- This project makes use of a MySQL database, whose configuration can be found in `config.txt` of the root directory.
- To opt out of using a MySQL database, run the program with the `-inmem` flag (as noted above). This will store data in `wishlist/storage/imdb/db` in JSON form. In this case, the `Imdb` struct can be treated as a database connector with very, very limited features.
- Navigate to `wishlist/storage/imdb/db` to see the demo session's JSON files `ogwishlist_items.json` and `ogwishlist_users.json`, and get a feel for how this storage strategy works.

## Play Around!

Visit your locally running server and sign into the demo session **OG Wish List**.

Use any of the following case sensitive usernames to sign in:
- Dre
- Snoop
- Tupac
- Warren G
- Nate Dogg

For the demo session, the password is irrelevant. Feel free to add, edit, and remove items from your own list, or claim and unclaim items in other lists.

## Author

 * Stephen Davidson <davidson.sc19@gmail.com>