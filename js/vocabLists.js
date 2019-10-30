'use strict';
class vocabLists {
  constructor() {

    browser.contextMenus.create({
      id: "addToVocabList",
      title: "Add Item to List",
      contexts: ["all"]
    }, this.onContextMenuCreated);

    browser.contextMenus.create({
      id: "deleteVocabList",
      title: "Delete vocabuliary list",
      contexts: ["all"]
    }, this.onContextMenuCreated);


    browser.contextMenus.create({
      id: "exportVocabList",
      title: "Export vocabuliary list",
      contexts: ["all"]
    }, this.onContextMenuCreated);

    /*
    browser.commands.onCommand.addListener(function (command) {
      if (command === "addCharacterToList") {
        console.log("Toggling the feature!");
      }
    });
*/
    browser.contextMenus.create({
      id: "showVocabList",
      title: "show current vocabuliary list",
      contexts: ["all"]
    }, this.onContextMenusCreated);

    browser.contextMenus.onClicked.addListener(function (info, tab) {
      switch (info.menuItemId) {
        case "addToVocabList":
          let items = browser.storage.local.get();
          items.then(res => {
            //list is empty
            if (res.list === undefined) {
              var d = new Date()

              var item = { list: ["//" + d.toDateString(), info.selectionText] };
            }
            else {
              //item = { list: res.list + info.selectionText + ' \\r\\n' };
              res.list.push(info.selectionText);
              item = { list: res.list };
            }
            //re-write
            browser.storage.local.set(item).then(res => {
              vocabLists.showStorageContent();
            })
          });
          break;
        case "deleteVocabList":
          let itemsToBeDeleted = browser.storage.local.get();
          itemsToBeDeleted.then(res => {
            //list is empty
            if (res.list !== undefined) {
              browser.storage.local.remove("list")
            }
            vocabLists.showStorageContent();
          });
          break;
        case "exportVocabList":
          browser.storage.local.get().then(res => {
            //list is empty, no download
            if (res.list !== undefined) {
              let objURL = URL.createObjectURL(new Blob([JSON.stringify(res.list, null, 2).replace(/\[|\]|,|"/g, "").replace(" ", "")], { type: 'application/json' }));
              browser.downloads.download({ url: objURL });
            }
            else {
              console.log("no list to export")
            }
            vocabLists.showStorageContent();
          });
        case "showVocabList":
          browser.storage.local.get().then(res => {
            //list is empty, no download
            if (res.list !== undefined) {
              var prettyList = JSON.stringify(res.list, null, 2).replace(/\[|\]|,|"/g, "").replace(" ", "");
            }
            else {
              console.log("no list to display")
            }
            vocabLists.showStorageContent();
            chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
              chrome.tabs.sendMessage(tab[0].id, { 'type': 'showVocabList', 'content': prettyList });
            })
          });
          break;
        default:
          console.log('vocabLists.js received unknown request: ', request);
      }
    })
  }
  updateContextMenu(m) {
    //if a character is selected display it in the context menu
    if (m != "") {
      browser.contextMenus.update(
        "addToVocabList",               // integer or string
        { title: "Add " + m + " to list" } // object
      )
    }
    //if not, let's delete the Add context menu item
    else {
      browser.contextMenus.remove("addToVocabList")
    }
  }


  onContextMenusCreated() {
    if (browser.runtime.lastError) {
      console.log(`Error: ${browser.runtime.lastError}`);
    } else {
      console.log("Item created successfully");
    }
  }

  static showStorageContent() {
    let items = browser.storage.local.get();
    items.then(res => { console.log(JSON.stringify(res)) });
  }

  static stringToJsonForStorage(text) {
    console.log("stringToJsonForStorage text:" + text);
    var content = { list: [] };
   // var re=/\s/;
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      if(lines[i]!=""){
        content.list.push(lines[i]);
      }
    }
    console.log("stringToJsonForStorage item:"+JSON.stringify(content))
    return content;
  }

  static storeVocabList(list) {
    browser.storage.local.set(list).then(res => {
      vocabLists.showStorageContent();
    });
  }


}
