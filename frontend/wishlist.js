var demo_session = 'OG Wish List'

var state = {
    session: null,
    user: null,
    socketConnected: false,
    isLockedDown: false
}

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
    var init = function () {
            cookieHandler.clearCookies();
            wishlistApp.close();
            render();
        },

        close = function () {
            $("#logged-out").hide();
        },

        render = function () {
            setHomepageCSS();
            $("#logged-out").show();
            setupHomepageListeners();
        },

        setHomepageCSS = function () {
            var oldlink = document.getElementById("css-link");

            var newlink = document.createElement("link");
            newlink.id = "css-link";
            newlink.setAttribute("rel", "stylesheet");
            newlink.setAttribute("type", "text/css");
            newlink.setAttribute("href", "logged-out.css");
        
            document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
        },

        _onSignIn = function () {
            state.session = document.getElementsByTagName("input")[0].value;
            state.user = document.getElementsByTagName("input")[1].value;

            var password = (state.session != demo_session) ? document.getElementsByTagName("input")[2].value : "";

            if (restApp.signIn(password)) {
                cookieHandler.setSession(state.session);
                cookieHandler.setUser(state.user);
                close();
                wishlistApp.init();
            } else {
                state.session = null;
                state.user = null;
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
        init: init,
        close: close
    }
}());

// wishlistApp handles everything related to the Wishlist application (once logged in).
var wishlistApp = (function () {
    var items = [],
        owners = [],

        init = async function () {
            state.session = cookieHandler.getSession();
            state.user = cookieHandler.getUser();

            websocketApp.init();

            // Give the web socket 20 seconds to connect
            for (var retry = 20; retry > 0; retry--) {
                if (state.socketConnected) {
                    break;
                }

                await sleep(1000);
            }

            if (!state.socketConnected) {
                alert("Web socket failed to connect.");
                close();
                homepage.init();
            } else {
                homepage.close();
                setWishlistCSS();
                $("#logged-in").show();
                redrawWishList();
            }
        },

        close = function () {
            websocketApp.close();
            $("#logged-out").hide();
            state.session = null;
            state.user = null;
            items = null;
            owners = null;
        },

        setWishlistCSS = function () {
            var oldlink = document.getElementById("css-link");

            var newlink = document.createElement("link");
            newlink.id = "css-link";
            newlink.setAttribute("rel", "stylesheet");
            newlink.setAttribute("type", "text/css");
            newlink.setAttribute("href", "logged-in.css");
        
            document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
        },

        redrawWishList = async function () {
            document.getElementById("banner-text").appendChild(document.createTextNode(state.session));
            items = await restApp.getItems();
            refreshOwners();
            
            var includeCurrentUser = true;
            clearLists(includeCurrentUser);
            populateLists(includeCurrentUser);
            
            if (state.isLockedDown) {
                setSaveLock();
            }

            setupWishlistListeners(includeCurrentUser);
        },

        redrawOtherLists = async function () {
            // Update items in everyone's lists except this user's.
            var updatedItems = await restApp.getItems();
            var _items = [];
            for (var i = 0; i < items.length; i++) {
                if (items[i].owner == state.user) {
                    _items.push(items[i]);
                }
            }
            for (var i = 0; i < updatedItems.length; i++) {
                if (updatedItems[i].owner != state.user) {
                    _items.push(updatedItems[i]);
                }
            }
            items = _items;

            refreshOwners();

            var includeCurrentUser = false;
            clearLists(includeCurrentUser);
            populateLists(includeCurrentUser);
            setupWishlistListeners(includeCurrentUser);
        }

        clearLists = function (includeCurrentUser) {
            if (includeCurrentUser) {
                var oldSaveDiv = document.getElementById("save-div"),
                    lists = document.getElementById("lists"),
                    otherLists = document.createElement("div");
               
                otherLists.id = "other-lists";
                lists.innerHTML = "";
                lists.appendChild(otherLists);
                lists.appendChild(oldSaveDiv);
            } else {
                document.getElementById("other-lists").innerHTML = "";
            }
        },

        refreshOwners = function () {
            owners = [];
            for (var i = 0; i < items.length; i++) {
                if (!owners.includes(items[i].owner)) owners.push(items[i].owner);
            }
        },

        populateLists = function (includeCurrentUser) {
            // Create the tables
            for (var i = 0; i < owners.length; i++) {
                if (includeCurrentUser && owners[i] == state.user) {
                    var lists = document.getElementById("lists"),
                        userList = createList(state.user);

                    lists.insertBefore(userList, lists.firstChild);
                } else { // TODO: I may need something like else if (owners[i] != state.user)
                    var otherLists = document.getElementById("other-lists"),
                        newList = createList(owners[i]);
                    
                    otherLists.appendChild(newList);;
            }
            }

            // Create the items
            for (i = 0; i < items.length; i++) {
                if (!includeCurrentUser && items[i].owner == state.user) {
                    continue;
                }

                var currentList = document.getElementById("list_" + items[i].owner),
                    newItem = createItem(items[i], currentList.childElementCount == 1);

                currentList.appendChild(newItem);
            }

            // Add the "Add item..." cell
            if (includeCurrentUser && !state.isLockedDown) { 
                var userList = document.getElementById("list_" + state.user),
                    addItem = createAddItem();

                userList.appendChild(addItem);
            }
        },

        createList = function (owner) {
            var table = document.createElement("table");
            table.id = "list_" + owner;
            table.className = "table table-bordered";

            // TODO: move this into "Template" or css
            if (state.user != owner) {
                table.setAttribute("style",
                    "width: 22%;" +
                    "vertical-align: top;" +
                    "margin: 0;" +
                    "padding: 0;" +
                    "display: inline;"
                );
            } else {
                table.setAttribute("style",
                    "width: 17%;" +
                    "vertical-align: top;" +
                    "margin: 0;" +
                    "padding: 0;" +
                    "float: left;"
                );
            }

            var header = document.createElement("th");
            header.appendChild(document.createTextNode(owner));
            var row = document.createElement("tr");
            row.appendChild(header);
            table.appendChild(row);

            return table;
        },

        createItem = function (item, isFirst) {
            // Table data container
            var itemData = document.createElement("td");
            itemData.className = "wl-td";

            // TODO: move this to "Template"
            itemData.style.backgroundColor = (isFirst) ? "#69a0f3" : "snow";

            // Price box
            var priceDiv = document.createElement("div");
            priceDiv.className = "wl-price-box";
            priceDiv.innerHTML = item.price;
            if (state.user == item.owner && !state.isLockedDown) {
                priceDiv.setAttribute("contenteditable", "");
            }
            itemData.appendChild(priceDiv);

            // Content div
            var contentDiv = document.createElement("div");
            itemData.appendChild(contentDiv);
            if (state.user == item.owner) {
                if (!state.isLockedDown) {
                    contentDiv.setAttribute("contenteditable", "")
                }

                contentDiv.className = "wl-item-content-user";
            } else if (item.claimer != "" && item.claimer != state.user) {
                contentDiv.className = "wl-item-content-claimed";
            } else {
                contentDiv.className = "wl-item-content";
            }
            contentDiv.appendChild(document.createTextNode(item.name));

            // Checkbox
            if (item.claimer == "" && state.user != item.owner || item.claimer == state.user) {
                var checkBox = document.createElement("input");	
                checkBox.className = "wl-checkbox";
                checkBox.setAttribute("type", "checkbox");
                if (item.claimer == state.user) {
                    checkBox.setAttribute("checked", "");
                }
                itemData.appendChild(checkBox);
            }

            // Invisible description div
            var descrDiv = document.createElement("div");	
            descrDiv.setAttribute("style", "display: none;");	
            descrDiv.innerHTML = item.descr;
            itemData.appendChild(descrDiv);

            var itemRow = document.createElement("tr");
            itemRow.appendChild(itemData);
            return itemRow;
        },

        createAddItem = function () {
            var itemData = document.createElement("td");
            itemData.setAttribute("style", "background-color: LightGray;");

            var addItemLink = document.createElement("a");
            addItemLink.setAttribute("id", "add-item");
            addItemLink.setAttribute("href", "#");
            addItemLink.setAttribute("style", "color: black;");
            addItemLink.appendChild(document.createTextNode("Add item..."));
            itemData.appendChild(addItemLink);

            var itemRow = document.createElement("tr");
            itemRow.appendChild(itemData);
            return itemRow;
        },

        saveSucceeded = async function () {
            setSaveSuccess();
            await sleep(1000);
            setSaveDefault();
        },

        saveFailed = async function () {
            setSaveFail();
            await sleep(1000);
            if (confirm("Changes could not be saved.\nNew changes may have been made to this Session, so this page will auto-refresh."
                + "\nIf the problem persists, please contact the site maintainers using the Help link below.")) {
                location.reload();
            }
        },

        // TODO: move these save button styling to "Template"

        setSaveDefault = function () {
            var saveButton = document.getElementById("save-button");
            saveButton.removeAttribute("disabled");
            saveButton.innerHTML = "Save";
            saveButton.style.backgroundColor = "#69a0f3";
        },

        setSaveInProgress = function () {
            var saveButton = document.getElementById("save-button");
            saveButton.setAttribute("disabled", "disabled");
            saveButton.innerHTML = "Saving...";
            saveButton.style.backgroundColor = "#69a0f3";
        },

        setSaveSuccess = function () {
            var saveButton = document.getElementById("save-button");
            saveButton.setAttribute("disabled", "disabled");
            saveButton.innerHTML = "Saved";
            saveButton.style.backgroundColor = "green";
        },

        setSaveFail = function () {
            var saveButton = document.getElementById("save-button");
            saveButton.setAttribute("disabled", "disabled");
            saveButton.innerHTML = "Failed";
            saveButton.style.backgroundColor = "red";
        },

        setSaveLock = function () {
            var saveButton = document.getElementById("save-button");
            saveButton.setAttribute("disabled", "disabled");
            saveButton.innerHTML = "Locked";
            saveButton.style.backgroundColor = "LightGray";
        },

        setupWishlistListeners = function (includeCurrentUser) {
            if (includeCurrentUser) {
                // Add listeners to this user's items
                var userList = document.getElementById("list_" + state.user);
                for (i = 1; i < userList.children.length; i++) {
                    userList.children[i].addEventListener("contextmenu", function (e) {
                        e.preventDefault();
                        _onRemoveItem(e.target);
                    });
                    userList.children[i].addEventListener("dblclick", function (e) {
                        _onShowDescr(e.target);
                    });
                }

                if (!state.isLockedDown) {
                    document.getElementById("add-item").addEventListener("click", function (event) {
                        event.preventDefault();
                        _onAddItem();
                    });
                    document.getElementById("save-button").addEventListener("click", function (e) {
                        _onSave(e.target);
                    });
                }
            }

            // Add listeners to the other user's items
            var otherLists = document.getElementById("other-lists");
            for (i = 0; i < otherLists.children.length; i++) {
                list = otherLists.children[i];
                for (j = 1; j < list.children.length; j++) {
                    list.children[j].addEventListener("dblclick", function (e) {
                        _onShowDescr(e.target);
                    });
                }
            }

            document.getElementById("signout-link").addEventListener("click", function () {
                _onSignOut();
            });
        },

        _onSignOut = function () {
            close();
            homepage.init();
        },

        _onAddItem = function () {
            if (state.isLockedDown) {
                return;
            }

            var table = document.getElementById("list_" + state.user);
            if (table.children.length >= 17) {
                alert("No more than 15 items are allowed per list.");
                return;
            }

            var newModelItem = { name: "", owner: state.user, claimer: "", price: "" };
            items.push(newModelItem);
            var newItem = createItem(newModelItem);
            newItem.addEventListener("contextmenu", function (e) {
                e.preventDefault();
                _onRemoveItem(e.target);
            });
            newItem.addEventListener("dblclick", function (e) {
                _onShowDescr(e.target);
            });
            table.insertBefore(newItem, table.children[table.children.length - 1]);
        },

        _onRemoveItem = function (itemDiv) {
            if (state.isLockedDown) {
                return;
            }

            var table = document.getElementById("list_" + state.user);
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
                descrDiv = $('<div />').text(descr).attr('id', 'description-div');

            if (state.user == owner && !state.isLockedDown) {
                descrDiv.setAttribute("contenteditable", "");
            }

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

            if (state.user == owner) {
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
                _onSave();
            }
            div.innerHTML = "";
            div.hide();
        },

        _onSave = async function () {
            setSaveInProgress();

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
                    session: state.session,
                    owner: state.user,
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
                        var itemClaimer = (checkbox.checked) ? state.user : "";
                        var itemPrice = itemData.firstChild.innerHTML;
                        var itemDescr = itemData.lastChild.innerHTML;
                        claimableItems.push({
                            name: itemData.children[1].innerHTML,
                            session: state.session,
                            owner: listOwner,
                            claimer: itemClaimer,
                            price: itemPrice,
                            order: j - 1,
                            descr: itemDescr
                        });
                    }
                }
            }

            websocketApp.updateItems(userItems, claimableItems);
        }

    return {
        init: init,
        close: close,
        redrawOtherLists: redrawOtherLists,
        saveSucceeded: saveSucceeded,
        saveFailed: saveFailed
    }
}());

// cookieHandler handles everthing related to storing, clearing, and retrieving browser cookies.
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
            return (session == null) ? "" : session;
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

        signIn = function (password) {
            if (isBlankString(state.session) || isBlankString(state.user)) return false;

            // FIXME: jquery
            var req = new XMLHttpRequest()
            req.open("PUT", "/signin", false)
            req.send(JSON.stringify({
                sessionName: state.session,
                username: state.user,
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

        getItems = function () {
            // FIXME: jquery. Also, status unauthorized.
            var req = new XMLHttpRequest()
            req.open("GET", "/lists/" + state.session.replace(" ", "%20"), false)
            req.send();

            var respItems = JSON.parse(req.responseText),
                items = [];

            for (i = 0; i < respItems.length; i++) {
                items.push({
                    name: respItems[i].Name,
                    owner: respItems[i].Owner,
                    claimer: (respItems[i].Owner != state.user) ? respItems[i].Claimer : "",
                    price: (respItems[i].Price != null) ? respItems[i].Price : "",
                    descr: respItems[i].Descr
                });
            }

            return items;
        },

        updateItems = function (userItems, otherItems) {
            var req = new XMLHttpRequest()
            req.open("PUT", "/lists/" + state.session.replace(" ", "%20"), false)
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

// websocketApp handles all web socket communication with the server.
var websocketApp = (function () {
    var socket,
        url,

        updateItems = function(userItems, otherItems) {
            h = {
                session: state.session.replace(" ", "%20"),
                userName: state.user,
                userItems: userItems,
                otherItems: otherItems
            };

            // TODO: remove this
            wishlistApp.saveSucceeded();

            socket.send("update:" + JSON.stringify(h));
        },

        setupEventHandlers = function () {
            socket.onopen = function (event) {
                state.socketConnected = true;
            };
            socket.onerror = function (error) {
                alert('WebSocket Error: ' + JSON.stringify(error));
            };
            socket.onmessage = function (event) {
                var message = event.data;
                if (message.startsWith('update')) {
                    var body = message.substring(message.indexOf(':') + 1);
                    var h = JSON.parse(body);
                    if (h.session == state.session && h.userName != state.user) {
                        wishlistApp.redrawOtherLists();
                    }
                } else if (message.startsWith('save-success')) {
                    if (message.substring(message.indexOf(':') + 1) == state.user) {
                        wishlistApp.saveSucceeded();
                    }
                } else if (message.startsWith('save-fail')) {
                    if (message.substring(message.indexOf(':') + 1) == state.user) {
                        wishlistApp.saveFailed();
                    }
                }
            };
            socket.onclose = function (event) {
                state.socketConnected = false;
            };
        },

        init = function () {
            // TODO: remove this
            state.socketConnected = true;
            if (state.socketConnected) {
                return;
            }

            href = window.location.href;
            url = href.replace(window.location.protocol, 'ws:').replace(href.substring(href.indexOf('?')), 'ws/session');
            socket = new WebSocket(url);
            setupEventHandlers();
        },

        close = function () {
            if (socket != null)
                socket.close();
        };

    return {
        init: init,
        close: close,
        updateItems: updateItems
    };
}());