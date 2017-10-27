function getCookie(cookieName) {
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
}

function setCookie(name, val, duration) {
    var d = new Date();
    d.setTime(d.getTime() + (duration * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + val + ";" + expires + ";path=/";
}

function clearCookies() {
    setCookie("wl_user", null);
    setCookie("wl_session", null);
}

function renderHomepage() {
    var cookieSession = getCookie("wl_session");
    var cookieUser = getCookie("wl_user");
    if (cookieSession != "null" && cookieUser != "null" &&
        cookieSession != "" && cookieUser != "" &&
        cookieSession != null && cookieUser != null) {
        window.location.href = "wishlist.html";
    }
    createBanner("Project Wish List",
        "font-family: \"Tangerine\", serif;" +
        "font-size: 7em;" +
        "color: snow;"
    );
    styleLinks();

    setupHomepageListeners();
}

function renderWishList() {
    var session = getCookie("wl_session");
    var user = getCookie("wl_user");
    // TODO: First send a sign in request with this cookie data and confirm that
    // the session and user are valid. If not, reset all cookies. Otherwise,
    // navigate to the home page.
    if (session == "null" || user == "null" ||
        session == "" || user == "" ||
        session == null || user == null) {

        window.location.href = "index.html";
    }
    // TODO: GET wishlist data from the server. For now, it's hardcoded.
    // Items will be populated by the data from the GET. They will be strictly
    // ordered, much like this example.
    var items = [
        { name: "Dre's #1", owner: "Dre", claimer: "Snoop" },
        { name: "Dre's #2", owner: "Dre", claimer: "" },
        { name: "Dre's #3", owner: "Dre", claimer: "Tupac" },
        { name: "Dre's #4", owner: "Dre", claimer: "Tupac" },
        { name: "Dre's #5", owner: "Dre", claimer: "" },
        { name: "Dre's #6", owner: "Dre", claimer: "Nate Dogg" },
        { name: "Dre's #7", owner: "Dre", claimer: "" },
        { name: "Dre's #8", owner: "Dre", claimer: "" },
        { name: "Snoop's #1", owner: "Snoop", claimer: "Tupac" },
        { name: "Snoop's #2", owner: "Snoop", claimer: "" },
        { name: "Snoop's #3", owner: "Snoop", claimer: "Warren G" },
        { name: "Tupac's #1", owner: "Tupac", claimer: "Snoop" },
        { name: "Tupac's #2", owner: "Tupac", claimer: "" },
        { name: "Warren's #1", owner: "Warren G", claimer: "Dre" },
        { name: "Warren's #2", owner: "Warren G", claimer: "Dre" },
        { name: "Warren's #3", owner: "Warren G", claimer: "" },
        { name: "Warren's #4", owner: "Warren G", claimer: "Tupac" },
        { name: "Nate Dogg's #1", owner: "Nate Dogg", claimer: "" },
        { name: "Nate Dogg's #2", owner: "Nate Dogg", claimer: "" },
        { name: "Nate Dogg's #3", owner: "Nate Dogg", claimer: "Dre" },
        { name: "Nate Dogg's #4", owner: "Nate Dogg", claimer: "Dre" },
        { name: "Nate Dogg's #5", owner: "Nate Dogg", claimer: "" },
        { name: "Nate Dogg's #6", owner: "Nate Dogg", claimer: "Warren G" }
    ];
    createBanner(session,
        "font-family: \"Tangerine\", serif;" +
        "font-size: 5em;" +
        "font-weight: bold;"
    );
    populateListsDiv(user, items);
    addSaveButton();
    styleLinks();

    setupWishlistListeners(user);
}

function redrawWishList() {
    document.getElementById("lists").innerHTML = "";
    document.getElementById("banner").innerHTML = "";
    renderWishList();
}

function createBanner(session, headerStyle) {
    var header = document.createElement("h1");
    header.setAttribute("style", headerStyle);
    header.appendChild(document.createTextNode(session));
    var banner = document.getElementById("banner");
    banner.setAttribute("style",
        "width: 100%;" +
        "text-align: center;" +
        "margin-top: 3em;"
    );
    banner.appendChild(header);
}

function populateListsDiv(user, items) {
    var listsDiv = document.getElementById("lists");
    var owners = [];
    for (i = 0; i < items.length; i++) {
        var item = items[i];
        if (!owners.includes(item.owner)) {
            var list = createList(item.owner);
            var listItem = createListItem(user, item, true, false);
            list.appendChild(listItem);
            owners.push(item.owner);
            listsDiv.appendChild(list);
        } else {
            var list = document.getElementById("list_" + item.owner);
            var listItem = createListItem(user, item, false, false);
            list.appendChild(listItem);
        }
    }
    var addItem = createListItem(user, null, false, true);
    document.getElementById("list_" + user).appendChild(addItem);

    listsDiv.setAttribute("style", "width: 90%;" +
        "margin: auto; margin-top: 2em;" +
        "margin-bottom: 2em; overflow: auto;" +
        "padding: 2em 2em 2em 2em;");
}

function createList(owner) {
    var table = document.createElement("table");
    table.setAttribute("id", "list_" + owner);
    table.setAttribute("class", "table table-bordered");
    table.setAttribute("style",
        "float: left;" +
        "width: 20%;" +
        "margin-bottom: 0em;"
    );

    var header = document.createElement("th");
    header.setAttribute("style", "background-color: snow;");
    header.appendChild(document.createTextNode(owner));
    var row = document.createElement("tr");
    row.appendChild(header);
    table.appendChild(row);

    return table;
}

function createListItem(user, item, isFirstItem, isAddItemCell) {
    var itemData = document.createElement("td");
    if (isAddItemCell) {
        itemData.setAttribute("style", "background-color: LightGray;");

        var addItemLink = document.createElement("a");
        addItemLink.setAttribute("id", "add_item");
        addItemLink.setAttribute("href", "#");
        addItemLink.setAttribute("style", "color: black;");
        addItemLink.appendChild(document.createTextNode("Add item..."));
        itemData.appendChild(addItemLink);
    } else {
        var itemDiv = document.createElement("div");
        if (user == item.owner) {
            itemDiv.setAttribute("contenteditable", "")
        } else {
            itemDiv.setAttribute("style", "width: 90%; float:left;")
        }
        itemDiv.appendChild(document.createTextNode(item.name));

        var cellColor = (isFirstItem) ? "#69a0f3" : "snow";
        itemData.setAttribute("style", "background-color: " + cellColor + ";");
        itemData.appendChild(itemDiv);
    }

    if (!isAddItemCell) {
        if (item.claimer == "" && user != item.owner || item.claimer == user) {
            var checkBox = document.createElement("input");
            checkBox.setAttribute("type", "checkbox");
            checkBox.setAttribute("style", "float: right;");
            itemData.appendChild(checkBox);
            if (item.claimer == user) {
                checkBox.setAttribute("checked", "");
            }
        }
    }
    var itemRow = document.createElement("tr");
    itemRow.appendChild(itemData);
    return itemRow;
}

function addSaveButton() {
    var listsDiv = document.getElementById("lists");

    var saveDiv = document.createElement("div");
    saveDiv.setAttribute("style",
        "width: 100%;" +
        "margin-top: 2em;" +
        "text-align: right;" +
        "float: right;"
    );

    var saveButton = document.createElement("button");
    saveButton.setAttribute("id", "save_button");
    saveButton.setAttribute("style",
        "font-family: -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\";" +
        "font-size: 1.25rem;" +
        "font-weight: 400;" +
        "line-height: 1.5;" +
        "background-color: #69a0f3;" +
        "border: none;" +
        "border-radius: .3rem;" +
        "color: white;" +
        "padding: 0.25em 1em 0.25em 1em"
    );
    saveButton.appendChild(document.createTextNode("Save"));

    saveDiv.appendChild(saveButton);
    listsDiv.appendChild(saveDiv);
}

function styleLinks() {
    document.getElementById("links_div").setAttribute("style",
        "width: 100%;" +
        "margin: 0 auto;" +
        "text-align: center;" +
        "margin-bottom: 2em;"
    );
}

function setupHomepageListeners() {
    document.getElementById("sign_in_link").addEventListener("click", function (event) {
        event.preventDefault();
        _onSignIn();
    });
}

function setupWishlistListeners(user) {
    document.getElementById("add_item").addEventListener("click", function (event) {
        event.preventDefault();
        _onAddItem(user);
    });
    document.getElementById("signout_link").addEventListener("click", function () {
        _onSignOut(true);
    });
    document.getElementById("save_button").addEventListener("click", function (e) {
        _onSave(user, e.target);
    });
    var userList = document.getElementById("list_" + user);
    for (i = 0; i < userList.children.length; i++) {
        userList.children[i].addEventListener("contextmenu", function (e) {
            e.preventDefault();
            _onRemoveItem(user, e.target);
        });
    }
}

function _keySignIn(e) {
    if (e.keyCode == 13) {
        _onSignIn();
    }
}

function _onSignIn() {
    var _session = document.getElementsByTagName("input")[0].value;
    var _user = document.getElementsByTagName("input")[1].value;
    var password = document.getElementsByTagName("input")[2].value;
    // TODO: Confirm session exists, confirm user exists, confirm password is correct.
    setCookie("wl_session", _session, 5);
    setCookie("wl_user", _user, 5);
    window.location.href = "wishlist.html";
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

    var newItem = createListItem(user, { name: "", owner: user, claimer: "" }, false, false);
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

async function _onSave(user, saveButton) {
    saveButton.innerHTML = "Saving...";
    saveButton.setAttribute("disabled", "disabled");

    var userItems = [];
    var claimableItems = [];

    var lists = document.getElementById("lists");
    for (i = 0; i < lists.children.length - 1; i++) {
        var list = lists.children[i];
        var listOwner = list.firstChild.firstChild.innerHTML;
        if (listOwner == user) {
            for (j = 1; j < list.children.length - 1; j++) {
                var itemDiv = list.children[j].firstChild.firstChild;
                userItems.push({
                    name: itemDiv.innerHTML,
                    owner: listOwner,
                    claimer: "unknown"
                });
            }
        } else {
            for (j = 1; j < list.children.length; j++) {
                var itemData = list.children[j].firstChild;
                if (itemData.children.length == 2) {
                    var checkbox = itemData.children[1];
                    var itemClaimer = (checkbox.checked) ? user : "";
                    claimableItems.push({
                        name: itemData.children[0].innerHTML,
                        owner: listOwner,
                        claimer: itemClaimer
                    });
                }
            }
        }
    }

    // TODO: PUT the update to the server, 

    saveButton.innerHTML = "Saved";
    saveButton.setAttribute("style",
        "font-family: -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\";" +
        "font-size: 1.25rem;" +
        "font-weight: 400;" +
        "line-height: 1.5;" +
        "background-color: green;" +
        "border: none;" +
        "border-radius: .3rem;" +
        "color: white;" +
        "padding: 0.25em 1em 0.25em 1em"
    );

    await sleep(1000);

    saveButton.innerHTML = "Save";
    saveButton.setAttribute("style",
        "font-family: -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\";" +
        "font-size: 1.25rem;" +
        "font-weight: 400;" +
        "line-height: 1.5;" +
        "background-color: #69a0f3;" +
        "border: none;" +
        "border-radius: .3rem;" +
        "color: white;" +
        "padding: 0.25em 1em 0.25em 1em"
    );
    saveButton.removeAttribute("disabled");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}