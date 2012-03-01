enyo.kind({
    name: "App.ModuleMenu",
    kind: "Menu",
    defaultKind: "MenuCheckItem",

    setItems: function(items) {
      this.destroyComponents();
      this.render();

      //this.lazy = true;
      this.components = items;
   }
});

enyo.kind({
    name: "App.Start",
    kind: "VFlexBox",
    pack: "center",
    align: "center",
    className: "scroller-background",
    components: [
        {content: $L("Starting BibleZ HD Pro..."), className: "start-label"}
    ]
});

enyo.kind({
    name: "App.Welcome",
    kind: "VFlexBox",
    pack: "center",
    align: "center",
    className: "scroller-background",
    components: [
        {content: $L("Thank you for installing BibleZ Pro HD. Currently there are no modules installed. Please open the Module Manager and add at least one module!"), className: "start-label"}
    ]
});

enyo.kind({
    name: "App.AddNote",
    kind: "VFlexBox",
    height: "100%",
    events: {
      onEditData: "",
      onCancel: ""
    },
    published: {
        title: "",
        folder: "",
        tags: "",
        note: "",
        editType: "note"
    },
    components: [
        {name: "folderMenu", kind: "Menu", lazy: false},
        //{name: "popupTitle", content: $L("Edit Bookmark"), className: "popup-edit-title"},
        {name: "scroller", kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
            {name: "titleInput", kind: "Input", hint: "", alwaysLooksFocused: false, components: [
                {content: $L("Title"), className: "popup-label"}
            ]},
            {kind: "HFlexBox", components: [
                {name: "folderInput", flex: 10, alwaysLooksFocused: false, hint: "", kind: "Input", components: [
                    {content: $L("Folder"), className: "popup-label"}
                ]},
                {kind: "IconButton", flex: 1, icon: "images/folder.png", onclick: "openFolders"}

            ]},
            {name: "noteInput", kind: "RichText", style: "min-height: 80px;", alwaysLooksFocused: true, hint: $L("Add your note here."), showing: true},
            {name: "tagsInput", kind: "Input", alwaysLooksFocused: false, hint: "", components: [
                {content: $L("Tags"), className: "popup-label"}
            ]}
        ]},
        {layoutKind: "HFlexLayout", style: "margin-top: 10px;", components: [
            {name: "btCancel", kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "doCancel"},
            {name: "btAdd", kind: "Button", caption: $L("Edit"), flex: 1, onclick: "doEditData", className: "enyo-button-affirmative"}
        ]}
    ],

    noteHeight: 0,

    editTypeChanged: function (inSender, inEvent) {
        if (this.editType == "bookmark") {
            this.$.noteInput.hide();
        } else {
            this.$.noteInput.show();
        }
    },

    setFocus: function () {
        this.$.titleInput.forceFocusEnableKeyboard();
    },

    setNoteFocus: function () {
        this.$.noteInput.forceFocusEnableKeyboard();
    },

    setCaption: function (caption) {
        this.$.popupTitle.setContent(caption);
    },

    setBtCaption: function (caption) {
        this.$.btAdd.setCaption(caption);
    },

    setData: function (title, folder, tags, note) {
        var tmpTitle = (title) ? title : "";
        var tmpFolder = (folder) ? folder : "";
        var tmpTags = (tags) ? tags : "";
        var tmpNote = (note) ? note : "";
        this.$.titleInput.setValue(tmpTitle);
        this.$.folderInput.setValue(tmpFolder);
        this.$.tagsInput.setValue(tmpTags);
        this.$.noteInput.setValue(tmpNote);
    },

    getData: function () {
        return {"title": this.$.titleInput.getValue(), "folder": this.$.folderInput.getValue(), "tags": this.$.tagsInput.getValue(), "note": this.$.noteInput.getValue()};
    },

    handleFolders: function (folders) {
        //enyo.log(folders);
        var comp = this.getComponents();
        for (var j=0;j<comp.length;j++) {
            if (comp[j].name.search(/folderItem\d+/) != -1) {
                comp[j].destroy();
            }
        }
        var kindName = "";
        for (var i=0;i<folders.length;i++) {
            kindName = "folderItem" + i;
            this.$.folderMenu.createComponent({name: kindName, kind: "MenuItem", folder: folders[i], caption: folders[i], onclick: "handleSelectFolder", className: "module-item"}, {owner: this});
        }
        this.$.folderMenu.render();
    },

    handleSelectFolder: function (inSender, inEvent) {
        this.$.folderInput.setValue(inSender.folder);
    },

    openFolders: function (inSender, inEvent) {
        this.$.folderMenu.openAtEvent(inEvent);
    },

    resizeHandler: function () {
        this.inherited(arguments);
        //enyo.log("resized NoteWidget");
        this.noteHeight = this.node.clientHeight - 196;
        if (this.editType !== "bookmark" && this.noteHeight > 40) {
            //enyo.log("should resize", this.noteHeight);
            this.$.noteInput.addStyles("min-height: " + this.noteHeight + "px;");
        }
    }
});

