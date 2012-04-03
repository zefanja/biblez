/*### BEGIN LICENSE
# Copyright (C) 2011 Stephan Tetzel <info@zefanjas.de>
# This program is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License version 3, as published
# by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranties of
# MERCHANTABILITY, SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR
# PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program.  If not, see <http://www.gnu.org/licenses/>.
### END LICENSE*/

enyo.kind({
    name: "App.MainView",
    kind: enyo.VFlexBox,
    className: "scroller-background",
    components: [
        //{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
        //{kind: "ApplicationEvents", onUnload: "saveSettings"},
        {name: "notePopup", kind: "BibleZ.AddNote", onAddNote: "addNote", onEditNote: "handleEditNote"},
        {name: "noteView", kind: "BibleZ.ShowNote", onNoteTap: "handleEditNote", style: "min-width: 100px; max-width: 300px;"},
        {name: "versePopup", kind: "BibleZ.VersePopup", className: "verse-popup",
            //onOpen: "hideColors",
            onNote: "handleNote",
            onBookmark: "handleBookmark",
            onEditBookmark: "handleEditBookmark",
            onHighlight: "handleHighlight",
            onRelease: "handleMouseRelease"
        },
        {name: "fontMenu", kind: "BibleZ.FontMenu", onFontSize: "changeFontSize", onFont: "changeFont", onSync: "changeSync", onScrolling: "changeScrolling"},
        {name: "historyMenu", kind: "Menu", lazy: false},
        {name: "crossRefMenu", kind: "Menu", lazy: false},
        {name: "library", kind: "App.Library", onSelectModule: "handleSelectModules"},
        {name: "selector", kind: "App.Selector", onChapter: "getVMax", onVerse: "handleOnVerse"},
        {name: "stuff", kind: "App.StuffPopup",
            onVerse: "handleStuffVerse",
            onNewBm: "getBookmarks",
            onNewNote: "getNotes",
            onSearch: "handleSearch"
            //onClose: "stuffGoBack"
        },
        {name: "actionMenu", kind: "Menu", components: [
            {icon: "images/bookMenu.png", onclick: "openSelector"},
            {icon: "images/historyMenu.png", onclick: "openHistoryMenu"},
            {icon: "images/searchMenu.png", onclick: "openSearch"},
            {icon: "images/fontMenu.png", onclick: "openFontMenu"},
            {icon: "images/sidebarMenu.png", onclick: "openStuff"}
        ]},

        {name: "headerMain", kind: "Header", className: "view-header", components: [
            {kind: "Button", name: "btBack", showing: false, caption: $L("Back"), onclick: "goBack", className: "header-button"},
            {name: "verseBox", kind: "HFlexBox", flex: 1, components: [
                {kind: "Button", name: "btModule", caption: "Module", onclick: "openLibrary", className: "header-button"},
                {kind: "IconButton", name: "btGo", icon: "images/book.png", onclick: "openSelector", className: "header-button"},
                {name: "btHistory", kind: "IconButton", icon: "images/history.png", onclick: "openHistoryMenu", className: "header-button"}
            ]},
            {name: "passageBox", kind: "HFlexBox", flex: 1, components: [
                {name: "passageLabel", content: "", className: "passage-label", flex: 1}
            ]},
            {name: "personalBox", kind: "HFlexBox", flex: 1, components: [
                {kind: "Spacer"},
                {name: "btSearch", kind: "IconButton", icon: "images/search.png", onclick: "openSearch", className: "header-button"},
                {name: "btFont", kind: "IconButton", icon: "images/font.png", onclick: "openFontMenu", className: "header-button"},
                {name: "btStuff", kind: "IconButton", icon: "images/sidebar.png", onclick: "openStuff", className: "header-button"}
            ]},
            {name: "btAction", showing: false, kind: "IconButton", icon: "images/more.png", onclick: "openActionMenu", className: "header-button"},
            {name: "stuffLabel", showing: false, content: $L("Personal"), className: "passage-label", style: "text-align: right;", flex: 1}
        ]},
        {name: "pane", kind: "Pane", transitionKind: "enyo.transitions.Simple", onSelectView: "viewSelected", flex: 1, components: [
            {name: "verseView", kind: "App.VerseView", flex: 1,
                onPrevChapter: "handlePrevChapter",
                onNextChapter: "handleNextChapter",
                onChangeVnumber: "setSelectorVerse",
                onVerseTap: "handleVerseTap",
                onShowNote: "openShowNote",
                onShowFootnote: "openFootnote",
                onShowCrossRef: "openCrossRef",
                onShowStrong: "handleStrong"
            },
            {name: "stuffView", style: "padding: 10px;", kind: "App.Stuff", view: "split",
                onVerse: "handleStuffVerse",
                onNewBm: "getBookmarks",
                onNewNote: "getNotes",
                onPaneBack: "handleStuffBack",
                onCancel: "goBack",
                onSearch: "handleSearch"
            }
        ]}
    ],
    events: {
        onGetModules: "",
        onGetBooknames: "",
        onGetVerses: "",
        onGetVMax: "",
        onGoToMain: "",
        onWelcome: "",
        onSync: "",
        onSplitVerse: "",
        onSearch: "",
        onGetStrong: ""
    },
    published: {
        currentModule: null,
        passage: null,
        verses: [],
        view: "main",
        sync: true,
        background: "default",
        goPrev: false
    },

    btWidth: 0,
    currentCrossRef: false,
    currentStrong: null,

    create: function () {
        this.inherited(arguments);
        this.doGetModules();
        if (enyo.getCookie("background")) {
            this.background = enyo.json.parse(enyo.getCookie("background"));
            this.backgroundChanged();
        }
        //enyo.keyboard.setResizesWindow(false);
    },

    rendered: function () {
        this.inherited(arguments);
        if (this.view === "split") {
            this.$.btHistory.hide();
        } else {
            this.$.fontMenu.hideSync();
        }

        this.$.verseView.setView(this.view);

    },

    /* getPassage: function () {
        return {"passage": this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter() + ":" + this.$.selector.getVerse()};
    },*/

    //STYLE
    backgroundChanged: function () {
        this.addRemoveClass("scroller-background", false);
        this.addRemoveClass("scroller-grayscale", false);
        this.addRemoveClass("scroller-night", false);
        switch (this.background) {
            case "palm":
                this.addClass("");
            break;
            case "default":
                this.addClass("scroller-background");
            break;
            case "grayscale":
                this.addClass("scroller-grayscale");
            break;
            case "night":
                this.addClass("scroller-night");
            break;
        }
    },

    //API Calls and Callbacks

    handleGetModules: function (modules) {
        //enyo.log(modules);
        modules = enyo.json.parse(modules);
        biblez.modules = modules;
        var tmpMods = [];
        if(modules.length !== 0) {
            for (var i=0;i<modules.length;i++) {
                if (modules[i].modType === "Biblical Texts" || modules[i].modType === "Commentaries")
                    tmpMods.push(modules[i]);
            }

            if (tmpMods.length !== 0) {
                if(!this.currentModule)
                    this.currentModule = tmpMods[0];

                this.$.library.setCurrentModule(this.currentModule);
                this.$.library.setModules(tmpMods);
                this.$.btModule.setCaption(this.currentModule.name);
                this.doGetBooknames(this.currentModule.name);
            } else {
                this.doWelcome();
            }
        } else {
            this.doWelcome();
        }

    },

    handleModulesChanged: function (modules) {
        this.$.library.setModules(modules);
    },

    handleGetBooknames: function (bnames) {
        //enyo.log(bnames);
        biblez.bookNames = enyo.json.parse(bnames);
        this.$.selector.setBookNames(biblez.bookNames);
        //enyo.log(typeof enyo.getCookie("passage"));
        if (enyo.getCookie("passage") && enyo.getCookie("passage") !== "null")
            this.$.selector.setCurrentPassage(enyo.json.parse(enyo.getCookie("passage")));
        //this.getVerses();

        //Load Font Settings
        if (enyo.getCookie("font")) {
            biblez.currentFont = enyo.json.parse(enyo.getCookie("font"));
            this.$.fontMenu.setFont(biblez.currentFont);
            this.$.verseView.setFont(biblez.currentFont);
        }
        if (enyo.getCookie("fontSize")) {
            biblez.currentFontSize = enyo.json.parse(enyo.getCookie("fontSize"));
            this.$.fontMenu.setFontSize(biblez.currentFontSize);
            this.$.verseView.setFontSize(biblez.currentFontSize);
        }

        //Go to verseView (app.js)
        this.doGoToMain();
    },

    handleOnVerse: function (inSender, inEvent) {
        if (this.view === "main")
            biblez.highlightVerse = true;
        else
            biblez.highlightSplitVerse = true;
        this.getVerses();
    },

    getVerses: function (passage, verse, single) {
        if (!passage)
            passage = this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter();
        if (verse)
            this.$.selector.setVerse(verse);

        if (this.$.pane.getViewName() === "verseView")
            this.doGetVerses(passage, this.currentModule.name, single);
    },

    getStrong: function (type, value) {
        if (type === "Hebrew") {
            this.doGetStrong(value, "StrongsHebrew");
        } else {
            this.doGetStrong(value, "StrongsGreek");
        }
    },

    handleGetVerses: function (response) {
        //enyo.log(response);
        var tmpVerses = enyo.json.parse(response.split("<#split#>")[0]);
        var tmpPassage = enyo.json.parse(response.split("<#split#>")[1]);
        if (!this.currentCrossRef) {
            this.verses = tmpVerses;
            this.passage = tmpPassage;
            this.$.passageLabel.setContent(this.passage.bookName + " " + this.passage.cnumber);
            this.$.selector.setCurrentPassage(this.passage);
            this.$.verseView.setPrevPassage("< " + this.$.selector.getPrevPassage().passage);
            this.$.verseView.setNextPassage(this.$.selector.getNextPassage().passage + " >");
        }
        if (tmpVerses.length !== 0) {
            if (!this.currentCrossRef) {
                this.$.verseView.setVerses(this.verses, (this.goPrev) ? -1 : this.$.selector.getVerse());
                if (this.view === "split")
                    this.goPrev = false;
                this.getBookmarks();
                this.getHighlights();
                this.getNotes();
                if (this.view === "split")
                    this.$.stuffView.setBookCaption(this.passage.abbrev);
                this.$.stuff.getStuffKind().setBookCaption(this.passage.abbrev);
            } else {
                this.$.noteView.setNote(api.renderVerses(tmpVerses, 1, this.view, true));
                this.$.noteView.setCaption(tmpPassage.passageSingle);
                this.$.noteView.openAt({top: this.currentCrossRef.top, left: this.currentCrossRef.left}, true);
                this.$.noteView.setShowType("footnote");
            }
        } else {
            this.$.verseView.setPlain($L("The chapter is not available in this module! :-("));
            this.$.verseView.setIndex(1);
        }
        if (this.view === "main" && !this.crossRef)
            this.doSync();

        this.currentCrossRef = false;
        this.setHistory();



        //enyo.log(verses);
        //enyo.log(passage);
    },

    getVMax: function () {
        this.doGetVMax(this.$.selector.getBook().name + " " + this.$.selector.getChapter());
        //this.$.swordApi.getVMax();
    },

    handleGetVMax: function (vmax) {
        //enyo.log(vmax);
        this.$.selector.createSection("verses", parseInt(vmax, 10));
        if (this.goPrev)
            this.getVerses(false, parseInt(vmax, 10));
    },

    setSelectorVerse: function(inSender, vnumber) {
        this.$.selector.setVerse(vnumber);
    },

    handlePrevChapter: function (inSender, inEvent) {
        if (this.view === "main")
            biblez.highlightVerse = false;
        else
            biblez.highlightSplitVerse = false;
        var prev = this.$.selector.getPrevPassage();
        //enyo.log(prev);
        if (prev.prevBnumber === 0 && prev.prevChapter === 0) {
            this.$.verseView.setIndex(1);
        } else {
            //this.getVerses(prev.passage);
            this.$.selector.setBook(prev.prevBook);
            this.$.selector.setChapter(prev.prevChapter);
            this.$.selector.setBnumber(prev.prevBnumber);
            this.goPrev = true;
            this.getVMax();

            //this.$.selector.setVerse(1);
        }
    },

    handleNextChapter: function(inSender, inEvent) {
        if (this.view === "main")
            biblez.highlightVerse = false;
        else
            biblez.highlightSplitVerse = false;
        var next = this.$.selector.getNextPassage();
        this.goPrev = false;
        if (next.nextBook !== "" && next.nextChapter !== 0) {
            this.$.selector.setVerse(1);
            this.getVerses(next.passage);
            this.$.selector.setBook(next.nextBook);
            this.$.selector.setChapter(next.nextChapter);
            this.$.selector.setBnumber(next.nextBnumber);

        } else {
            this.$.verseView.setIndex(this.$.verseView.getIndex()-1);
        }
    },

    handleSelectModules: function (inSender, inEvent) {
        //enyo.log(inSender.currentModule);
        this.currentModule = inSender.currentModule;
        this.$.btModule.setCaption(this.currentModule.name);
        //this.getBooknames(enyo.application.currentModule.name);
        this.getVerses();
        this.resizeHandler();
    },

    handleSearch: function (inSender, searchTerm, searchType, searchScope) {
        //enyo.log(searchTerm, searchType, searchScope);
        this.doSearch((this.$.pane.getViewName() === "stuffView") ? "mainModule" : this.currentModule.name, searchTerm, searchType, searchScope, this.view);
    },

    handleSearchResults: function (results, view) {
        if (this.view === "split")
            this.$.stuffView.handleSearchResults(results);
        this.$.stuff.getStuffKind().handleSearchResults(results);
    },

    //POPUPS

    currentModuleChanged: function () {
        this.$.library.setCurrentModule(this.currentModule);
    },

    passageChanged: function () {
        this.$.selector.setCurrentPassage(this.passage);
    },

    openSelector: function (inSender, inEvent) {
        this.$.selector.openAtEvent(inEvent);
        this.$.selector.resizeHandler();
        this.$.selector.openSelector();
    },

    openLibrary: function (inSender, inEvent) {
        this.$.library.openAtEvent(inEvent);
        this.$.library.setSize();
    },

    openStuff: function (inSender, inEvent) {
        if (this.view === "main") {
            this.$.stuff.openAtEvent(inEvent);
            this.$.stuff.setDismissWithClick(true);
        } else {
            this.$.pane.selectViewByName("stuffView");
        }
        if (this.$.btAction.showing)
            this.$.btAction.hide();
    },

    handleStuffVerse: function (inSender, inEvent) {
        //enyo.log(this.$.noteBmSidebar.getPassage());
        if (this.view === "main")
            biblez.highlightVerse = true;
        else
            biblez.highlightSplitVerse = true;

        if (this.$.pane.getViewName() === "stuffView") {
            biblez.highlightVerse = true;
            this.doSplitVerse(inSender.getVerse(), inSender.getPassage());
        } else {
            this.$.selector.setVerse(inSender.getVerse());
            this.getVerses(inSender.getPassage());
        }

    },

    stuffGoBack: function (inSender, inEvent) {
        if (inSender.getCurrentView() === "editView") {
            inSender.goBack();
        }
    },

    openSearch: function (inSender, inEvent) {
        this.$.stuff.getStuffKind().goToSearch();
        this.$.stuff.openAtEvent(inEvent);
        this.$.stuff.setDismissWithClick(true);
    },

    openActionMenu: function (inSender, inEvent) {
        this.$.actionMenu.openAtEvent(inEvent);
    },

    openFontMenu: function (inSender, inEvent) {
        if (inSender.name.search("menuItem") != -1)
            this.$.fontMenu.openAt({top: 20, left: inEvent.x-40}, true);
        else
            this.$.fontMenu.openAtEvent(inEvent);
        this.$.fontMenu.setFontSize(biblez.currentFontSize);
        this.$.fontMenu.setFont(biblez.currentFont);
    },

    changeFontSize: function (inSender, inEvent) {
        if (inSender) {
            biblez.currentFontSize = inSender.getFontSize();
            enyo.setCookie("fontSize", enyo.json.stringify(biblez.currentFontSize));
        }
        this.$.verseView.setFontSize(biblez.currentFontSize);
    },

    changeFont: function (inSender, inEvent) {
        if (inSender) {
            if (inSender.getFont() == "greek") {
                biblez.currentFont = biblez.greekFont;
            } else if (inSender.getFont() == "hebrew") {
                biblez.currentFont = biblez.hebrewFont;
            } else {
                biblez.currentFont = inSender.getFont();
            }
            enyo.setCookie("font", enyo.json.stringify(biblez.currentFont));
        }
        this.$.verseView.setFont(biblez.currentFont);
        //this.$.splitContainer.setFont(this.currentFont);
    },

    changeSync: function (inSender, inSync) {
        this.sync = inSync;
        if (this.sync)
            this.doSync();
    },

    changeScrolling: function (inScrolling) {
        this.$.verseView.changeScrolling(inScrolling);
    },

    openHistoryMenu: function (inSender, inEvent) {
        if (inSender.name.search("menuItem") != -1)
            this.$.historyMenu.openAt({top: 20, left: inEvent.x-40}, true);
        else
            this.$.historyMenu.openAtEvent(inEvent);
    },

    setHistory: function () {
        var history = [];
        if(enyo.getCookie("history")) {
            history = enyo.json.parse(enyo.getCookie("history"));
            if (history.length > 12) {
                history.splice(13,history.length-12);
            }
            for (var l=0;l<history.length;l++) {
                if(history[l].single == this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter() + ":" + this.$.selector.getVerse()) {
                    history.splice(l,1);
                }
            }
        }

        history.unshift({"passage": this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), "single": this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter() + ":" + this.$.selector.getVerse(), "verse" : this.$.selector.getVerse()});
        enyo.setCookie("history", enyo.json.stringify(history));

        var comp = this.getComponents();
        for (var j=0;j<comp.length;j++) {
            if (comp[j].name.search(/historyItem\d+/) != -1) {
                comp[j].destroy();
            }
        }

        var kindName = "";
        for (var i=0;i<history.length;i++) {
            kindName = "historyItem" + i;
            this.$.historyMenu.createComponent({name: kindName, kind: "MenuItem", passage: history[i].passage, verse: history[i].verse, caption: history[i].single, onclick: "handleSelectHistory", className: "module-item"}, {owner: this});
        }
        this.$.historyMenu.render();
    },

    handleSelectHistory: function (inSender, inEvent) {
        this.$.selector.setVerse((inSender.verse) ? inSender.verse : 1);
        this.goPrev = false;
        if (this.view === "main")
            biblez.highlightVerse = true;
        else
            biblez.highlightSplitVerse = true;
        this.getVerses(inSender.passage);
    },

    //VERSE POPUP

    handleVerseTap: function(inSender, inEvent) {
        this.$.versePopup.setTappedVerse(inSender.tappedVerse);
        this.$.versePopup.setVerse(enyo.byId("verse"+inSender.tappedVerse).innerHTML.replace(/<[^>]*>/g, ""));
        this.$.versePopup.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);

        var bmID = (inSender.getView() == "split") ? "bmIconSplit" : "bmIcon";
        var noteID = (inSender.getView() == "split") ? "noteIconSplit" : "noteIcon";

        this.$.versePopup.setBmCaption((enyo.byId(bmID+inSender.tappedVerse).innerHTML !== "") ? $L("Bookmark") + " - " : $L("Bookmark") + " + ");

        this.$.versePopup.setNoteCaption((enyo.byId(noteID+inSender.tappedVerse).innerHTML !== "") ? $L("Note") + " - " : $L("Note") + " + ");
    },

    getBookmarks: function() {
        api.getBookmarks(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.verseView, this.$.verseView.setBookmarks));
        this.$.stuff.getStuffKind().getBookmarks();
        this.$.stuffView.getBookmarks();
    },

    handleGetBookmarks: function (bookmarks) {
        this.$.stuff.getStuffKind().handleBookmarks(bookmarks);
        this.$.stuffView.handleBookmarks(bookmarks);
    },

    handleBookmark: function (inSender, inEvent) {
        this.$.versePopup.close();
        var verseNumber = /*(this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : */this.$.verseView.tappedVerse;
        var bmID = (this.$.verseView.getView() == "split") ? "bmIconSplit" : "bmIcon";
        var id = null;
        if (enyo.byId(bmID+verseNumber).innerHTML !== "") {
            var data = (this.$.verseView.getView() == "split") ? biblez.splitBookmarks : biblez.mainBookmarks;
            enyo.log(enyo.json.stringify(data));
            for (var i=0; i<data.length; i++) {
                if (data[i].vnumber === verseNumber) {
                    id = data[i].id;
                }
            }
            enyo.log("ID:", id);
            if (id !== null)
                api.removeBookmark(id, enyo.bind(this, this.getBookmarks));
            enyo.byId(bmID+enyo.json.stringify(verseNumber)).innerHTML = "";
        } else {
            api.addBookmark(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, "", "", "", enyo.bind(this, this.getBookmarks));
        }
    },

    handleEditBookmark: function (inSender, inEvent) {
        this.$.versePopup.close();
        var verseNumber = /*(this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : */this.$.verseView.tappedVerse;
        var bmID = (this.$.verseView.getView() == "split") ? "bmIconSplit" : "bmIcon";
        var passage = {"bnumber" : this.$.selector.getBnumber(), "cnumber": this.$.selector.getChapter(), "vnumber" : verseNumber};
        if (enyo.byId(bmID+verseNumber).innerHTML !== "") {
            //this.$.noteBmSidebar.setBmMode("edit");
            this.$.stuff.openEdit({name: "itemBm"}, null, passage, {top: 0, left: this.$.verseView.popupLeft});
        } else {
            //this.$.noteBmSidebar.setBmMode("add");
            this.$.stuff.openEdit({name: "itemBm"}, null, passage, {top: 0, left: this.$.verseView.popupLeft});
        }
    },

    getHighlights: function() {
        api.getHighlights(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.verseView, this.$.verseView.setHighlights));
        this.$.stuff.getStuffKind().getHighlights();
        this.$.stuffView.getHighlights();
    },

    handleGetHighlights: function (highlights) {
        this.$.stuff.getStuffKind().handleHighlights(highlights);
        this.$.stuffView.handleHighlights(highlights);
    },

    handleHighlight: function (inSender, inEvent) {
        var verseNumber = /*(this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : */this.$.verseView.tappedVerse;
        var verseID = /*(this.$.mainViewPane.getViewName() == "splitContainer") ? "verseLeft" : */"verse";
        if (enyo.byId(verseID+verseNumber).style.backgroundColor.search("rgba") == -1) {
            api.addHighlight(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, inSender.getColor(), "",enyo.bind(this, this.getHighlights));
        } else {
            api.updateHighlight(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, inSender.getColor(), "",enyo.bind(this, this.getHighlights));
        }
        enyo.byId(verseID+verseNumber).style.backgroundColor = inSender.getColor();
    },

    openShowNote: function (inSender, inEvent) {
        enyo.log("Show Notes...");
        var note = (this.$.verseView.getView() === "main") ? biblez.mainNotes[inSender.tappedNote].note : biblez.splitNotes[inSender.tappedNote].note;
        this.$.noteView.setNote(biblez.mainNotes[inSender.tappedNote].note);
        this.$.noteView.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
        this.$.noteView.setShowType("note");

        /*this.$.notePopup.setCaption("");
        this.$.notePopup.setNote(enyo.application.notes[inSender.tappedNote].note);
        this.$.notePopup.setEditMode();
        this.$.notePopup.setDismissWithClick(true);
        this.$.notePopup.hideCancel();
        this.$.notePopup.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true); */
    },

    handleEditNote: function (inSender, inEvent) {
        this.$.noteView.close();
        var verseNumber = this.$.verseView.tappedVerse;
        var passage = {"bnumber" : this.$.selector.getBnumber(), "cnumber": this.$.selector.getChapter(), "vnumber" : verseNumber};
        //this.$.noteBmSidebar.setBmMode("edit");
        this.$.stuff.openEdit({name: "itemNote", mode: "edit"}, null, passage, {top: 0, left: this.$.verseView.popupLeft});
        //this.$.noteBmSidebar.setPopupFocus("note");
        /*if (enyo.byId(noteID+verseNumber).innerHTML !== "") {

        } else {
            this.$.noteBmSidebar.setBmMode("add");
            this.$.noteBmSidebar.openEditPopup({name: "itemNote"}, null, passage);
        }*/
    },

    getNotes: function() {
        api.getNotes(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.verseView, this.$.verseView.setNotes));
        this.$.stuffView.getNotes();
        this.$.stuff.getStuffKind().getNotes();
    },

    handleGetNotes: function (notes) {
        this.$.stuff.getStuffKind().handleNotes(notes);
        this.$.stuffView.handleNotes(notes);
    },

    handleNote: function () {
        this.$.versePopup.close();
        var verseNumber = this.$.verseView.tappedVerse;
        var passage = {"bnumber" : this.$.selector.getBnumber(), "cnumber": this.$.selector.getChapter(), "vnumber" : verseNumber};
        var noteID = (this.$.verseView.getView() === "split") ? "noteIconSplit" : "noteIcon";
        var id = null;
        if (enyo.byId(noteID+verseNumber).innerHTML !== "") {
            var data = (this.$.verseView.getView() == "split") ? biblez.splitNotes : biblez.mainNotes;
            for (var i=0; i<data.length; i++) {
                if (data[i].vnumber === verseNumber) {
                    id = data[i].id;
                }
            }
            enyo.log("ID:", id);
            if (id !== null)
                api.removeNote(id, enyo.bind(this, this.getNotes));
            enyo.byId(noteID+enyo.json.stringify(verseNumber)).innerHTML = "";
        } else {
            this.$.stuff.openEdit({name: "itemNote"}, null, passage, {top: 0, left: this.$.verseView.popupLeft});
            //this.$.noteBmSidebar.openEditPopup({name: "itemNote"}, null, passage);
            //this.$.noteBmSidebar.setPopupFocus("note");
        }
    },

    handleMouseRelease: function (inSender, inEvent) {
        this.$.stuff.setEditFocus("bookmark");
    },

    openFootnote: function (inSender, inEvent) {
        //enyo.log("Show footnote...");
        this.$.noteView.setNote(inSender.currentFootnote);
        this.$.noteView.setCaption("");
        this.$.noteView.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
        this.$.noteView.setShowType("footnote");
    },

    openCrossRef: function (inSender, crossRef) {
        //enyo.log(crossRef);
        if (crossRef.refList.split(";").length === 1) {
            this.currentCrossRef = {top: inSender.popupTop, left: inSender.popupLeft};
            this.getVerses(crossRef.refList, false, true);
        } else {
            var tmpRefs = crossRef.refList.split(";");
            var comp = this.getComponents();
            for (var j=0;j<comp.length;j++) {
                if (comp[j].name.search(/crossRefItem\d+/) != -1) {
                    comp[j].destroy();
                }
            }

            var kindName = "";
            for (var i=0;i<tmpRefs.length;i++) {
                kindName = "crossRefItem" + i;
                this.$.crossRefMenu.createComponent({name: kindName, kind: "MenuItem", passage: tmpRefs[i], caption: tmpRefs[i].replace(".", " ").replace(".",":"), top: inSender.popupTop, left: inSender.popupLeft, onclick: "handleSelectCrossRef", className: "module-item"}, {owner: this});
            }
            this.$.crossRefMenu.render();
            this.$.crossRefMenu.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
        }
    },

    handleSelectCrossRef: function (inSender, inEvent) {
        //this.$.selector.setVerse(1);
        this.currentCrossRef = {top: inSender.top, left: inSender.left};
        this.getVerses(inSender.passage, false, true);
    },

    handleStrong: function (inSender, id, type, value) {
        //enyo.log(id, type, value);
        this.currentStrong = {type: type, value: value, top: enyo.byId(id).getBoundingClientRect().top, left: enyo.byId(id).getBoundingClientRect().left};
        this.getStrong(type, value);
    },

    handleGetStrong: function (response) {
        //enyo.log(response);
        this.$.noteView.setNote(response.replace(/\\u000a/g, "<br />"));
        this.$.noteView.setCaption(this.currentStrong.type + ": " + this.currentStrong.value);
        this.$.noteView.openAt({top: this.currentStrong.top, left: this.currentStrong.left}, true);
        this.$.noteView.setShowType("footnote");
    },

    //PANE STUFF

    goBack: function () {
        if (this.$.stuffView.getCurrentView() !== "startView")
            this.$.stuffView.goBack();
        else
            this.$.pane.selectViewByName("verseView");

    },

    handleStuffBack: function (inSender, inView, title) {
        this.$.stuffLabel.setContent(title);
        if (inView === "startView") {
            this.$.btBack.setCaption($L("Verse View"));
        } else {
            this.$.btBack.setCaption($L("Back"));
        }
    },

    viewSelected: function (inSender, inView, inPreviousView) {
        if (inView.name === "stuffView") {
            this.$.verseBox.hide();
            this.$.passageBox.hide();
            this.$.personalBox.hide();
            this.$.btBack.show();
            this.$.stuffLabel.show();
        } else if (inView.name === "verseView") {
            this.$.verseBox.show();
            this.$.passageBox.show();
            this.$.personalBox.show();
            this.$.btBack.hide();
            this.$.stuffLabel.hide();
            this.resizeHandler();
            this.getVerses();
        }
    },

    hidePassageLabel: function () {
        //enyo.log(this.$.btModule.hasNode().clientWidth + this.$.btGo.hasNode().clientWidth + this.$.btHistory.hasNode().clientWidth + this.$.btBack.hasNode().clientWidth + 20, ":", this.$.headerMain.hasNode().clientWidth/3);
        if (this.$.btModule.hasNode().clientWidth + this.$.btGo.hasNode().clientWidth + this.$.btHistory.hasNode().clientWidth + this.$.btBack.hasNode().clientWidth + 20 > this.$.headerMain.hasNode().clientWidth/3-20 || this.$.btSearch.hasNode().clientWidth + this.$.btFont.hasNode().clientWidth + this.$.btStuff.hasNode().clientWidth + 20 > this.$.headerMain.hasNode().clientWidth/3-20)
            this.$.passageBox.hide();
        else if (this.$.pane.getViewName() !== "stuffView")
            this.$.passageBox.show();
    },

    resizeHandler: function (resizeVerseView) {
        this.inherited(arguments);

        //if (this.view === "split")
            //enyo.log(this.$.btGo.hasNode().clientWidth + this.$.btHistory.hasNode().clientWidth + this.$.btBack.hasNode().clientWidth + this.$.btSearch.hasNode().clientWidth + this.$.btFont.hasNode().clientWidth + this.$.btStuff.hasNode().clientWidth , this.$.headerMain.hasNode().clientWidth - this.$.btModule.hasNode().clientWidth, this.btWidth);
        if (this.$.pane.getViewName() !== "stuffView") {
            if (this.$.btGo.hasNode().clientWidth + this.$.btHistory.hasNode().clientWidth + this.$.btBack.hasNode().clientWidth + this.$.btSearch.hasNode().clientWidth + this.$.btFont.hasNode().clientWidth + this.$.btStuff.hasNode().clientWidth > this.$.headerMain.hasNode().clientWidth - this.$.btModule.hasNode().clientWidth - 120 || this.btWidth > this.$.headerMain.hasNode().clientWidth - this.$.btModule.hasNode().clientWidth - 120) {
                this.btWidth = (this.$.btGo.hasNode().clientWidth + this.$.btHistory.hasNode().clientWidth + this.$.btBack.hasNode().clientWidth + this.$.btSearch.hasNode().clientWidth + this.$.btFont.hasNode().clientWidth + this.$.btStuff.hasNode().clientWidth !== 0) ? this.$.btGo.hasNode().clientWidth + this.$.btHistory.hasNode().clientWidth + this.$.btBack.hasNode().clientWidth + this.$.btSearch.hasNode().clientWidth + this.$.btFont.hasNode().clientWidth + this.$.btStuff.hasNode().clientWidth : this.btWidth;
                this.$.personalBox.hide();
                this.$.btGo.hide();
                this.$.btHistory.hide();
                this.$.btAction.show();
            } else if (this.btWidth < this.$.headerMain.hasNode().clientWidth - this.$.btModule.hasNode().clientWidth - 120 && this.$.pane.getViewName() !== "stuffView") {
                this.$.personalBox.show();
                this.$.btGo.show();
                this.$.btHistory.show();
                this.$.btAction.hide();
            }
        }

        this.hidePassageLabel();

        if (resizeVerseView) {
            this.$.verseView.setSnappers(null, true);
        }
    },

    //UNLOAD
    saveSettings: function () {
        //enyo.setCookie("passage", enyo.json.stringify(this.$.selector.getBook().name + " " + this.$.selector.getChapter()));
    }

});