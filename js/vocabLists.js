'use strict';
class VocabList {
  constructor() {

    //create context menus
    browser.contextMenus.create({
      id: "addToVocabList",
      title: "Add Item to List",
      contexts: ["all"]
    }, this.onContextMenuCreated);

    browser.contextMenus.create({
      id: "deleteVocabList",
      title: "Delete vocabulary list",
      contexts: ["all"]
    }, this.onContextMenuCreated);


    browser.contextMenus.create({
      id: "exportVocabList",
      title: "Export vocabulary list",
      contexts: ["all"]
    }, this.onContextMenuCreated);

    //this context menu is shown only if there is a vocab list already to show
    if (VocabList.isThereAVocabList()) {
      browser.contextMenus.create({
        id: "showVocabList",
        title: "show current vocabulary list",
        contexts: ["all"]
      }, this.onContextMenusCreated);
    }
    //define context menu listeners
    browser.contextMenus.onClicked.addListener(function (info, tab) {
      switch (info.menuItemId) {
        case "addToVocabList":
          let items = browser.storage.local.get();
          items.then(res => {
            //list is empty
            if (res.list === undefined) {
              var d = new Date()

              var item = { list: [info.selectionText] };
            }
            else {
              res.list.push(info.selectionText);
              item = { list: res.list };
            }
            //re-write
            browser.storage.local.set(item).then(res => {
              VocabList.showStorageContent();
            })
          });
          vocabList.updateContextMenuAddShowVocabList();
          break;
        case "deleteVocabList":
          let itemsToBeDeleted = browser.storage.local.get();
          itemsToBeDeleted.then(res => {
            //list is empty
            if (res.list !== undefined) {
              browser.storage.local.remove("list")
            }
            VocabList.showStorageContent();
            //vocabList empty, remove "showVocabList from context menus"
            VocabList.updateContextMenuRemoveShowVocabList();
          });
          break;
        case "exportVocabList":
          browser.storage.local.get().then(res => {
            //list is empty, no download
            if (res.list !== undefined) {
              var d=new Date();
              let objURL = URL.createObjectURL(new Blob(["//" + d.toDateString()+"\n "+JSON.stringify(res.list, null,1).replace(/\[|\]|,|"/g, "").trim()], { type: 'application/json' }));
              browser.downloads.download({ url: objURL });
            }
            else {
              console.log("no list to export")
            }
            VocabList.showStorageContent();
          });
          break;
        case "showVocabList":
          chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
            chrome.tabs.sendMessage(tab[0].id, { 'type': 'showVocabList' });
          });
          //while the list is shown in UI no context menu for it
          VocabList.updateContextMenuRemoveShowVocabList();
          break;
        default:
          console.log('vocabLists.js received unknown request: ', request);
      }
    })
  }
  static updateContextMenuAddCharacter(m) {
    //if a character is selected display it in the context menu
    if (m != "") {
      browser.contextMenus.update(
        "addToVocabList",               // integer or string
        { title: "Add " + m + " to list" } // object
      )
    }
    //if not, let's delete the Add context menu item
    else {
      browser.contextMenus.remove("addToVocabList");
    }
  }

  static updateContextMenuRemoveShowVocabList() {
    browser.contextMenus.remove("showVocabList");
  }

  updateContextMenuAddShowVocabList() {
    browser.contextMenus.create({
      id: "showVocabList",
      title: "show current vocabulary list",
      contexts: ["all"]
    }, this.onContextMenusCreated);

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

  static isThereAVocabList() {
    let items = browser.storage.local.get();
    items.then(res => {
      if (items.list == null || items.list.length == 0) {
        return false;
      }
      return true;
    })
  }

  static stringToJsonForStorage(text) {
    let content = { list: [] };
    let lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let tr = lines[i].trim();
      if (tr != "") {
        content.list.push(tr);
      }
    }
    return content;
  }

  static storeVocabList(list) {
    browser.storage.local.set(list).then(res => {
      VocabList.showStorageContent();
    });
  }


}
