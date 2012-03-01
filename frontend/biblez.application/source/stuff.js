enyo.kind({
    name: "App.StuffPopup",
    kind: "Popup",
    lazy: false,
    height: "95%",
    events: {
        onVerse: "",
        onNewBm: "",
        onNewNote: "",
        onSearch: ""
    },

    components: [
        {name: "stuff", style: "width: 320px", kind: "App.Stuff",
            onVerse: "doVerse",
            onNewBm: "handleNewBm",
            onNewNote: "handleNewNote",
            onCancel: "close",
            onPaneBack: "handleGoBack",
            onSearch: "handleSearch"
        }
    ],

    getVerse: function () {
        return this.$.stuff.getVerse();
    },

    getPassage: function () {
        return this.$.stuff.getPassage();
    },

    getCurrentView: function () {
        return this.$.stuff.getCurrentView();
    },

    goBack: function () {
        this.$.stuff.goBack();
    },

    handleSearch: function (inSender, searchTerm, searchType, searchScope) {
        this.doSearch(searchTerm, searchType, searchScope);
    },

    handleGoBack: function (inSender, inEvent) {
        //enyo.log("Handle Back...");
        //this.scrim = false;
        this.dismissWithClick = true;
        this.addStyles("height: 95%;");
    },

    getStuffKind: function () {
        return this.$.stuff;
    },

    openEdit: function (inSender, inEvent, passage, position) {
        this.scrim = true;
        this.dismissWithClick = false;
        this.$.stuff.openEdit(inSender, inEvent, passage, position);
        if(inSender.name === "itemBm")
            this.addStyles("height: 300px;");
        this.openAt(position, true);
    },

    setEditFocus: function(inType) {
        this.$.stuff.setEditFocus(inType);
    },

    handleNewBm: function () {
        this.doNewBm();
    },

    handleNewNote: function () {
        this.doNewNote();
    },

    close: function () {
        this.inherited(arguments);
        this.scrim = false;
        this.dismissWithClick = true;
        this.addStyles("height: 95%;");
        if (this.getCurrentView() === "editView")
            this.goBack();
    },

    resizeHandler: function () {
        this.inherited(arguments);
        //enyo.log("resized StuffPopup");
    }
});

enyo.kind({
    name: "App.Stuff",
    kind: "VFlexBox",
    height: "100%",
    events: {
        onVerse: "",
        onNewBm: "",
        onNewNote: "",
        onCancel: "",
        onPaneBack: "",
        onSearch: ""
    },
    published: {
        stuff: [
            {title: $L("Bookmarks"), view: "bookmarksView", icon: "images/bookmarks.png"},
            {title: $L("Notes"), view: "notesView", icon: "images/notes.png"},
            {title: $L("Highlights"), view: "highlightsView", icon: "images/highlights.png"},
            //{title: $L("Add Note"), view: "editView", icon: ""}
            {title: $L("Search"), view: "searchView", icon: "images/searchList.png"}
        ],
        bookmarks: [],
        notes: [],
        highlights: [],
        results: [],
        passage: "",
        verse: 1,
        editMode: null,
        currentBookmark: null,
        currentNote: null,
        searchScope: "Mat-Rev",
        searchTerm: "",
        searchType: -2,
        view: "popup"
    },
    components: [
        {kind: "VFlexBox", height: "100%", components: [
            {name: "stuffHeader", kind: "HFlexBox", align: "center", style: "margin-bottom: 10px;", components: [
                {kind: "Button", caption: $L("Back"), onclick: "goBack"},
                {kind: "Spacer"},
                {name: "headerTitle", content: $L("Personal")}
            ]},
            {name: "stuffPane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Simple", onSelectView: "viewSelected", components: [
                //START VIEW
                {name: "startView", components: [
                    {kind: "VFlexBox", className: "popup-scroller-container", height: "100%", components: [
                        {kind: "Scroller", className: "popup-scroller", flex: 1, components: [
                            {name: "startList", kind: "VirtualRepeater", onSetupRow: "getStartListItem", components: [
                                {name: "itemStart", kind: "Item", layoutKind: "HFlexLayout", tapHighlight: true, className: "list-item", components: [
                                    {name: "startIcon", kind: "Image", className: "list-icon"},
                                    {name: "startTitle", className: "list-title"}
                                    //{name: "moduleDescr", className: "list-subtitle"}

                                ],
                                onclick: "goToView"
                                }]
                            }
                        ]}
                    ]}
                ]},

                //BOOKMARKS VIEW
                {name: "bookmarksView", components: [
                    {kind: "VFlexBox", height: "100%", components: [
                        {name: "bmSearch", kind: "SearchInput", hint: $L("Search Bookmarks"), style: "margin-bottom: 10px;", selectAllOnFocus: true, oninput: "filterBookmarks", onCancel: "handleSearchCancel"},
                        {kind: "VFlexBox", className: "popup-scroller-container", flex: 1, components: [
                            {name: "scrollerBm", kind: "Scroller", className: "popup-scroller", flex: 1, components: [
                                {name: "bmHint", content: $L("No Bookmarks available. Tap on a verse number to add one!"), showing: false, className: "hint"},
                                {name: "bmList", kind: "VirtualRepeater", onSetupRow: "getBmListItem", components: [
                                    {name: "itemBm", kind: "SwipeableItem", onConfirm: "deleteBookmark", layoutKind: "VFlexLayout", tapHighlight: false, className: "list-item", components: [
                                        {name: "bmPassage"},
                                        {kind: "HFlexBox", components: [
                                            {name: "bmFolder", flex: 1, className: "sidebar-folder", allowHtml: true},
                                            {name: "bmTags", flex: 1, className: "sidebar-tags", allowHtml: true}
                                        ]}
                                    ],
                                    onclick: "goToVerse",
                                    onmousehold: "openEdit",
                                    onmouseout: "setEditFocus"
                                    }]
                                }
                            ]}
                        ]}
                    ]}
                ]},

                //NOTES VIEW
                {name: "notesView", components: [
                    {kind: "VFlexBox", height: "100%", components: [
                        {name: "noteSearch", kind: "SearchInput", hint: $L("Search Notes"), style: "margin-bottom: 10px;", selectAllOnFocus: true, oninput: "filterNotes", onCancel: "handleSearchCancel"},
                        {kind: "VFlexBox", className: "popup-scroller-container", flex: 1, components: [
                            {name: "scrollerNote", kind: "Scroller", className: "popup-scroller", flex: 1, components: [
                                {name: "noteHint", content: $L("No Notes available. Tap on a verse number to add one!"), showing: false, className: "hint"},
                                {name: "noteList", kind: "VirtualRepeater", onSetupRow: "getNoteListItem", components: [
                                    {name: "itemNote", kind: "SwipeableItem", onConfirm: "deleteNote", layoutKind: "VFlexLayout", tapHighlight: false, className: "list-item", components: [
                                        {name: "notePassage", className: "note-passage", allowHtml: true},
                                        {name: "noteText", allowHtml: true},
                                        {kind: "HFlexBox", components: [
                                            {name: "noteFolder", flex: 1, className: "sidebar-folder", allowHtml: true},
                                            {name: "noteTags", flex: 1, className: "sidebar-tags", allowHtml: true}
                                        ]}
                                    ],
                                    onclick: "showNote",
                                    onmousehold: "openEdit",
                                    onmouseout: "setEditFocus"
                                    }]
                                }
                            ]}
                        ]}
                    ]}
                ]},

                //HIGHLIGHTS VIEW
                {name: "highlightsView", components: [
                    {kind: "VFlexBox", className: "popup-scroller-container", height: "100%", components: [
                        {kind: "Scroller", className: "popup-scroller", flex: 1, components: [
                            {name: "hlHint", showing: false, content: $L("No Highlights available. Tap on a verse number to add one!"), className: "hint"},
                            {name: "hlList", kind: "VirtualRepeater", onSetupRow: "getHlListItem", components: [
                                {name: "itemHl", kind: "SwipeableItem", onConfirm: "deleteHighlight", layoutKind: "VFlexLayout", tapHighlight: false, className: "list-item", components: [
                                    {name: "hlPassage"}
                                ],
                                onclick: "goToVerse"
                                }]
                            }
                        ]}
                    ]}
                ]},

                //SEARCH VIEW
                {name: "searchView", components: [
                    {kind: "VFlexBox", height: "100%", components: [
                        {className: "search-container", components: [
                            {name: "searchInput", kind: "SearchInput", onkeydown: "inputKeydown"},
                            {name: "scopeSelector", kind: "RadioGroup", onChange: "scopeSelected", value: "nt", components: [
                                {name: "cb", caption: "CB", value: "book"},
                                {caption: $L("OT"), value: "ot"},
                                {caption: $L("NT"), value: "nt"},
                                {caption: $L("All"), value: "all"}
                            ]},
                            {name: "searchType", kind: "ListSelector", value: -2, onChange: "typeChanged", items: [
                                {caption: $L("Regular Expression"), value: 1},
                                {caption: $L("Multiword"), value: -2},
                                {caption: $L("Exact Phrase"), value: -1}
                            ]}
                        ]},
                        //{name: "searchProgress", kind: "ProgressBar"},
                        {name: "searchDivider", kind: "Divider", caption: $L("Results")},
                        {name: "searchSpinner", kind: "Spinner", style: "margin-left: auto; margin-right: auto;"},
                        {kind: "VFlexBox", className: "popup-scroller-container", height: "100%", components: [
                            {kind: "Scroller", className: "popup-scroller", flex: 1, components: [
                                {name: "searchList", kind: "VirtualRepeater", onSetupRow: "getSearchListItem", components: [
                                    {name: "itemSearch", kind: "Item", layoutKind: "VFlexLayout", tapHighlight: true, className: "list-item", components: [
                                        {name: "searchPassage"}
                                    ],
                                    onclick: "goToVerse"
                                    }]
                                }
                            ]}
                        ]}
                    ]}
                ]},

                //TAGS VIEW
                {name: "tagsView"},

                //ADD NOTE
                {name: "editView", kind: "App.AddNote", onEditData: "updateData", onCancel: "doCancel"},

                //NOTE VIEW
                {name: "noteView", components: [
                    {kind: "VFlexBox", className: "popup-scroller-container", height: "100%", components: [
                        {kind: "Scroller", flex: 1, components: [
                            {kind: "HFlexBox", align: "center", components: [
                                {name: "nvTitle", className: "nv-title"},
                                {kind: "Spacer"},
                                {name: "btPassage", kind: "Button", onclick: "goToVerse"}
                            ]},
                            {name: "nvNote", allowHtml: true, flex: 1, className: "nv-note"},
                            {kind: "HFlexBox", style: "border-top: 1px solid #D3D3D3;", components: [
                                {name: "nvFolder", flex: 1, className: "sidebar-folder", allowHtml: true},
                                {name: "nvTags", flex: 1, className: "sidebar-tags", allowHtml: true}
                            ]}
                        ]}
                    ]}
                ]}
            ]}
        ]}
    ],

    rendered: function () {
        this.inherited(arguments);
        if (this.view === "split") {
            this.$.stuffHeader.hide();
            this.addStyles("background-color: rgba(0,0,0,0.8);");
            this.$.searchType.addStyles("color: #F5F5F5;");
        } else {
            this.addStyles("background-color: none;");
            this.$.searchType.addStyles("color: #333;");
        }
    },

    viewSelected: function(inSender, inView, inPreviousView) {
        var title = "";
        switch (inView.name) {
            case "startView":
                this.$.headerTitle.setContent($L("Personal"));
                title = $L("Personal");
            break;
            case "bookmarksView":
                //this.getBookmarks();
                this.$.headerTitle.setContent($L("Bookmarks"));
                title = $L("Bookmarks");
            break;
            case "notesView":
                //this.getNotes();
                this.$.headerTitle.setContent($L("Notes"));
                title = $L("Notes");
            break;
            case "highlightsView":
                //this.getHighlights();
                this.$.headerTitle.setContent($L("Highlights"));
                title = $L("Highlights");
            break;
            case "editView":
                //this.$.headerTitle.setContent($L("Add Note"));
                api.getFolders(enyo.bind(this.$.editView, this.$.editView.handleFolders));
            break;
        }

        this.doPaneBack(inView.name, title);
    },

    goToStart: function () {
        this.$.stuffPane.selectViewByName("startView");
        this.dismissWithClick = true;
    },

    goBack: function () {
        this.$.stuffPane.back();
    },

    getCurrentView: function () {
        return this.$.stuffPane.getViewName();
    },

    goToSearch: function () {
        this.$.stuffPane.selectViewByName("searchView");
    },

    //START VIEW

    getStartListItem: function(inSender, inIndex) {
        var r = this.stuff[inIndex];
        if (r) {
            this.$.startTitle.setContent(r.title);
            //enyo.log(r.icon);
            this.$.startIcon.setSrc(r.icon);
            return true;
        } else {
            return false;
        }
    },

    goToView: function (inSender, inEvent, rowIndex) {
        this.$.stuffPane.selectViewByName(this.stuff[rowIndex].view);
    },

    //BOOKMARKS VIEW

    getBookmarks: function (searchTerm) {
        //this.$.spinner.show();
        if (searchTerm) {
            api.getBookmarks(-1,-1,enyo.bind(this, this.handleBookmarks), searchTerm);
        } else {
            api.getBookmarks(-1,-1,enyo.bind(this, this.handleBookmarks));
        }
    },

    handleBookmarks: function (bm) {
        this.bookmarks = bm;
        if (this.bookmarks.length !== 0) {
            this.$.bmHint.hide();
        } else {
            this.$.bmHint.show();
        }
        this.$.bmList.render();
        this.$.scrollerBm.scrollTo(0,0);
    },

    getBmListItem: function(inSender, inIndex) {
        var r = this.bookmarks[inIndex];
        if (r) {
            if (biblez.bookNames[parseInt(r.bnumber, 10)]) {
                if (r.title !== "") {
                    this.$.bmPassage.setContent(r.title + " (" + biblez.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber + ")");
                } else {
                    this.$.bmPassage.setContent(biblez.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber);
                }
                if (r.folder !== "") {this.$.bmFolder.setContent("<img src='images/folder_brown.png' class='sidebar-icon'/> " + r.folder);}
                if (r.tags !== "") {this.$.bmTags.setContent("<img src='images/tags.png' class='sidebar-icon'/> " + r.tags);}
            }

            //var isRowSelected = (inIndex == this.tappedItem);
            //this.$.itemBm.applyStyle("background", isRowSelected ? "#9dc5e5" : null);
            return true;
        } else {
            return false;
        }
    },

    deleteBookmark: function (inSender, inIndex) {
        this.verse = this.bookmarks[inIndex].vnumber;
        api.removeBookmark(this.bookmarks[inIndex].bnumber, this.bookmarks[inIndex].cnumber, this.bookmarks[inIndex].vnumber, enyo.bind(this, this.handleDelete, "bookmarks", $L("Bookmark")));
    },

    filterBookmarks: function (inSender, inEvent) {
        this.getBookmarks(inSender.getValue().toLowerCase());
    },

    //NOTES VIEW

    getNotes: function (searchTerm) {
        //this.$.spinner.show();
        if (searchTerm) {
            api.getNotes(-1,-1,enyo.bind(this, this.handleNotes), searchTerm);
        } else {
            api.getNotes(-1,-1,enyo.bind(this, this.handleNotes));
        }
    },

    handleNotes: function (notes) {
        //enyo.log(notes);
        //this.$.spinner.hide();
        this.notes = notes;
        if (this.notes.length !== 0) {
            this.$.noteHint.hide();
        } else {
            this.$.noteHint.show();
        }
        this.$.noteList.render();
        this.$.scrollerNote.scrollTo(0,0);
    },

    filterNotes: function (inSender, inEvent) {
        this.getNotes(inSender.getValue().toLowerCase());
    },

    getNoteListItem: function(inSender, inIndex) {
        var r = this.notes[inIndex];
        if (r) {
            this.$.noteText.setContent(r.note.replace(/"/g,""));
            if (biblez.bookNames[parseInt(r.bnumber, 10)]) {
                if (r.title !== "") {
                    this.$.notePassage.setContent("<b>" + r.title + "</b>" + " <i>(" + biblez.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber + ")</i>");
                } else {
                    this.$.notePassage.setContent("<i>" + biblez.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber + "</i>");
                }

            }

            if (r.folder !== "") {this.$.noteFolder.setContent("<img src='images/folder_brown.png' class='sidebar-icon'/> " + r.folder);}
            if (r.tags !== "") {this.$.noteTags.setContent("<img src='images/tags.png' class='sidebar-icon'/> " + r.tags);}

            //var isRowSelected = (inIndex == this.tappedItem);
            //this.$.itemNote.applyStyle("background", isRowSelected ? "#9dc5e5" : null);
            return true;
        } else {
            return false;
        }
    },

    deleteNote: function (inSender, inIndex) {
        this.verse = this.notes[inIndex].vnumber;
        api.removeNote(this.notes[inIndex].bnumber, this.notes[inIndex].cnumber, this.notes[inIndex].vnumber, enyo.bind(this, this.handleDelete, "notes", $L("Note")));
    },

    showNote: function (inSender, inEvent, rowIndex) {
        this.currentNote = this.notes[rowIndex];
        var passage = biblez.bookNames[parseInt(this.currentNote.bnumber, 10)].abbrev + " " + this.currentNote.cnumber + ":" + this.currentNote.vnumber;
        //enyo.log(note);
        this.$.nvTitle.setContent(this.currentNote.title);
        this.$.btPassage.setCaption(passage);
        this.$.nvNote.setContent(this.currentNote.note);

        this.$.nvFolder.setContent((this.currentNote.folder !== "") ? "<img src='images/folder_brown.png' class='sidebar-icon'/> " + this.currentNote.folder : "");
        this.$.nvTags.setContent((this.currentNote.tags !== "") ? "<img src='images/tags.png' class='sidebar-icon'/> " + this.currentNote.tags: "");

        this.$.stuffPane.selectViewByName("noteView");
    },

    //HIGHLIGHTS VIEW

    getHighlights: function () {
        //enyo.log("GET HIGHLIGHTS...");
        //this.$.spinner.show();
        api.getHighlights(-1,-1,enyo.bind(this, this.handleHighlights));
    },

    handleHighlights: function (hl) {
        //enyo.log("GOT HIGHLIGHTS...");
        //enyo.log(enyo.json.stringify(hl));
        //this.$.spinner.hide();
        this.highlights = hl;
        if (this.highlights.length !== 0) {
            this.$.hlHint.hide();
        } else {
            this.$.hlHint.show();
        }
        this.$.hlList.render();
    },

    getHlListItem: function(inSender, inIndex) {
        var r = this.highlights[inIndex];
        if (r) {
            if (biblez.bookNames[parseInt(r.bnumber, 10)]) {
                this.$.hlPassage.setContent(biblez.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber);
                this.$.itemHl.addStyles("background-color: " + r.color +";");
            }

            //var isRowSelected = (inIndex == this.tappedItem);
            //this.$.itemHl.applyStyle("background", isRowSelected ? "#9dc5e5" : null);
            return true;
        } else {
            return false;
        }
    },

    deleteHighlight: function (inSender, inIndex) {
        this.verse = this.highlights[inIndex].vnumber;
        api.removeHighlight(this.highlights[inIndex].bnumber, this.highlights[inIndex].cnumber, this.highlights[inIndex].vnumber, enyo.bind(this, this.handleDelete, "highlights", $L("Highlight")));
    },

    //SEARCH VIEW

    handleSearchResults: function (results) {
        this.results = results;
        if (this.results.length > 1) {
            this.$.searchDivider.setCaption(this.results.length + " " + $L("Results"));
        } else if (this.results.length == 1) {
            this.$.searchDivider.setCaption(this.results.length + " " + $L("Result"));
        } else {
            this.$.searchDivider.setCaption(this.results.length + " " + $L("Results"));
        }
        this.$.searchList.render();
        this.$.searchSpinner.hide();
    },

    getSearchListItem: function(inSender, inIndex) {
        //enyo.log(this.tappedItem);
        var r = this.results[inIndex];
        if (r) {
            this.$.searchPassage.setContent(r.passage);
            var isRowSelected = (inIndex == this.tappedItem);
            this.$.itemSearch.applyStyle("background", isRowSelected ? "#cde6f3" : null);
            return true;
        } else {
            return false;
        }
    },

    inputKeydown: function(inSender, inEvent) {
        if (inEvent.keyCode == 13) {
            //enyo.log("Search:", inSender.getValue());
            this.searchTerm = inSender.getValue();
            inSender.forceBlur();
            this.$.searchSpinner.show();
            this.results = [];
            this.$.searchList.render();
            this.$.searchDivider.setCaption($L("Results"));
            this.doSearch(this.searchTerm, this.searchType, this.searchScope);
        }
    },

    scopeSelected: function(inSender) {
        //this.log("Selected button" + inSender.getValue());
        //var scope = "";
        switch (inSender.getValue()) {
            case "ot":
                this.searchScope = "Gen-Mal";
            break;
            case "nt":
                this.searchScope = "Mat-Rev";
            break;
            case "all":
                this.searchScope = "Gen-Rev";
            break;
            case "book":
                this.searchScope = this.$.cb.getCaption();
            break;
        }
    },

    typeChanged: function(inSender, inValue, inOldValue) {
        this.searchType = inValue;
    },

    setBookCaption: function (name) {
        this.$.cb.setCaption(name);
        if (this.$.scopeSelector.getValue() == "book")
            this.searchScope = this.$.cb.getCaption();
    },

    //ADD & EDIT POPUP

    openEdit: function (inSender, inEvent, passage, position) {
        //enyo.log("Open Edit Menu...", passage, inEvent.rowIndex);
        var r = null;
        if (inSender.name == "itemBm") {
            this.$.editView.setEditType("bookmark");
            if (inEvent) {
                r = this.bookmarks[inEvent.rowIndex];
                this.currentBookmark = r;
                this.setEditMode("edit");
                this.$.editView.setBtCaption($L("Edit"));
            } else if (passage) {
                r = passage;
                for (var i=0;i<this.bookmarks.length;i++) {
                    if(parseInt(r.bnumber, 10) == parseInt(this.bookmarks[i].bnumber, 10) && parseInt(r.cnumber, 10) == parseInt(this.bookmarks[i].cnumber, 10) && parseInt(r.vnumber, 10) == parseInt(this.bookmarks[i].vnumber, 10)) {
                        r = this.bookmarks[i];
                    }
                }
                this.currentBookmark = r;
                this.setEditMode("add");
                this.$.editView.setBtCaption($L("Add"));
            }
            this.$.stuffPane.selectViewByName("editView");
            this.$.headerTitle.setContent($L("Add Bookmark") + " - " + biblez.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber);
            this.$.editView.setData(r.title, r.folder, r.tags);
        } else if (inSender.name == "itemNote") {
            this.$.editView.setEditType("note");
            if (inEvent) {
                r = this.notes[inEvent.rowIndex];
                this.currentNote = r;
                this.setEditMode("edit");
                this.$.editView.setBtCaption($L("Edit"));
            } else if (passage) {
                r = passage;
                for (var j=0;j<this.notes.length;j++) {
                    if(parseInt(r.bnumber, 10) == parseInt(this.notes[j].bnumber, 10) && parseInt(r.cnumber, 10) == parseInt(this.notes[j].cnumber, 10) && parseInt(r.vnumber, 10) == parseInt(this.notes[j].vnumber, 10)) {
                        r = this.notes[j];
                    }
                }
                this.currentNote = r;
                if (inSender.mode) {
                    this.setEditMode("edit");
                    this.$.editView.setBtCaption($L("Edit"));
                } else {
                    this.setEditMode("add");
                    this.$.editView.setBtCaption($L("Add"));
                }

            }
            this.$.stuffPane.selectViewByName("editView");
            this.$.headerTitle.setContent((inSender.mode) ? $L("Edit") + " - " + biblez.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber : $L("Add Note") + " - " + biblez.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber);
            this.$.editView.setData(r.title, r.folder, r.tags, r.note);
            this.$.editView.setNoteFocus();
            //this.openAt(position, true);
        }
        biblez.isOpen = true;
    },

    updateData: function (inSender, inEvent) {
        var tmp = inSender.getData();
        //enyo.log(tmp);
        if (inSender.editType == "bookmark") {
            if (this.editMode == "edit") {
                api.updateBookmark(this.currentBookmark.bnumber, this.currentBookmark.cnumber, this.currentBookmark.vnumber, tmp.title, tmp.folder, tmp.tags, enyo.bind(this, this.handleUpdateBookmark, $L("Updated")));
            } else {
                api.addBookmark(this.currentBookmark.bnumber, this.currentBookmark.cnumber, this.currentBookmark.vnumber, tmp.title, tmp.folder, tmp.tags, enyo.bind(this, this.handleUpdateBookmark, $L("Added")));
            }
        } else if (inSender.editType == "note") {
            if (this.editMode == "edit") {
                api.updateNote(this.currentNote.bnumber, this.currentNote.cnumber, this.currentNote.vnumber, tmp.note, tmp.title, tmp.folder, tmp.tags, enyo.bind(this, this.handleUpdateBookmark, $L("Updated")));
            } else {
                api.addNote(this.currentNote.bnumber, this.currentNote.cnumber, this.currentNote.vnumber, tmp.note, tmp.title, tmp.folder, tmp.tags, enyo.bind(this, this.handleUpdateBookmark, $L("Added")));
            }
        }

        this.doCancel();
        biblez.isOpen = false;
    },

    handleUpdateBookmark: function (inAction) {
        if (this.$.editView.editType == "bookmark") {
            enyo.windows.addBannerMessage(inAction + " " + $L("Bookmark"), enyo.json.stringify({}));
            this.getBookmarks();
            this.doNewBm();
        } else if (this.$.editView.editType == "note") {
            enyo.windows.addBannerMessage(inAction + " " + $L("Note"), enyo.json.stringify({}));
            this.getNotes();
            this.doNewNote();
        }
        api.getFolders(enyo.bind(this.$.editView, this.$.editView.handleFolders));
    },

    setEditFocus: function (inType) {
        if (inType === "bookmark")
            this.$.editView.setFocus();
    },

    //GENERAL

    handleSearchCancel: function (inSender, inEvent) {
        if (inSender.name === "noteSearch")
            this.getNotes();
        else if (inSender.name === "bmSearch")
            this.getBookmarks();
    },

    handleDelete: function (list, item) {
        enyo.windows.addBannerMessage($L("Deleted") + " " + item, enyo.json.stringify({}));
        if (list == "notes") {
            this.getNotes();
            if (enyo.byId("noteIcon"+this.verse))
                enyo.byId("noteIcon"+this.verse).innerHTML = "";
            //this.doNoteDelete();
        } else if (list == "bookmarks") {
            this.getBookmarks();
            if (enyo.byId("bmIcon"+this.verse))
                enyo.byId("bmIcon"+this.verse).innerHTML = "";
            //this.doBmDelete();
        } else {
            this.getHighlights();
            if (enyo.byId("verse"+this.verse))
                enyo.byId("verse"+this.verse).style.backgroundColor = "transparent";
        }
    },

    goToVerse: function(inSender, inEvent, rowIndex) {
        switch (inSender.name) {
            case "btPassage":
                //this.tappedItem = rowIndex;
                //this.$.noteList.render();
                this.passage = biblez.bookNames[parseInt(this.currentNote.bnumber, 10)].abbrev + " " + this.currentNote.cnumber;
                this.verse = this.currentNote.vnumber;
            break;
            case "itemBm":
                this.tappedItem = rowIndex;
                this.$.bmList.render();
                this.passage = biblez.bookNames[parseInt(this.bookmarks[rowIndex].bnumber, 10)].abbrev + " " + this.bookmarks[rowIndex].cnumber;
                this.verse = this.bookmarks[rowIndex].vnumber;
            break;
            case "itemHl":
                this.tappedItem = rowIndex;
                this.$.hlList.render();
                this.passage = biblez.bookNames[parseInt(this.highlights[rowIndex].bnumber, 10)].abbrev + " " + this.highlights[rowIndex].cnumber;
                this.verse = this.highlights[rowIndex].vnumber;
            break;
            case "itemSearch":
                this.tappedItem = rowIndex;
                this.$.searchList.render();
                this.passage = this.results[rowIndex].abbrev + " " + this.results[rowIndex].cnumber;
                this.verse = parseInt(this.results[rowIndex].vnumber, 10);
            break;
        }
        this.doVerse();
        biblez.isOpen = false;
        this.doCancel();
    }
});