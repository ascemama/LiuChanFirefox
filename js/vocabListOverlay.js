class VocabListOverlay {
    constructor() {
        // Load stylesheet (if it hasn't been loaded already)
        if (!lcxContent.enabled) lcxContent.loadStyleSheet();
        this.loadStyleSheet();

        const overlay = document.createElement('div');
        const header = document.createElement('p');
        const pin = document.createElement('button');
        const close = document.createElement('button');
        const textarea = document.createElement('table');

        overlay.setAttribute('id', 'liuchan-notepad-overlay');
        overlay.setAttribute('display', 'none');
        textarea.setAttribute('id', 'vocabList-table');
        header.textContent = 'Liuchan VocabList';
        pin.textContent = '\u2AEF';
        close.textContent = '\u2715';

        overlay.appendChild(header);
        overlay.appendChild(pin);
        overlay.appendChild(close);
        overlay.appendChild(textarea);
        document.body.appendChild(overlay);

        this.elements = [overlay, header, pin, close, textarea];
        this.isPinned = false;
        this.isVisible = false;

        this.pinOverlay = this.pinOverlay.bind(this);
        this.lostFocus = this.lostFocus.bind(this);
        this.closeOverlay = this.closeOverlay.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.saveAfterInput = this.saveAfterInput.bind(this);
        this.dragOverlay = this.dragOverlay.bind(this);
        this.stopDrag = this.stopDrag.bind(this);
        this.deleteRow = this.deleteRow.bind(this);

        header.addEventListener('mousedown', this.startDrag);
        textarea.addEventListener('input', this.saveAfterInput);
        pin.addEventListener('click', this.pinOverlay);
        close.addEventListener('click', this.closeOverlay);
        document.addEventListener('click', this.lostFocus);

        this.pos = [0, 0, 0, 0];
        this.currentVocabListLength = 0;
        this.loadFromStorage();
        this.showOverlay();
    }

    loadStyleSheet() {
        // Check if stylesheet isn't loaded already
        //const check = window.document.getElementById("liuchan-css");
        //if (check) { return; }

        // Create and append stylesheet
        const wd = window.document;

        //add css for vocabList
        const css = wd.createElementNS('http://www.w3.org/1999/xhtml', 'link');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', chrome.extension.getURL('css/vocabList.css'));
        css.setAttribute('id', 'vocabList.css');
        wd.getElementsByTagName('head')[0].appendChild(css);
    }

    loadFromStorage() {
        // This asks for and receives the stored notepad config from the background script
        chrome.runtime.sendMessage({ 'type': 'loadVocabList' }).then(r => {
            this.updateState(r);
        });

    }

    updateState(data) {
        const overlay = this.elements[0];
        const textarea = this.elements[4];
        const d = document.documentElement;
        if (typeof data.pos == "undefined") {
            overlay.style.left = (d.clientWidth / 2) - (overlay.offsetWidth / 2) + 'px';
            overlay.style.top = (d.clientHeight / 2) - (overlay.offsetHeight / 2) + 'px';
        } else {
            overlay.style.left = data.pos[0] + 'px';
            overlay.style.top = data.pos[1] + 'px';
            textarea.style.width = data.size[0] + 'px';
            textarea.style.height = data.size[1] + 'px';
        }

        this.currentVocabListLength = this.addVocabListTable(data.list);
        //if no character in vocabList then no need to show the vocab list
        if (this.currentVocabListLength == 0) {
            chrome.runtime.sendMessage({ 'type': 'removeShowVocabListFromContextMenu' })
        }

        this.isPinned = !data.pinned;
        this.pinOverlay();
        this.checkPageBoundary();
    }

    addVocabListTable(array) {
        const textarea = this.elements[4];
        array.forEach(function (item, index) {
            var row = textarea.insertRow(index);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            cell1.innerHTML = item;
            let deleteRowButton = document.createElement('button');
            deleteRowButton.textContent = '\u2715';
            cell2.appendChild(deleteRowButton);
            //var obj = this.elements[4];
            cell2.addEventListener('click', this.deleteRow);
        }, this)
        return array.length;

    }

    deleteRow(e) {
        let row = e.target.parentNode.parentNode;
        let table = this.elements[4].childNodes.item('tbody');
        table.removeChild(row);

        //it table becomes empty, then remove "showVocabList" from context menus and close the overlay
        if (table.firstChild == null) {
            chrome.runtime.sendMessage({ 'type': 'removeShowVocabListFromContextMenu' });
            this.closeOverlay();
        }
    }

    saveAfterInput() {
        // Prevent save and sync for every single keystroke
        clearTimeout(this.inputTimer);
        this.inputTimer = setTimeout(this.saveToStorage.bind(this), 300);
    }

    saveToStorage() {
        const textarea = this.elements[4];
        var content = { list: [] };
        for (let row of textarea.rows) {
            let val = row.cells[0].innerText;
            content.list.push(val);
        }
        chrome.runtime.sendMessage({ 'type': 'storeVocabList', 'content': content })

    }

    checkPageBoundary() {
        const overlay = this.elements[0];
        const textarea = this.elements[4];
        const d = document.documentElement;
        const el = overlay.getBoundingClientRect();

        const offsetX = (overlay.offsetWidth - textarea.offsetWidth) * 2;
        const offsetY = (overlay.offsetHeight - textarea.offsetHeight);

        // Set width of textarea to size of viewport minus offset to fit the borders/buttons
        // This is because the textarea is resizable instead of the parent div
        if (overlay.offsetWidth > d.clientWidth) textarea.style.width = (d.clientWidth - offsetX) + 'px';
        if (overlay.offsetHeight > d.clientHeight) textarea.style.height = (d.clientHeight - offsetY) + 'px';

        const maxLeft = Math.max(0, d.clientWidth - overlay.offsetWidth);
        const maxTop = Math.max(0, d.clientHeight - overlay.offsetHeight);

        if (el.x > maxLeft) overlay.style.left = maxLeft + 'px';
        if (el.y > maxTop) overlay.style.top = maxTop + 'px';
        if (el.x < 0) overlay.style.left = '0px';
        if (el.y < 0) overlay.style.top = '0px';
    }

    startDrag(e) {
        e = e || window.event;
        this.pos[2] = e.clientX;
        this.pos[3] = e.clientY;

        document.addEventListener('mouseup', this.stopDrag);
        document.addEventListener('mousemove', this.dragOverlay);
    }

    dragOverlay(e) {
        e = e || window.event;
        const el = this.elements[0];

        // Calculate the new cursor position:
        this.pos[0] = this.pos[2] - e.clientX;
        this.pos[1] = this.pos[3] - e.clientY;
        this.pos[2] = e.clientX;
        this.pos[3] = e.clientY;

        // Set new position
        el.style.top = (el.offsetTop - this.pos[1]) + "px";
        el.style.left = (el.offsetLeft - this.pos[0]) + "px";
    }

    stopDrag() {
        document.removeEventListener('mouseup', this.stopDrag);
        document.removeEventListener('mousemove', this.dragOverlay);
        this.saveToStorage();
    }

    pinOverlay() {
        this.isPinned = !this.isPinned;
        const el = this.elements[2];
        if (this.isPinned) {
            el.classList.add('liuchan-overlay-pinned');
            el.textContent = '\u27DF';
        } else {
            el.classList.remove('liuchan-overlay-pinned');
            el.textContent = '\t\u2AEF';
        }
        this.saveToStorage();
    }

   toggleOverlay() {
        this.isVisible ? this.closeOverlay() : this.loadFromStorage(); this.showOverlay();
    }

    showOverlay() {
        document.addEventListener('click', this.lostFocus);
        this.elements[0].style.display = '';
        this.isVisible = true;
        this.checkPageBoundary();
    }

    lostFocus(e) {
        if (e.srcElement.offsetParent !== this.elements[0] && e.srcElement !== this.elements[0] && !this.isPinned) {
            this.closeOverlay();
        }
    }

    closeOverlay() {
        document.removeEventListener('click', this.lostFocus);
        this.saveToStorage();
        this.elements[0].style.display = 'none';
        this.isVisible = false;

        let table = this.elements[4].childNodes.item('tbody');
        if (table != null) {
            let tableLength = table.rows.length;
            if (tableLength != 0) {
                //for some reason there is a childnode to the table inserted..
                for (let i = 0; i <= tableLength; i++) {
                    table.deleteRow(-1)
                }
                //the vocabList is not empty but UI gets closed so now we should be able to click on showVocabList in the context menu
                chrome.runtime.sendMessage({ 'type': 'addShowVocabListFromContextMenu' })
            }
        }
    }
}