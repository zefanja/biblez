enyo.kind({
    name: "App.Selector",
    lazy: false,
    kind: enyo.Popup,
    height: "700px",
    //className: "biblez-popup",
    weight: "310px",
    contentHeight:"100%",
    published: {
        bookNames: [],
        book: {"name": "Matthew", "abbrev": "Matt"},
        bnumber: 39,
        chapter: 1,
        verse: 1
    },
    events: {
        onChapter: "",
        onVerse: ""
    },
    components: [
        {kind: "VFlexBox", width: "310px", height: "100%", components: [
            {kind: "RadioGroup", onChange: "radioButtonSelected", components: [
                {name: "rgBook", caption: "", onclick: "changeSnapper"},
                {name: "rgChapter", caption: "", onclick: "changeSnapper"},
                {name: "rgVerse", caption: "", onclick: "changeSnapper"}
            ]},
            {name: "selectorSnapper", kind: "SnapScroller", flex: 1, onSnap: "setRadioButton", autoVertical: false, vertical: false, components: [
                {name: "bookScroller", kind: "Scroller", className: "selector-scroller", components: [
                    {name: "bookSelector"}
                ]},
                {name: "chapterScroller", kind: "Scroller", autoVertical: true, className: "selector-scroller", components: [
                    {name: "chapterSelector", content: $L("Select a book!"), className: "hint"}
                ]},
                {name: "verseScroller", kind: "Scroller", autoVertical: true, className: "selector-scroller", components: [
                    {name: "verseSelector", content: $L("Select a chapter!"), className: "hint"}
                ]}
            ]}
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        this.$.rgBook.setCaption(this.book.abbrev);
        this.$.rgChapter.setCaption(this.chapter);
        this.$.rgVerse.setCaption(this.verse);

        //this.createBooks();
    },

    createBooks: function () {
        for (var i=0;i<66;i++) {
            this.$.bookSelector.createComponent({content: i+1, className: "selector-button", onclick: "handleBooks"}).render();
        }
    },

    resizeHandler: function () {
        if (this.$.selectorSnapper.node) {
            var height = this.$.selectorSnapper.node.clientHeight;
            this.$.bookScroller.addStyles("height: " + height + "px;");
        }
    },

    getNextPassage: function () {
        var nextBook = "";
        var nextChapter = 0;
        var nextBnumber = this.bnumber;
        var passage = "";
        if (this.bnumber !== 65) {
            if (parseInt(this.chapter, 10) < parseInt(this.bookNames[this.bnumber].cmax, 10)) {
                nextChapter = parseInt(this.chapter, 10) + 1;
                nextBook = this.bookNames[this.bnumber];
            } else {
                nextChapter = 1;
                nextBook = this.bookNames[this.bnumber+1];
                nextBnumber = this.bnumber+1;
            }
        } else {
            if (parseInt(this.chapter, 10) < parseInt(this.bookNames[this.bnumber].cmax, 10)) {
                nextChapter = parseInt(this.chapter, 10) + 1;
                nextBook = this.bookNames[this.bnumber];
            }
        }
        //enyo.log(this.bnumber, this.chapter, nextChapter, nextBook);
        passage = (nextBook !== "" && nextChapter !== 0) ? nextBook.abbrev + " " + nextChapter : "End of Bible =)";
        return {"passage": passage, "nextChapter": nextChapter, "nextBook": nextBook, "nextBnumber": nextBnumber};
    },

    getPrevPassage: function () {
        var prevBook = "";
        var prevChapter = 0;
        var passage = "";
        var prevBnumber = this.bnumber;
        if (this.bnumber !== 0) {
            if (parseInt(this.chapter, 10) > 1) {
                prevChapter = parseInt(this.chapter, 10) - 1;
                prevBook = this.bookNames[this.bnumber];
            } else {
                prevChapter = this.bookNames[this.bnumber-1].cmax;
                prevBook = this.bookNames[this.bnumber-1];
                prevBnumber = this.bnumber-1;
            }
        } else {
            if (parseInt(this.chapter, 10) > 1) {
                prevChapter = parseInt(this.chapter, 10) - 1;
                prevBook = this.bookNames[this.bnumber];
            }
        }
        passage = (prevBook !== "" && prevChapter !== 0) ? prevBook.abbrev + " " + prevChapter : "Beginning of Bible =)";
        return {"passage": passage, "prevChapter": prevChapter, "prevBook": prevBook, "prevBnumber": prevBnumber};
    },

    setCurrentPassage: function(passage) {
        //enyo.log(passage, passage.cnumber);
        if(passage) {
            var book = passage.bookName;
            this.chapter = parseInt(passage.cnumber, 10);
            this.verse = (parseInt(passage.vnumber, 10) != 1) ? parseInt(passage.vnumber, 10) : this.verse;
            for (var i=0;i<this.bookNames.length;i++) {
                if (this.bookNames[i].name == book || this.bookNames[i].abbrev == book) {
                    this.book = this.bookNames[i];
                    this.bnumber = i;
                }
            }
        }
        //enyo.log(enyo.json.stringify(this.book));
    },

    setRadioButton: function(inSender, inEvent) {
        //console.log(this.$.selectorSnapper.index);
        switch (this.$.selectorSnapper.index) {
            case 0:
                this.$.rgBook.setDepressed(true);
                this.$.rgChapter.setDepressed(false);
                this.$.rgVerse.setDepressed(false);
            break;
            case 1:
                this.$.rgBook.setDepressed(false);
                this.$.rgChapter.setDepressed(true);
                this.$.rgVerse.setDepressed(false);
            break;
            case 2:
                this.$.rgBook.setDepressed(false);
                this.$.rgChapter.setDepressed(false);
                this.$.rgVerse.setDepressed(true);
            break;
        }
    },

    changeSnapper: function (inSender, inEvent) {
        switch (inSender.name) {
            case "rgBook":
                this.$.selectorSnapper.snapTo(0);
            break;
            case "rgChapter":
                this.$.selectorSnapper.snapTo(1);
            break;
            case "rgVerse":
                this.$.selectorSnapper.snapTo(2);
            break;
        }
    },

    bookNamesChanged: function () {
        this.createSection("books", this.bookNames);
    },

    createSection: function (section, data) {
        var kindName = "";
        var comp = this.getComponents();
        switch (section) {
            case "books":
                for (var j=0;j<comp.length;j++) {
                    if (comp[j].name.search(/book\d+/) != -1) {
                        comp[j].destroy();
                    }
                }
                //this.$.bookSelector.createComponent({name: "book1000", kind: "Divider", caption: "Old Testament"}, {owner: this});
                for (var i=0;i<data.length;i++) {
                    kindName = "book" + i;
                    if (i<5) {
                        //this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-tora",
                            name: kindName,
                            key: i}, {owner: this});
                    } else if (i<17) {
                        //this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-historical",
                            name: kindName,
                            key: i}, {owner: this});
                    } else if (i<22) {
                        //this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-wisdom",
                            name: kindName,
                            key: i}, {owner: this});
                    } else if (i<39) {
                        //this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-prophet",
                            name: kindName,
                            key: i}, {owner: this});
                    } else if (i<43) {
                        //this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-gospel",
                            name: kindName,
                            key: i}, {owner: this});
                    } else if (i === 43) {
                        //this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-act",
                            name: kindName,
                            key: i}, {owner: this});
                    } else if (i<57) {
                        //this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-paul",
                            name: kindName,
                            key: i}, {owner: this});
                    } else if (i<65) {
                        //this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-other",
                            name: kindName,
                            key: i}, {owner: this});
                    } else {
                        this.$.bookSelector.createComponent({kind: "Button",
                            caption: data[i].abbrev.slice(0,5),
                            onclick: "handleBooks",
                            onmousehold: "handleVerses",
                            className: "book-selector books-rev",
                            name: kindName,
                            key: i}, {owner: this});
                    }
                }
                this.$.bookSelector.render();
            break;
            case "chapters":
                for (var k=0;k<comp.length;k++) {
                    if (comp[k].name.search(/chapter\d+/) != -1) {
                        comp[k].destroy();
                    }
                }
                for (var l=0;l<data;l++) {
                    kindName = "chapter" + l;
                    this.$.chapterSelector.createComponent({name: kindName, kind: "Button", caption: l+1, onclick: "handleChapters", onmousehold: "handleVerses", className: "book-selector", book: this.book.name, chapter: l+1}, {owner: this});
                }
                this.$.chapterSelector.render();
            break;
            case "verses":
                for (var m=0;m<comp.length;m++) {
                    if (comp[m].name.search(/verse\d+/) != -1) {
                        comp[m].destroy();
                    }
                }
                for (var n=0;n<data;n++) {
                    kindName = "verse" + n;
                    this.$.verseSelector.createComponent({name: kindName, kind: "Button", caption: n+1, onclick: "handleVerses", className: "book-selector", verse: n+1}, {owner: this});
                }
                this.$.verseSelector.render();
            break;
        }
    },

    openSelector: function () {
        this.$.selectorSnapper.setIndex(0);

        //Set RadioButtons
        this.$.rgBook.setDepressed(true);
        this.$.rgChapter.setDepressed(false);
        this.$.rgVerse.setDepressed(false);
        //enyo.log(this.book, this.chapter, this.verse);
        this.$.rgBook.setCaption(this.book.abbrev);
        this.$.rgChapter.setCaption(this.chapter);
        this.createSection("chapters", parseInt(this.book.cmax, 10));
    },

    handleBooks: function (inSender, inEvent) {
        this.book = this.bookNames[inSender.key];
        this.bnumber = inSender.key;
        this.chapter = 1;
        this.verse = 1;
        this.$.rgBook.setCaption(this.book.abbrev);
        this.$.rgChapter.setCaption(this.chapter);
        this.$.rgVerse.setCaption(this.verse);
        this.$.selectorSnapper.next();
        this.$.chapterScroller.scrollTo(0,0);
        this.createSection("chapters", parseInt(this.bookNames[inSender.key].cmax, 10));
    },

    handleChapters: function (inSender, inEvent) {
        this.chapter = (inSender.chapter) ? inSender.chapter : this.chapter;
        this.$.rgChapter.setCaption(this.chapter);
        this.doChapter();
        this.$.verseScroller.scrollTo(0,0);
        this.$.selectorSnapper.next();
    },

    handleVerses: function (inSender, inEvent) {
        //enyo.log(inEvent.type);
        this.verse = (inSender.verse) ? inSender.verse : 1;
        if (inEvent.type == "mousehold" && inSender.chapter)
            this.chapter = inSender.chapter;
        else if (inEvent.type == "mousehold" && !inSender.chapter)
            this.chapter = 1;

        if (inSender.key) {
            this.book = this.bookNames[inSender.key];
            this.bnumber = inSender.key;
        }
        this.$.rgBook.setCaption(this.book.abbrev);
        this.$.rgChapter.setCaption(this.chapter);
        this.$.rgVerse.setCaption(this.verse);
        this.doVerse();
        this.close();
    }
});

enyo.kind({
    name: "App.Library",
    lazy: false,
    kind: "Popup",
    height: "110px",
    //style: "max-width: 320px; max-height: 700px",
    published: {
        modules: [],
        currentModule: null
    },
    events: {
        onSelectModule: ""
    },
    components: [
        {kind: "VFlexBox", width: "320px", className: "popup-scroller-container", height: "100%", components: [
            {name: "scroller", kind: "Scroller", className: "popup-scroller", flex: 1, components: [
                {name: "moduleList", kind: "VirtualRepeater", onSetupRow: "getModuleListItem", components: [
                    {name: "itemModule", kind: "Item", layoutKind: "VFlexLayout", tapHighlight: true, className: "list-item", components: [
                        {name: "moduleName", className: "list-title"},
                        {name: "moduleDescr", className: "list-subtitle"}

                    ],
                    onclick: "selectModule"
                    }]
                },
                {name: "moduleHint", showing: false, className: "hint"}
            ]}
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        //this.setModules();
    },

    getModuleListItem: function(inSender, inIndex) {
        var r = this.modules[inIndex];
        if (r) {
            //console.log(r + " - " + this.tmpLang);
            this.$.moduleDescr.setContent(r.descr); // + "(" + r.modType + ")");
            this.$.moduleName.setContent(r.name);

            var isRowSelected = (this.currentModule && r.name == this.currentModule.name) ? true : false;
            this.$.itemModule.applyStyle("background", isRowSelected ? "#9dc5e5" : null);
            return true;
        } else {
            return false;
        }
    },

    setModules: function (modules) {
        this.modules = modules;
        this.$.moduleList.render();
    },

    selectModule: function (inSender, inEvent, rowIndex) {
        //enyo.log(this.modules[rowIndex]);
        this.currentModule = this.modules[rowIndex];
        //enyo.setCookie("currentModule", enyo.json.stringify(this.modules[rowIndex]));
        this.doSelectModule();
        this.$.moduleList.render();
        this.close();
    },

    setSize: function () {
        //enyo.log(this.$.scroller, window.innerHeight);
        if (this.$.scroller.node) {
            var height = (this.$.scroller.node.scrollHeight + 48 < window.innerHeight - 48) ? this.$.scroller.node.scrollHeight + 48 : window.innerHeight - 48;
            this.addStyles("height: " + height + "px;");
        }
    },

    resizeHandler: function () {
        this.setSize();
    }
});