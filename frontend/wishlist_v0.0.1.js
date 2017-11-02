// TODO: Pull all the styling into a css file, and just apply classes where needed.

function renderHomepage() {
    var cookieSession = (getCookie("wl_session") == null) ? "" : getCookie("wl_session");
    var cookieUser = (getCookie("wl_user") == null) ? "" : getCookie("wl_user");
    if (cookieSignIn(cookieSession, cookieUser)) {
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

async function runWishList() {
    redrawWishList(true);
    while (true) {
        await sleep(120000); // Poll every 2 mins
        redrawWishList(false);
    }
}

async function redrawWishList(mustSignIn) {
    var session = (getCookie("wl_session") == null) ? "" : getCookie("wl_session");
    var user = (getCookie("wl_user") == null) ? "" : getCookie("wl_user");
    if (mustSignIn) {
        if (!cookieSignIn(session, user)) {
            clearCookies();
            window.location.href = "index.html";
        }
    }

    var items = await getItemsFromServer(session, user);

    document.getElementById("lists").innerHTML = "";
    document.getElementById("banner").innerHTML = "";
    renderWishList(session, user, items);
}

function renderWishList(session, user, items) {
    createBanner(session,
        "font-family: \"Tangerine\", serif;" +
        "font-size: 5em;" +
        "font-weight: bold;"
    );
    populateListsDiv(user, items);
    addSaveButton();
    styleLinks();

    setupWishlistListeners(session, user);
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
    // Prepare the lists
    var listsDiv = document.getElementById("lists");
    var otherListsDiv = document.createElement("div");
    otherListsDiv.setAttribute("id", "other_lists");
    otherListsDiv.setAttribute("style",
        "overflow: auto;" +
        "white-space: nowrap;" +
        "width: 82%;" +
        "padding-bottom: 1em;" +
        "margin: -0.05em 0em 0em 0.3em;" +
        "float: left;"
    );
    listsDiv.appendChild(otherListsDiv);

    // Create the items
    var owners = [];
    for (i = 0; i < items.length; i++) {
        var item = items[i];
        var currentListsDiv = (item.owner == user) ? listsDiv : otherListsDiv;
        if (!owners.includes(item.owner)) {
            var list = createList(user, item.owner);
            var listItem = createListItem(user, item, true);
            list.appendChild(listItem);
            owners.push(item.owner);
            currentListsDiv.appendChild(list);
        } else {
            var list = document.getElementById("list_" + item.owner);
            var listItem = createListItem(user, item, false);
            list.appendChild(listItem);
        }
    }

    // Add the "Add item..." cell
    var addItem = createAddItem();
    document.getElementById("list_" + user).appendChild(addItem);

    // Style the lists' container
    listsDiv.appendChild(otherListsDiv);
    listsDiv.setAttribute("style",
        "width: 97%;" +
        "margin: auto;" +
        "margin-top: 2em;" +
        "margin-bottom: 2em;" +
        "padding: 1em;" +
        "overflow: auto;"
    );
}

function createList(user, owner) {
    var table = document.createElement("table");
    table.setAttribute("id", "list_" + owner);
    table.setAttribute("class", "table table-bordered");

    if (user != owner) {
        table.setAttribute("style",
            "width: 22%;" +
            "vertical-align: top;" +
            "margin: 0;" +
            "padding: 0;" +
            "display: inline-block;"
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
    header.setAttribute("style", "background-color: snow;");
    header.appendChild(document.createTextNode(owner));
    var row = document.createElement("tr");
    row.appendChild(header);
    table.appendChild(row);

    return table;
}

function createListItem(user, item, isFirstItem) {
    // Table data container
    var itemData = document.createElement("td");
    var cellColor = (isFirstItem) ? "#69a0f3" : "snow";
    itemData.setAttribute("style",
        "background-color: " + cellColor + ";" +
        "height: 3em;" +
        "padding: 0;"
    );

    // Price box
    var priceDiv = document.createElement("div");
    priceDiv.setAttribute("style",
        "background-color: LightGreen;" +
        "height: 3em;" +
        "width: 3em;" +
        "float: left;" +
        "line-height: 3em;" +
        "text-align: center;" +
        "overflow: hidden;" +
        "white-space: nowrap;"
    );
    if (user == item.owner) { priceDiv.setAttribute("contenteditable", "") }
    priceDiv.innerHTML = item.price;
    itemData.appendChild(priceDiv);

    // Content div
    var contentDiv = document.createElement("div");
    itemData.appendChild(contentDiv);
    var contentDivWidth = 8;
    if (user == item.owner) {
        contentDiv.setAttribute("contenteditable", "")
        contentDivWidth = 10;
    } else if (item.claimer != "" && item.claimer != user) {
        contentDivWidth = 10.8;
    }
    contentDiv.setAttribute("style",
        "width: " + contentDivWidth + "em;" +
        "float:left;" +
        "line-height: 3em;" +
        "padding-left: 1em;" +
        "overflow: hidden;" +
        "white-space: nowrap;"
    );
    contentDiv.appendChild(document.createTextNode(item.name));

    // Checkbox
    if (item.claimer == "" && user != item.owner || item.claimer == user) {
        var checkBox = document.createElement("input");
        checkBox.setAttribute("type", "checkbox");
        checkBox.setAttribute("style",
            "float: right;" +
            "margin: 1em 1em 0em 1em;"
        );
        itemData.appendChild(checkBox);
        if (item.claimer == user) {
            checkBox.setAttribute("checked", "");
        }
    }

    // Invisible description div
    var descrDiv = document.createElement("div");
    descrDiv.setAttribute("style", "display: none;");
    descrDiv.innerHTML = item.descr;
    itemData.appendChild(descrDiv);

    var itemRow = document.createElement("tr");
    itemRow.appendChild(itemData);
    return itemRow;
}

function createAddItem() {
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
    saveButton.appendChild(document.createTextNode("Save"));
    styleButton(saveButton, "Save", "#69a0f3")

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

function _keySignIn(e) {
    if (e.keyCode == 13) {
        _onSignIn();
    }
}

function _onSignIn() {
    var _session = document.getElementsByTagName("input")[0].value;
    var _user = document.getElementsByTagName("input")[1].value;
    var password = document.getElementsByTagName("input")[2].value;

    if (signIn(_session, _user, password)) {
        setCookie("wl_session", _session, 5);
        setCookie("wl_user", _user, 5);
        window.location.href = "wishlist.html";
    } else {
        alert("The session, username, or password you entered is incorrect. Please try again.")
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** ----------------------------------------------------------  Server Connection  ---------------------------------------------------------- */


function signIn(session, user, password) {
    if (session == "" || session == "null" ||
        user == "" || user == "null") {
        return false;
    }

    if (session == "OG Wish List") {
        // Make passwords irrelevant for the demo session
        password = "";
    }

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
}

function cookieSignIn(session, user) {
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
}

function getItemsFromServer(session, user) {
    session.replace(" ", "%20");

    var req = new XMLHttpRequest()
    req.open("GET", "/lists/" + session, false)
    req.send();

    var respItems = JSON.parse(req.responseText);

    var items = [];
    for (i = 0; i < respItems.length; i++) {
        var _name = respItems[i].Name;
        var _owner = respItems[i].Owner;
        var _claimer = (_owner != user) ? respItems[i].Claimer : "";
        var _price = (respItems[i].Price != null) ? respItems[i].Price : "";
        var _descr = respItems[i].Descr;
        items.push({ name: _name, owner: _owner, claimer: _claimer, price: _price, descr: _descr });
    }

    return items;
}

function sendUpdateToServer(session, user, _userItems, _otherItems) {
    session.replace(" ", "%20");

    var req = new XMLHttpRequest()
    req.open("PUT", "/lists/" + session, false)
    req.send(JSON.stringify({
        userName: user,
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

function serverError() {
    alert("Something went wrong.");
    location.reload();
}