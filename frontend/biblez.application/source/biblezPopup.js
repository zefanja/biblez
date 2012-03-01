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

//START SPAZ LICENSE

/*Copyright (c) 2007-2011, Edward Finkler, Funkatron Productions

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following
disclaimer in the documentation and/or other materials provided
with the distribution.

Neither the name of Edward Finkler, Funkatron Productions nor
the names of its contributors may be used to endorse or promote
products derived from this software without specific prior written
permission. */

enyo.kind({
    name: "BibleZ.Popup",
    kind: "Popup",
    fixPositionY: true, // set this to false to get normal repositioning behavior
    current_y: null,
    openAtTopCenter:function() {
        this.setBoundsInfo("applyHalfCenterBounds", arguments);
        this.open();
    },
    'applyHalfCenterBounds':function(x_only) {
        this.applyBounds(this.calcHalfCenterPosition(x_only));
    },
    calcHalfCenterPosition: function(x_only) {
        var s = this.calcSize();
        var vp = this.calcViewport();
        var o = {
            left: Math.max(0, (vp.width - s.width) / 2),
            top: Math.max(0, ((vp.height - s.height) / 2) / 8) // dividing by 8 to get the popup close to top
        };

        if (this.fixPositionY && this.showing && x_only && this.current_y !== null) {
            o.top = this.current_y;
        } else {
            this.current_y = o.top;
        }

        return o;
    },
    resizeHandler: function() {
        if (this.isOpen) {
            var args = arguments;
            // FIXME: Wait a beat to resize. We need to do this to dismiss correctly via a click
            // when the device keyboard hides as the result of the click.
            // This is because the keyboard hides on mouse up and if it is in resize window mode, the
            // window resizes, prompting this resize handler to be called. Resizing a popup can result
            // in it moving position and this can move the button the user clicked on at mouseup time.
            // Moving a button underneath the mouse at mouse up time can prevent a click from firing.
            // Avoid this issue by deferring resize slightly; we only need the space between mouseup and click.
            enyo.asyncMethod(this, function() {
                this.applyBoundsInfo('x_only');
            });
        }
    },
    applyBoundsInfo: function(x_only) {
        x_only = !!x_only;
        var bi = this.boundsInfo;
        if (bi) {
            bi.args = [x_only];
            this.clearSizeCache();
            this.clearClampedSize();
            this[bi.method].apply(this, bi.args);
        }
    },
    clearClampedSize: function() {
        var s = this.getContentControl();
        if (this._clampedWidth) {
            s.applyStyle("max-width", null);
        }
        if (this._clampedHeight) {
            s.applyStyle("max-height", null);
        }
        this._clampedHeight = this._clampedWidth = false;
    }
});

//END SPAZ LICENSE

enyo.kind({
    name: "BibleZ.VersePopup",
    scrim: false,
    kind: "Popup",
    lazy: false,
    /*showHideMode: "transition",
    openClassName: "fadeIn",
    className: "fadedOut", */
    events: {
      onNote: "",
      onBookmark: "",
      onEditBookmark: "",
      onHighlight: "",
      onRelease: ""
    },
    published: {
		color: "",
        tappedVerse: 0,
        verse: ""
	},
    components:[
        {kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
        {kind: "VFlexBox", flex: 1, components: [
            {kind: "HFlexBox", components: [
                {name: "bmCaption", flex: 1, className: "verse-popup-top-left", content: $L("Bookmark") + " + ", onclick: "addRmBookmark", onmousehold: "showBmOptions", onmouseout: "doRelease", hold: false},
                {name: "noteCaption", flex: 1, className: "verse-popup-top-right", content: $L("Note") + " + ", onclick: "doNote"}
            ]},
            {kind: "HFlexBox", components: [
                {name: "hlCaption", flex: 1, className: "verse-popup-bottom-left", content: $L("Highlight"), onclick: "openColors"},
                {name: "csCaption", flex: 1, className: "verse-popup-bottom-right", content: $L("Copy & Share"), onclick: "openCopy"}
            ]},
            {name: "colorSelector", kind: "HFlexBox", className: "color-selector", components: [
                {kind: "Button", caption: " ", flex: 1, onclick: "highlightVerse", className: "color-button", color: "rgba(255,99,71,0.5)", style: "background-color: red;"},
                {kind: "Button", caption: " ", flex: 1, onclick: "highlightVerse", className: "color-button", color: "rgba(135,206,250,0.5)", style: "background-color: blue;"},
                {kind: "Button", caption: " ", flex: 1, onclick: "highlightVerse", className: "color-button", color: "rgba(255,255,0,0.5)", style: "background-color: yellow;"},
                {kind: "Button", caption: " ", flex: 1, onclick: "highlightVerse", className: "color-button", color: "rgba(152,251,152,0.5)", style: "background-color: green;"},
                {kind: "Button", caption: " ", flex: 1, onclick: "highlightVerse", className: "color-button", color: "rgba(238,130,238,0.5)", style: "background-color: violet;"},
                {kind: "Button", caption: " ", flex: 1, onclick: "highlightVerse", className: "color-button", color: "rgba(255,165,0,0.5)", style: "background-color: orange;"}
            ]},
            {name: "csSelector", kind: "HFlexBox", className: "color-selector", components: [
                {kind: "Button", caption: $L("Copy"), flex: 1, onclick: "copyVerse"},
                {kind: "Button", caption: $L("eMail"), flex: 1, onclick: "sendEmail"},
                {kind: "Button", caption: $L("SMS"), flex: 1, onclick: "sendSMS"}
            ]}
        ]}
    ],

    setBmCaption: function (caption) {
        this.$.bmCaption.setContent(caption);
    },

    setNoteCaption: function (caption) {
        this.$.noteCaption.setContent(caption);
    },

    setHlCaption: function (caption) {
        this.$.hlCaption.setContent(caption);
    },

    open: function () {
        this.inherited(arguments);
        this.$.colorSelector.hide();
        this.$.csSelector.hide();
        //this.hasNode().style.top = this.hasNode().getBoundingClientRect().top -100 + "px";
    },

    close: function () {
        this.inherited(arguments);
        this.$.colorSelector.show();
        this.$.csSelector.hide();
    },

    openColors: function (inSender, inEvent) {
        this.$.colorSelector.show();
        this.$.csSelector.hide();
    },

    highlightVerse: function (inSender, inEvent) {
        //enyo.log(inSender.color);
        this.color = inSender.color;
        this.doHighlight();
        this.close();
    },

    openCopy: function (inSender, inEvent) {
        this.$.colorSelector.hide();
        this.$.csSelector.show();
    },

    copyVerse: function (inSender, inEvent) {
        //enyo.log(this.tappedVerse, this.verse);
        enyo.dom.setClipboard(this.verse);
        enyo.windows.addBannerMessage($L("Copied Verse to Clipboard"), enyo.json.stringify({}));
    },

    sendEmail: function (inSender, inEvent) {
        this.$.palmService.call({
            id: 'com.palm.app.email',
            params: {
                text: this.verse
            }
        });
    },

    sendSMS: function (inSender, inEvent) {
       this.$.palmService.call({
            id: 'com.palm.app.messaging',
            params: {
                messageText: this.verse
            }
        });
    },

    addRmBookmark: function (inSender, inEvent) {
        if (!inSender.hold) {
            this.doBookmark();
        }
        inSender.hold = false;
    },

    showBmOptions: function (inSender, inEvent) {
        this.doEditBookmark();
        inSender.hold = true;
    },

    closePopup: function() {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.AddNote",
    kind: "ModalDialog",
    layoutKind:"VFlexLayout",
    lazy: false,
    scrim: false,
    events: {
      onAddNote: "",
      onEditNote: ""
    },
    published: {
		edit: false
	},
    caption: $L("Add A Note"),
    components:[
        //{kind: "Scroller", style: "max-height: 300px; min-height: 50px;", components: [
            {name: "noteInput", kind: "RichText", className: "note-input", hint: $L("Add your note here."), changeOnInput: true, onfocus: "openCenter", onchange: "toggleButton"},
        //]},
        {layoutKind: "HFlexLayout", style: "margin-top: 10px;", components: [
            {name: "btCancel", kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "closePopup"},
            {name: "btAdd", kind: "Button", caption: $L("Add"), flex: 1, onclick: "addNote", className: "enyo-button-affirmative"}
        ]}

    ],

    getNote: function () {
        return this.$.noteInput.getHtml();
    },

    setFocus: function () {
        this.$.noteInput.forceFocusEnableKeyboard();
    },

	toggleButton: function (inSender, inEvent) {
		//enyo.log("INPUT:", inSender.getValue());
		if (inSender.getValue() === "") {
			this.$.btAdd.setDisabled(true);
		} else {
			this.$.btAdd.setDisabled(false);
		}
	},

    clearInput: function () {
        this.dismissWithClick = false;
        this.$.noteInput.setValue("");
		this.$.btAdd.show();
        this.$.btAdd.setCaption($L("Add"));
		this.$.btAdd.setDisabled(true);
        this.edit = false;
        this.setFocus();
    },

    setNote: function(noteText) {
        this.$.btAdd.hide();
        this.$.noteInput.setValue(noteText.replace(/"/g,""));
    },

    addNote: function (inSender, inEvent) {
        console.log(this.$.noteInput.getValue());
        this.doAddNote();
        this.closePopup();
    },

    setEditMode: function () {
        this.edit = true;
    },

    showEditBt: function () {
        if (this.edit === true) {
            this.$.btAdd.setCaption($L("Edit"));
            this.$.btAdd.show();
        }
    },

	hideCancel: function () {
		this.$.btCancel.hide();
	},

    openCenter: function() {
        //this.dismissWithClick = false;
		//this.$.btCancel.show();
        //this.close()
        //this.openAtCenter();
        //this.showEditBt();
        this.doEditNote();
        this.close();
    },

    closePopup: function () {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.ShowNote",
    kind: "Popup",
    //caption: "",
    lazy: false,
    published: {
        showType: "note"
    },
    events: {
        onNoteTap: ""
    },
    components:[
        {kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
            {name: "noteContent", allowHtml: true, content: "", className: "popup-note", onclick: "handleNoteTap"}
        ]}
        //{kind: "Button", caption: $L("OK"), onclick: "closePopup", style: "margin-top:10px"}
    ],

    setNote: function (note) {
        this.$.noteContent.setContent(note.replace(/"/g,""));
    },

    handleNoteTap: function (inSender, inEvent) {
        if (this.showType == "note") {
            this.doNoteTap();
        }
    },

    closePopup: function() {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.FontMenu",
    kind: "Popup",
    lazy: false,
    events: {
      onFontSize: "",
      onFont: ""
    },
    published: {
		fontSize: 20,
        font: "Prelude"
	},
    components:[
        {kind: "VFlexBox", components: [
            {kind: "HFlexBox", components: [
                //{content: $L("Font Size"), flex: 1, className: "font-menu"},
                {name: "fontSlider", kind: "Slider", flex: 1, minimum: 12, maximum: 30, snap: 1, onChanging: "sliderChanging", onChange: "sliderChange", className: "font-slider"}
            ]},
            {kind: "HFlexBox", components: [
                //{content: $L("Font"), flex: 1, className: "font-menu"},
                {name: "fontSelector", kind: "ListSelector", flex: 1, value: "Prelude", onChange: "fontChanged", className: "font-slider", items: [
                    {caption: "Prelude", value: "Prelude"},
                    {caption: "Verdana", value: "Verdana"},
                    {caption: "Arial", value: "Arial"},
                    {caption: "Georgia", value: "Georgia"},
                    {caption: "Times", value: "Times"},
                    {caption: $L("Greek"), value: "greek"},
                    {caption: $L("Hebrew"), value: "hebrew"}

                ]}
            ]}
        ]}
    ],

    sliderChange: function (inSender, inEvent) {
        //enyo.log(inSender.position);
        this.fontSize = inSender.position;
        this.doFontSize();
    },

    setFontSize: function (size) {
        if (size) {
            this.$.fontSlider.setPosition(size);
        } else {
            this.$.fontSlider.setPosition(20);
        }
    },

    setFont: function (font) {
        if (font) {
            if (font == biblez.hebrewFont) {
                this.$.fontSelector.setValue("hebrew");
            } else if (font == biblez.greekFont) {
                this.$.fontSelector.setValue("greek");
            } else {
                this.$.fontSelector.setValue(font);
            }
        } else {
            this.$.fontSelector.setValue("Prelude");
        }
    },

    fontChanged: function(inSender, inValue, inOldValue) {
        this.font = inValue;
        this.doFont();
    }
});

enyo.kind({
    name: "BibleZ.EditBookmark",
    kind: "BibleZ.Popup",
    layoutKind:"VFlexLayout",
    lazy: false,
    scrim: true,
    dismissWithClick: false,
    events: {
      onEditData: ""
    },
    published: {
        title: "",
        folder: "",
        tags: "",
        note: "",
        editType: "bookmark"
    },
    //caption: $L("Edit Bookmark"),
    components:[
        {name: "folderMenu", kind: "Menu", lazy: false},
        {name: "popupTitle", content: $L("Edit Bookmark"), className: "popup-edit-title"},
        {kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
            {name: "titleInput", kind: "Input", hint: "", components: [
                {content: $L("Title"), className: "popup-label"}
            ]},
            {name: "noteInput", kind: "RichText", hint: $L("Add your note here."), showing: false},
            {kind: "HFlexBox", components: [
                {name: "folderInput", flex: 10, hint: "", kind: "Input", components: [
                    {content: $L("Folder"), className: "popup-label"}
                ]},
                {kind: "IconButton", flex: 1, icon: "images/folder.png", onclick: "openFolders"}

            ]},
            {name: "tagsInput", kind: "RichText", hint: "", components: [
                {content: $L("Tags"), className: "popup-label"}
            ]}
        ]},
        {layoutKind: "HFlexLayout", style: "margin-top: 10px;", components: [
            {name: "btCancel", kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "closePopup"},
            {name: "btAdd", kind: "Button", caption: $L("Edit"), flex: 1, onclick: "doEditData", className: "enyo-button-affirmative"}
        ]}

    ],

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
        return {"title": this.$.titleInput.getValue(), "folder": this.$.folderInput.getValue(), "tags": this.$.tagsInput.getValue().replace(/<[^>]*>/g, ""), "note": this.$.noteInput.getValue()};
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

    closePopup: function () {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.Repos",
    kind: "ModalDialog",
    layoutKind:"VFlexLayout",
    style: "min-width: 50%;",
    lazy: false,
    scrim: true,
    events: {
      onAccept: "",
      onSelectRepo: "",
      onDenied: ""
    },
    published: {
        repos: [],
        confirmed: false
    },
    caption: $L("Warning"),
    components:[
        {kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
            {name: "warning", allowHtml: true, className: "popup-info", content: "Although Install Manager provides a convenient way for installing and upgrading SWORD components, it also uses a systematic method for accessing sites which gives packet sniffers a target to lock into for singling out users. <br><br>IF YOU LIVE IN A PERSECUTED COUNTRY AND DO NOT WISH TO RISK DETECTION, YOU SHOULD *NOT* USE INSTALL MANAGER'S REMOTE SOURCE FEATURES.<br><br>Also, Remote Sources other than CrossWire may contain less than quality modules, modules with unorthodox content, or even modules which are not legitimately distributable.  Many repositories contain wonderfully useful content.  These repositories simply are not reviewed or maintained by CrossWire and CrossWire cannot be held responsible for their content. CAVEAT EMPTOR.<br><br> If you understand this and are willing to enable remote source features then tap on 'Accept'"},
            {name: "repoList", kind: "VirtualRepeater", onSetupRow: "getRepoItems", components: [
                {name: "itemRepo", kind: "Item", layoutKind: "VFlexLayout", tapHighlight: true, className: "list-item", components: [
                    {name: "repoName"}
                ],
                onclick: "selectRepo"
                }]
            }
        ]},
        {layoutKind: "HFlexLayout", style: "margin-top: 10px;", components: [
            {name: "btCancel", kind: "Button", caption: $L("Close"), flex: 1, onclick: "closePopup"},
            {name: "btReload", kind: "ActivityButton", caption: $L("Reload"), showing: false, flex: 1, onclick: "callAccept"},
            {name: "btAccept", kind: "ActivityButton", caption: $L("Accept"), flex: 1, onclick: "callAccept", className: "enyo-button-affirmative"}
        ]}

    ],

    callAccept: function () {
        if (this.$.btAccept.showing)
            this.$.btAccept.setActive(true);
        if (this.$.btReload.showing)
            this.$.btReload.setActive(true);
        this.doAccept();
    },

    setActivity: function (spin) {
        this.$.btAccept.setActive(spin);
        this.$.btReload.setActive(spin);

    },

    getRepoItems: function(inSender, inIndex) {
        var r = this.repos[inIndex];
        if (r) {
            //console.log(r + " - " + this.tmpLang);
            this.$.repoName.setContent(r.name);
            return true;
        } else {
            return false;
        }
    },

    reposChanged: function () {
        this.$.repoList.render();
    },

    confirmedChanged: function () {
        if(this.confirmed) {
            //this.setStyle("");
            this.$.warning.hide();
            this.$.repoList.show();
            this.setCaption($L("Select SWORD Source"));
            this.$.btAccept.hide();
            this.$.btReload.show();
        } else {
            this.$.warning.show();
            this.$.repoList.hide();
            this.setCaption($L("Warning"));
            this.$.btAccept.show();
            this.$.btReload.hide();
        }
    },

    selectRepo: function (inSender, inEvent, rowIndex) {
        enyo.setCookie("currentRepo", this.repos[rowIndex].name);
        this.doSelectRepo();
        this.close();
    },

    closePopup: function () {
        this.close();
        if (this.$.btAccept.showing)
            this.doDenied();
    }
});

enyo.kind({
    kind: "ModalDialog",
    name: "BibleZ.Error",
    caption: "Error",
    lazy: false,
    components:[
        {name: "errorMsg", content: "Error", className: "enyo-text-error warning-icon"},
        {kind: "Button", caption: $L("OK"), onclick: "closePopup", style: "margin-top:10px"}
    ],

    closePopup: function () {
       this.close();
    },

    setError: function (message) {
       this.$.errorMsg.setContent(message);
    }
});

enyo.kind({
    name: "BibleZ.About",
    style: "max-width: 350px;",
    scrim: true,
    kind: "Popup", components: [
        {kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
        {kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
           {content: $L("About ") + enyo.fetchAppInfo().title, className: "popup-title"},
           {content: "Version " + enyo.fetchAppInfo().version, className: "popup-version"},
           {style: "text-align: center;", components:[{kind: "Image", style: "width: 80px;", src: "images/biblezHD128.png"}]},
           {content: $L("BibleZ Pro HD is based on the") + " <a href='http://www.crosswire.org/sword'>" + $L("SWORD Project") + "</a> " + $L("and it is licensed under") + " <a href='http://www.gnu.org/licenses/gpl.txt'>GPLv3</a>.<br>&copy; 2010-2011 by <a href='http://zefanjas.de'>zefanjas.de</a>", className: "popup-info"},
           {style: "text-align: center;", components:[{content: "<a href='http://www.facebook.com/pages/zefanjas/118603198178545'><img src='images/facebook_32.png'/></a>  <a href='http://twitter.com/biblez'><img src='images/twitter_32.png'/></a>"}]}
        ]},
        {kind: "HFlexBox", components: [
            {kind: "Button", flex: 1, caption: $L("Close"), onclick: "doCancel"},
            {kind: "Button", flex: 1, className: "enyo-button-affirmative", caption: $L("Send eMail"), onclick: "sendMail"}
        ]}

    ],

    doCancel: function () {
     this.close();
    },

    sendMail: function () {
        this.$.palmService.call({
           id: 'com.palm.app.email',
              params: {
                 summary: $L("Support ") + enyo.fetchAppInfo().title + " TouchPad - " + enyo.fetchAppInfo().version,
                 "recipients":[{
                      "type":"email",
                      "contactDisplay":"Zefanjas Support",
                      "role":1,
                      "value":"info@zefanjas.de"
                  }]
              }
        });
    }
});