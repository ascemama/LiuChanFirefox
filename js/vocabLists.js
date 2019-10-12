'use strict';
class vocabLists{
constructor(){

    browser.contextMenus.create({
        id: "vocabLists",
        //title: browser.i18n.getMessage("vocabLists"),
        title:"Add Item to List",
        contexts: ["all"]
      }, this.onContextMenuCreated) 


      browser.contextMenus.onClicked.addListener(function(info, tab) { 
        switch (info.menuItemId) {
          case "vocabLists":
            console.log(info.selectionText);
            var item={ list:"test", char:"y"};
            browser.storage.local.set(item);
            let items=browser.storage.local.get();
            items.then(res=>{console.log("item"+JSON.stringify(res))}, res=>{console.log("gd")});
            break;
        }
      })
}
updateContextMenu(m){
    browser.contextMenus.update(
        "vocabLists",               // integer or string
        {title: "Add "+ m + " to list"} // object
      )
}


onContextMenusCreated() {
    if (browser.runtime.lastError) {
      console.log(`Error: ${browser.runtime.lastError}`);
    } else {
      console.log("Item created successfully");
    }
  }

}