// TODO: Pull all the styling into a css file, and just apply classes where needed.

async function main() {
    var sessionCookie = cookieHandler.getSession(),
        userCookie = cookieHandler.getUser();

    if (common.isBlankString(sessionCookie) || common.isBlankString(userCookie)) {
        cookieHandler.clearCookies(); // Sanity check
        // TODO: Render homepage
    } else {
        wishlistApp.init();
        while (true) {
            await common.sleep(120000); // Poll every 2 mins
            wishlistApp.redrawWishList();
        }
    }
}

var wishlistApp = (function () {
    var session = cookieHandler.getSession(),
        user = cookieHandler.getUser(),
        items = [],
        owners = [],

        refreshOwners = function () {
            owners = [];
            for (var i = 0; i < items.length; i++) {
                if (!owners.includes(item.owner)) owners.push(item.owner);
            }
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

        init = async function () {
            redrawWishList();
        }

    return {
        init: init,
        redrawWishList: redrawWishList
    }
}());

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
        setUser, setUser
    }
}());

function renderHomepage() {
    var cookieSession = cookieHandler.getSession();
    var cookieUser = cookieHandler.getUser();
    if (cookieSignIn(cookieSession, cookieUser)) {
        window.location.href = "wishlist.html";
    }
    // FIXME: Make your own "createBanner" for rendering homepage banner
    createBanner("Project Wish List",
        "font-family: \"Tangerine\", serif;" +
        "font-size: 7em;" +
        "color: snow;"
    );

    setupHomepageListeners();
}

function setupHomepageListeners() {
    document.getElementById("sign_in_link").addEventListener("click", function (event) {
        event.preventDefault();
        _onSignIn();
    });
}

// TODO: Left off here
function setupWishlistListeners(session, user) {
    document.getElementById("add_item").addEventListener("click", function (event) {
        event.preventDefault();
        _onAddItem(user);
    });
    document.getElementById("signout_link").addEventListener("click", function () {
        _onSignOut(true);
    });
    document.getElementById("save_button").addEventListener("click", function (e) {
        _onSave(session, user, e.target);
    });
    var userList = document.getElementById("list_" + user);
    for (i = 1; i < userList.children.length; i++) {
        userList.children[i].addEventListener("contextmenu", function (e) {
            e.preventDefault();
            _onRemoveItem(user, e.target);
        });
        userList.children[i].addEventListener("dblclick", function (e) {
            _onShowDescr(session, user, e.target);
        });
    }

    var otherLists = document.getElementById("other_lists");
    for (i = 0; i < otherLists.children.length; i++) {
        list = otherLists.children[i];
        for (j = 1; j < list.children.length; j++) {
            list.children[j].addEventListener("dblclick", function (e) {
                _onShowDescr(session, user, e.target);
            });
        }
    }
}

function _onSignIn() {
    state.session = document.getElementsByTagName("input")[0].value;
    state.user = document.getElementsByTagName("input")[1].value;
    state.password = (!isDemo()) ? document.getElementsByTagName("input")[2].value : "";

    if (signIn()) {
        setCookie("wl_session", _session, 5);
        setCookie("wl_user", _user, 5);
        window.location.href = "wishlist.html";
        // FIXME: single page
    } else {
        alert("The session, username, or password you entered are incorrect. Please try again.")
    }
}

function _onSignOut() {
    user = null;
    session = null;
    clearCookies();
}

function _onAddItem(user) {
    var table = document.getElementById("list_" + user);
    if (table.children.length >= 17) {
        alert("No more than 15 items are allowed per list.");
        return;
    }

    var newItem = createListItem(user, { name: "", owner: user, claimer: "", price: "" }, false);
    newItem.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        _onRemoveItem(user, e.target);
    });
    table.insertBefore(newItem, table.children[table.children.length - 1]);
}

function _onRemoveItem(user, itemDiv) {
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
        return;
    }
}

function _onShowDescr(session, user, target) {
    var div = document.getElementById("item_descr");
    if (div.children.length > 0) {
        // An item description window is already showing
        return;
    }

    var itemRow = null;
    if (target.children.length > 1) {
        itemRow = target.parentElement;
    } else {
        itemRow = target.parentElement.parentElement;
    }

    var owner = itemRow.parentElement.firstChild.firstChild.innerHTML;
    var name = itemRow.firstChild.children[1].innerHTML;
    var price = itemRow.firstChild.firstChild.innerHTML;
    var descr = itemRow.firstChild.lastChild.innerHTML;
    descr = descr.replace(/\r?\n/g, "<br>");

    var nameSpan = document.createElement("span");
    nameSpan.appendChild(document.createTextNode(name));
    nameSpan.setAttribute("style", "font-weight: bold;");

    var priceSpan = document.createElement("span");
    priceSpan.appendChild(document.createTextNode(" (" + price + ")"));
    priceSpan.setAttribute("style", "font-weight: bold;");

    var descrDiv = document.createElement("div");
    descrDiv.innerHTML = descr;
    descrDiv.setAttribute("style", "height: 82%; text-align: left;");
    if (user == owner) { descrDiv.setAttribute("contenteditable", ""); }

    var closeBtn = document.createElement("button");
    styleButton(closeBtn, "Close", "LightGray");
    closeBtn.addEventListener("click", function () {
        _onHideDescr(session, user, itemRow.firstChild.lastChild, false);
    });

    div.appendChild(nameSpan);
    div.appendChild(priceSpan);
    div.appendChild(document.createElement("hr"));
    div.appendChild(descrDiv);
    div.appendChild(document.createElement("hr"));
    div.appendChild(closeBtn);

    if (user == owner) {
        var saveBtn = document.createElement("button");
        styleButton(saveBtn, "Save", "#69a0f3");
        saveBtn.addEventListener("click", function () {
            _onHideDescr(session, user, itemRow.firstChild.lastChild, true);
        });
        div.appendChild(document.createTextNode(" "));
        div.appendChild(saveBtn);
    }

    div.setAttribute("style",
        "width: 40%;" +
        "border: none;" +
        "border-radius: .3rem;" +
        "background-color: white;" +
        "box-shadow: 10px 10px 5px #888888;" +
        "font-size: 1rem;" +
        "text-align: center;" +
        "padding: 1em;" +
        "margin: 1em;" +
        "position: absolute;" +
        "left: 30%;" +
        "top: 30%;" +
        "z-index: 10;"
    );
}

function _onHideDescr(session, user, descrDiv, needsSave) {
    var div = document.getElementById("item_descr");
    if (needsSave) {
        var descr = div.getElementsByTagName("div")[0].innerHTML;
        descr = descr.replace(new RegExp("<div>", "g"), "")
            .replace(new RegExp("</div>", "g"), "\n")
            .replace(new RegExp("<br>", "g"), "\n");
        descrDiv.innerHTML = descr;
        _onSave(session, user, document.getElementById("save_button"));
    }
    div.innerHTML = "";
    div.setAttribute("style",
        "display: none;"
    );
}

async function _onSave(_session, user, saveButton) {
    saveButton.innerHTML = "Saving...";
    saveButton.setAttribute("disabled", "disabled");

    var userItems = [];
    var claimableItems = [];

    // Gather the update from this user
    var userList = document.getElementById("lists").children[0];
    for (j = 1; j < userList.children.length - 1; j++) {
        var itemName = userList.children[j].firstChild.children[1].innerHTML;
        itemName = itemName.replace(new RegExp("<div>", "g"), "")
            .replace(new RegExp("</div>", "g"), "\n")
            .replace(new RegExp("<br>", "g"), "\n");
        var itemPrice = userList.children[j].firstChild.firstChild.innerHTML;
        var itemDescr = userList.children[j].firstChild.lastChild.innerHTML;
        userItems.push({
            name: itemName,
            session: _session,
            owner: user,
            claimer: "",
            price: itemPrice,
            order: j - 1,
            descr: itemDescr
        });
    }

    // Gather the update from the other users
    var otherLists = document.getElementById("other_lists");
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
                    session: _session,
                    owner: listOwner,
                    claimer: itemClaimer,
                    price: itemPrice,
                    order: j - 1,
                    descr: itemDescr
                });
            }
        }
    }

    if (sendUpdateToServer(_session, user, userItems, claimableItems)) {
        styleButton(saveButton, "Saved", "green")
    } else {
        styleButton(saveButton, "Failed", "red")
        await sleep(1000);
        if (confirm("Changes could not be saved. New changes may have been made to this Wish List. Please refresh your page."
            + " If the problem persists, please contact the site maintainers using the Help link below.")) {
            location.reload();
        }
    }

    await sleep(1000);
    saveButton.removeAttribute("disabled");
    styleButton(saveButton, "Save", "#69a0f3")
}

function styleButton(saveButton, content, color) {
    saveButton.innerHTML = content;
    saveButton.setAttribute("style",
        "font-family: -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\";" +
        "font-size: 1.25rem;" +
        "font-weight: 400;" +
        "line-height: 1.5;" +
        "background-color: " + color + ";" +
        "border: none;" +
        "border-radius: .3rem;" +
        "color: white;" +
        "padding: 0.25em 1em 0.25em 1em"
    );
}

var restApp = (function () {
    var serverError = function () {
        alert("Something went wrong.");
        location.reload();
    },

        signIn = function () {
            if (common.isBlankString(state.session) || common.isBlankString(state.user)) return false;

            // FIXME: jquery
            var req = new XMLHttpRequest()
            req.open("PUT", "/signin", false)
            req.send(JSON.stringify({
                sessionName: state.session,
                username: state.user,
                password: state.password
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

        // FIXME: deprecate. No need for this, just need to do server side auth checking on all requests.
        cookieSignIn = function (session, user) {
            console.log('Using deprecated cookieSignIn function');

            if (session == "" || session == "null" ||
                user == "" || user == "null") {
                return false;
            }

            var req = new XMLHttpRequest()
            req.open("PUT", "/csignin", false)
            req.send(JSON.stringify({
                sessionName: session,
                username: user
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

        getItems = function () {
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

        sendUpdateToServer = function (_userItems, _otherItems) {
            var session = state.session.replace(" ", "%20");

            // FIXME: jquery. Also, status unauthorized.
            var req = new XMLHttpRequest()
            req.open("PUT", "/lists/" + session, false)
            req.send(JSON.stringify({
                userName: state.user,
                userItems: _userItems,
                otherItems: _otherItems
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
        cookieSignIn: cookieSignIn,
        getItems: getItems,
        updateItems: updateItems
    }
}())

var common = (function () {
    var isBlankString = function (str) {
        return str == "" || str == "null"
    },

        sleep = function (ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

    return {
        isBlankString: isBlankString,
        sleep: sleep
    }
}())