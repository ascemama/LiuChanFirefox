'use strict';
class vocabLists{
constructor(){

    browser.contextMenus.create({
        id: "addToVocabList",
        title:"Add Item to List",
        contexts: ["all"]
      }, this.onContextMenuCreated) 

      browser.contextMenus.create({
        id: "deleteVocabList",
        title:"Delete vocabuliary list",
        contexts: ["all"]
      }, this.onContextMenuCreated) 


      browser.contextMenus.onClicked.addListener(function(info, tab) { 
        switch (info.menuItemId) {
          case "addToVocabList":
            let items=browser.storage.local.get();
            items.then(res=> {
            //list is empty
              if(res.list === undefined){
                var d=new Date()

                var item={ list:"//"+d.toDateString()+"\n"+info.selectionText+ "\n"};
              }
              else{
                item={list:res.list+info.selectionText+"\n"};
              }
            //re-write
              browser.storage.local.set(item);
              items=browser.storage.local.get();
              items.then(res=>{console.log(JSON.stringify(res))});
            });
            break;
            case "deleteVocabList":
              let  itemsToBeDeleted=browser.storage.local.get();
                itemsToBeDeleted.then(res=> {
                //list is empty
                  if(res.list !== undefined){
                    browser.storage.local.remove("list")
                  }});
                break;

        }
      })
}
updateContextMenu(m){
    browser.contextMenus.update(
        "addToVocabList",               // integer or string
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