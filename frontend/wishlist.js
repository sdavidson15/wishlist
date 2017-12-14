var demo_session = 'OG Wish List'

function main() {
    var sessionCookie = cookieHandler.getSession(),
        userCookie = cookieHandler.getUser();

    if (isBlankString(sessionCookie) || isBlankString(userCookie))
        homepage.init();
    else
        wishlistApp.init();
}

function isBlankString(str) {
    return str == "" || str == "null"
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// homepage handles everything related to the homepage.
var homepage = (function () {
    var bannerText = 'Project Wish List',

        init = function () {
            cookieHandler.clearCookies();
            render();
        },

        close = function () {
            $('logged-out').hide();
        },

        render = function () {
            $('logged-out').show();
            $('home-banner').text(bannerText);
            setupHomepageListeners();
        },

        _onSignIn = function () {
            var session = document.getElementsByTagName("input")[0].value,
                user = document.getElementsByTagName("input")[1].value,
                password = (session == demo_session) ? document.getElementsByTagName("input")[2].value : "";

            if (restApp.signIn(session, user, password)) {
                cookieHandler.setSession(session);
                cookieHandler.setUser(user);
                close();
                wishlistApp.init();
            } else {
                alert("The session, username, or password you entered are incorrect. Please try again.")
            }
        },

        setupHomepageListeners = function () {
            document.getElementById("sign-in-link").addEventListener("click", function (event) {
                event.preventDefault();
                _onSignIn();
            });
        }

    return {
        init: init
    }
}());

// wishlistApp handles everything related to the Wishlist application (once logged in).
var wishlistApp = (function () {
    var session = cookieHandler.getSession(),
        user = cookieHandler.getUser(),
        items = [],
        owners = [],

        init = async function () {
            $('logged-in').show();
            redrawWishList();
            while (true) {
                await sleep(120000);
                wishlistApp.redrawWishList();
            }
        },

        close = function () {
            $('logged-out').hide();
            session = null;
            user = null;
            items = null;
            owners = null;
        },

        redrawWishList = async function () {
            items = await restApp.getItems(session, user);
            refreshOwners();

            var oldSaveDiv = $('save-div');
            $('lists').empty().append('<div id="other-lists"></div>').append(oldSaveDiv);
            $('banner-text').text(session);
            populateLists();
            setupWishlistListeners();
        },

        refreshOwners = function () {
            owners = [];
            for (var i = 0; i < items.length; i++) {
                if (!owners.includes(item.owner)) owners.push(item.owner);
            }
        },

        populateLists = function () {
            // Create the tables
            for (var i = 0; i < owners.length; i++) {
                if (owners[i] == user)
                    $('lists').prepend(createList(user));
                else
                    $('other-lists').append(createList(owners[i]));
            }

            // Create the items
            for (i = 0; i < items.length; i++) {
                $('list_' + items[i].owner).append(createItem(items[i]));
            }

            // TODO: remove this to lock down wishlist
            // Add the "Add item..." cell
            $('list_' + user).append(createAddItem());
        },

        createList = function (owner) {
            var table = document.createElement("table");
            table.setAttribute("id", "list_" + owner);
            table.setAttribute("class", "table table-bordered");

            var header = document.createElement("th");
            header.appendChild(document.createTextNode(owner));
            var row = document.createElement("tr");
            row.appendChild(header);
            table.appendChild(row);

            return table;
        },

        createItem = function (item) {
            // FIXME: No half measures. Go all jquery on this.

            // Table data container
            var itemData = document.createElement("td");

            // Price box
            var priceDiv = $('<div />').addClass('wl-price-box').text(item.price);
            if (user == item.owner) priceDiv.setAttribute("contenteditable", ""); // TODO: remove this to lock wishlist down
            itemData.appendChild(priceDiv);

            // Content div
            var contentDiv = $('<div />').addClass('wl-item-content').text(item.name);
            var contentDivWidth = 8;
            if (user == item.owner) {
                contentDiv.setAttribute("contenteditable", "") // TODO: remove this to lock wishlists down
                contentDivWidth = 10;
            } else if (item.claimer != "" && item.claimer != user) {
                contentDivWidth = 10.8;
            }
            contentDiv.width(contentDivWidth + 'em');
            itemData.appendChild(contentDiv);

            // Checkbox
            if (item.claimer == "" && user != item.owner || item.claimer == user) {
                var checkBox = $('<input />').addClass('wl-checkbox');
                checkBox.setAttribute("type", "checkbox");
                if (item.claimer == user) {
                    checkBox.setAttribute("checked", "");
                }
                itemData.appendChild(checkBox);
            }

            // Invisible description div
            var descrDiv = $('<div />').text(item.descr).hide();
            itemData.appendChild(descrDiv);

            // FIXME: jquery
            var itemRow = document.createElement("tr");
            itemRow.appendChild(itemData);
            return itemRow;
        },

        createAddItem = function () {
            // TODO: jquery
            var itemData = document.createElement("td");
            itemData.setAttribute("style", "background-color: LightGray;");

            var addItemLink = document.createElement("a");
            addItemLink.setAttribute("id", "add_item");
            addItemLink.setAttribute("href", "#");
            addItemLink.setAttribute("style", "color: black;");
            addItemLink.appendChild(document.createTextNode("Add item..."));
            itemData.appendChild(addItemLink);

            var itemRow = document.createElement("tr");
            itemRow.appendChild(itemData);
            return itemRow;
        },

        setupWishlistListeners = function (session, user) {
            document.getElementById("add_item").addEventListener("click", function (event) {
                event.preventDefault();
                _onAddItem();
            });
            document.getElementById("signout_link").addEventListener("click", function () {
                _onSignOut();
            });
            document.getElementById("save-button").addEventListener("click", function (e) {
                _onSave(e.target);
            });

            // Add listeners to this user's items
            var userList = document.getElementById("list_" + user);
            for (i = 1; i < userList.children.length; i++) {
                userList.children[i].addEventListener("contextmenu", function (e) {
                    e.preventDefault();
                    _onRemoveItem(e.target); // TODO: remove this to lock down wishlist
                });
                userList.children[i].addEventListener("dblclick", function (e) {
                    _onShowDescr(e.target);
                });
            }

            // Add listeners to the other user's items
            var otherLists = document.getElementById("other_lists");
            for (i = 0; i < otherLists.children.length; i++) {
                list = otherLists.children[i];
                for (j = 1; j < list.children.length; j++) {
                    list.children[j].addEventListener("dblclick", function (e) {
                        _onShowDescr(e.target);
                    });
                }
            }
        },

        _onSignOut = function () {
            close();
            homepage.init();
        },

        // TODO: remove this to lock down wishlist
        _onAddItem = function () {
            var table = document.getElementById("list_" + user);
            if (table.children.length >= 17) {
                alert("No more than 15 items are allowed per list.");
                return;
            }

            var newModelItem = { name: "", owner: user, claimer: "", price: "" };
            items.push(newModelItem);
            var newItem = createListItem(newModelItem);
            newItem.addEventListener("contextmenu", function (e) {
                e.preventDefault();
                _onRemoveItem(e.target);
            });
            newItem.addEventListener("dblclick", function (e) {
                _onShowDescr(e.target);
            });
            table.insertBefore(newItem, table.children[table.children.length - 1]);
        },

        // TODO: remove this to lock down wishlist
        _onRemoveItem = function (itemDiv) {
            var table = document.getElementById("list_" + user);
            var itemRow = itemDiv.parentElement.parentElement;
            var index = -1;
            for (var i = 0; i < table.rows.length; i++) {
                if (table.rows[i] == itemRow) {
                    index = i;
                    break;
                }
            }
            if (index == -1 || index == 1) {
                return;
            }

            if (confirm("Delete item " + itemDiv.innerHTML + "?")) {
                table.deleteRow(index);
                // TODO: remove item from items
                return;
            }
        },

        _onShowDescr = function (target) {
            var div = document.getElementById("item-descr");
            if (div.children.length > 0) {
                // An item description window is already showing
                return;
            }

            var itemRow = null;
            if (target.children.length > 1)
                itemRow = target.parentElement;
            else
                itemRow = target.parentElement.parentElement;

            // FIXME: get text, not inner html
            var owner = itemRow.parentElement.firstChild.firstChild.innerHTML,
                name = itemRow.firstChild.children[1].innerHTML,
                price = itemRow.firstChild.firstChild.innerHTML,
                descr = itemRow.firstChild.lastChild.innerHTML;
            descr = descr.replace(/\r?\n/g, "<br>");

            var nameSpan = $('<span />').text(name),
                priceSpan = $('<span />').text(' (' + price + ')'),
                descrDiv = $('<div />').text(descr).attr('id', 'description-div'),
            if (user == owner) descrDiv.setAttribute("contenteditable", ""); // TODO: remove this to lock down wishlist

            var closeBtn = $('<button value="Close" />').css('background-color', 'LightGray');
            closeBtn.addEventListener("click", function () {
                _onHideDescr(itemRow.firstChild.lastChild, false);
            });

            div.appendChild(nameSpan);
            div.appendChild(priceSpan);
            div.appendChild(document.createElement("hr"));
            div.appendChild(descrDiv);
            div.appendChild(document.createElement("hr"));
            div.appendChild(closeBtn);

            if (user == owner) {
                var saveBtn = $('<button value="Save" />');
                saveBtn.addEventListener("click", function () {
                    _onHideDescr(itemRow.firstChild.lastChild, true);
                });
                div.appendChild(document.createTextNode(" "));
                div.appendChild(saveBtn);
            }
        },

        _onHideDescr = function (descrDiv, needsSave) {
            var div = document.getElementById("item-descr");
            if (needsSave) {
                // FIXME: get text not inner html
                var descr = div.getElementsByTagName("div")[0].innerHTML;
                descr = descr.replace(new RegExp("<div>", "g"), "")
                    .replace(new RegExp("</div>", "g"), "\n")
                    .replace(new RegExp("<br>", "g"), "\n");
                descrDiv.innerHTML = descr;
                _onSave(session, user, document.getElementById("save-button"));
            }
            div.innerHTML = "";
            div.hide();
        },

        _onSave = async function (saveButton) {
            saveButton.innerHTML = "Saving...";
            saveButton.setAttribute("disabled", "disabled");

            var userItems = [];
            var claimableItems = [];

            // Gather the update from this user
            var userList = document.getElementById("lists").children[0];
            for (j = 1; j < userList.children.length - 1; j++) {
                // FIXME: get text, not inner html
                var itemName = userList.children[j].firstChild.children[1].innerHTML;
                itemName = itemName.replace(new RegExp("<div>", "g"), "")
                    .replace(new RegExp("</div>", "g"), "\n")
                    .replace(new RegExp("<br>", "g"), "\n");
                var itemPrice = userList.children[j].firstChild.firstChild.innerHTML;
                var itemDescr = userList.children[j].firstChild.lastChild.innerHTML;
                userItems.push({
                    name: itemName,
                    session: session,
                    owner: user,
                    claimer: "",
                    price: itemPrice,
                    order: j - 1,
                    descr: itemDescr
                });
            }

            // Gather the update from the other users
            var otherLists = document.getElementById("other-lists");
            for (i = 0; i < otherLists.children.length; i++) {
                var list = otherLists.children[i];
                var listOwner = list.firstChild.firstChild.innerHTML;
                for (j = 1; j < list.children.length; j++) {
                    var itemData = list.children[j].firstChild;
                    if (itemData.children.length == 4) {
                        var checkbox = itemData.children[2];
                        var itemClaimer = (checkbox.checked) ? user : "";
                        var itemPrice = itemData.firstChild.innerHTML;
                        var itemDescr = itemData.lastChild.innerHTML;
                        claimableItems.push({
                            name: itemData.children[1].innerHTML,
                            session: session,
                            owner: listOwner,
                            claimer: itemClaimer,
                            price: itemPrice,
                            order: j - 1,
                            descr: itemDescr
                        });
                    }
                }
            }

            if (restApp.updateItems(session, user, userItems, claimableItems)) {
                saveButton.innerHTML = "Saved";
                saveButton.css('background-color', 'green');
            } else {
                saveButton.innerHTML = "Failed";
                saveButton.css('background-color', 'red');
                await sleep(1000);
                if (confirm("Changes could not be saved. New changes may have been made to this Wish List. Please refresh your page."
                    + " If the problem persists, please contact the site maintainers using the Help link below.")) {
                    location.reload();
                }
            }

            await sleep(1000);
            saveButton.removeAttribute("disabled");
            saveButton.innerHTML = "Save";
            saveButton.css('background-color', '#69a0f3');
        }

    return {
        init: init
    }
}());

// cookieHandler handes everthing related to storing, clearing, and retrieving browser cookies.
var cookieHandler = (function () {
    var sessionKey = "wl_session",
        userKey = "wl_user",
        cookieDuration = 5,

        clearCookies = function () {
            setCookie("wl_user", null);
            setCookie("wl_session", null);
        },

        getSession = function () {
            var session = getCookie(sessionKey);
            return (session == null) ? "" : user;
        },

        getUser = function () {
            var user = getCookie(userKey);
            return (user == null) ? "" : user;
        },

        setSession = function (newSession) {
            setCookie(sessionKey, newSession, cookieDuration);
        },

        setUser = function (newUser) {
            setCookie(userKey, newUser, cookieDuration);
        },

        getCookie = function (cookieName) {
            var name = cookieName + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        },

        setCookie = function (name, val, duration) {
            var d = new Date();
            d.setTime(d.getTime() + (duration * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = name + "=" + val + ";" + expires + ";path=/";
        }

    return {
        clearCookies: clearCookies,
        getSession: getSession,
        getUser: getUser,
        setSession: setSession,
        setUser: setUser
    }
}());

// restApp handles all HTTP rest communication with the server.
var restApp = (function () {
    var serverError = function () {
        alert("Something went wrong.");
        location.reload();
    },

        signIn = function (session, user, password) {
            if (isBlankString(session) || isBlankString(user)) return false;

            // FIXME: jquery
            var req = new XMLHttpRequest()
            req.open("PUT", "/signin", false)
            req.send(JSON.stringify({
                sessionName: session,
                username: user,
                password: password
            }));

            switch (req.status) {
                case 200:
                    return true;
                case 401:
                    return false;
                default:
                    serverError();
            }
        },

        getItems = function (session, user) {
            var session = state.session.replace(" ", "%20");

            // FIXME: jquery. Also, status unauthorized.
            var req = new XMLHttpRequest()
            req.open("GET", "/lists/" + session, false)
            req.send();

            var respItems = JSON.parse(req.responseText),
                items = [];

            for (i = 0; i < respItems.length; i++) {
                items.push({
                    name: respItems[i].Name,
                    owner: respItems[i].Owner,
                    claimer: (_owner != state.user) ? respItems[i].Claimer : "",
                    price: (respItems[i].Price != null) ? respItems[i].Price : "",
                    descr: respItems[i].Descr
                });
            }

            return items;
        },

        updateItems = function (session, user, userItems, otherItems) {
            var session = state.session.replace(" ", "%20");

            // FIXME: jquery. Also, status unauthorized.
            var req = new XMLHttpRequest()
            req.open("PUT", "/lists/" + session, false)
            req.send(JSON.stringify({
                userName: state.user,
                userItems: userItems,
                otherItems: otherItems
            }));

            switch (req.status) {
                case 200:
                    return true;
                default:
                    return false;
            }
        }

    return {
        signIn: signIn,
        getItems: getItems,
        updateItems: updateItems
    }
}());