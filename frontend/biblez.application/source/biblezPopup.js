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
      onHighlight: ""
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
                {name: "bmCaption", flex: 1, className: "verse-popup-top-left", content: $L("Bookmark") + " + ", onclick: "doBookmark"},
                {name: "noteCaption", flex: 1, className: "verse-popup-top-right", content: $L("Note") + " + ", onclick: "doNote"}
            ]},
            {kind: "HFlexBox", components: [
                {name: "hlCaption", flex: 1, className: "verse-popup-bottom-left", content: $L("Highlight"), onclick: "openColors"},
                {name: "csCaption", flex: 1, className: "verse-popup-bottom-right", content: $L("Copy & Share"), onclick: "openCopy"}
            ]},
            /* {kind: "ToolButtonGroup", components: [
                //{content: "Copy"},
                {name: "bmCaption", caption: $L("Bookmark") + " + ", onclick: "doBookmark"},
                {name: "noteCaption", caption: $L("Note") + " + ", onclick: "doNote"},
                {name: "hlCaption", caption: $L("Highlight"), onclick: "openColors"},
                {name: "csCaption", caption: $L("Copy & Share"), onclick: "openCopy"}
                //{content: "Highlight"},
            ]}, */
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

    closePopup: function() {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.AddNote",
    kind: "ModalDialog",
    layoutKind:"VFlexLayout",
    lazy: false,
    events: {
      onAddNote: ""
    },
    published: {
		edit: false
	},
    caption: $L("Add A Note"),
    components:[
        {kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
            {name: "noteInput", kind: "RichText", className: "note-input", hint: $L("Add your note here."), changeOnInput: true, onfocus: "openCenter", onchange: "toggleButton"}
        ]},
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
        this.dismissWithClick = false;
		this.$.btCancel.show();
        //this.close()
        //this.openAtCenter();
        this.showEditBt();
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
    components:[
        {kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
            {name: "noteContent", allowHtml: true, content: "", className: "popup-note"}
        ]}
        //{kind: "Button", caption: $L("OK"), onclick: "closePopup", style: "margin-top:10px"}
    ],

    setNote: function (note) {
        this.$.noteContent.setContent(note.replace(/"/g,""));
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
                    {caption: $L("Hebrew"), value: "hebrew"},
                    {caption: $L("Custom"), value: "custom"}

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
            if (font == enyo.application.hebrewFont) {
                this.$.fontSelector.setValue("hebrew");
            } else if (font == enyo.application.greekFont) {
                this.$.fontSelector.setValue("greek");
            } else if (font == enyo.application.customFont) {
                this.$.fontSelector.setValue("custom");
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
    name: "BibleZ.About",
    scrim: true,
    kind: "Popup", components: [
       {kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
       {kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
           {content: $L("About ") + enyo.fetchAppInfo().title, className: "popup-title"},
           {content: "Version " + enyo.fetchAppInfo().version, className: "popup-version"},
           {style: "text-align: center;", components:[{kind: "Image", style: "width: 80px;", src: "images/biblezHD128.png"}]},
           {content: $L("BibleZ HD is based on the") + " <a href='http://www.crosswire.org/sword'>" + $L("SWORD Project") + "</a>. " + $L("and it is licensed under") + " <a href='http://www.gnu.org/licenses/gpl.txt'>GPLv3</a>.<br>&copy; 2010-2012 by <a href='http://zefanjas.de'>zefanjas.de</a>", className: "popup-info"},
           {style: "text-align: center;", components:[{content: "<a href='http://www.facebook.com/pages/zefanjas/118603198178545'><img src='images/facebook_32.png'/></a>  <a href='http://twitter.com/biblez'><img src='images/twitter_32.png'/></a>"}]},
           {kind: "Button", flex: 1, caption: $L("Send eMail"), onclick: "sendMail"},
           {kind: "Button", flex: 1, caption: $L("Close"), onclick: "doCancel"}
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

enyo.kind({
    name: "BibleZ.Pro",
    scrim: true,
    dismissWithClick: false,
    width: "400px",
    kind: "Popup", components: [
        {kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1, components: [
            {content: $L("BibleZ HD Pro - Upgrade Now"), className: "popup-title"},
            {style: "font-size: 0.8em; margin-top: 10px;", content: "BibleZ HD Pro is finally available in the App Catalog! Tap the bottom below to open the App Catalog and check out all the new features and improvements!<p>A quick overview:</p><ul><li>Support for commentaries</li><li>Search notes, bookmarks and highlights and organize them with tags and folders</li><li>Split view</li><li>Footnotes, cross-references</li><li>Strongs</li><li>...</li></ul>", allowHtml: true},
            {kind: "HFlexBox", components: [
                {kind: "Button", flex: 1, caption: $L("Close"), onclick: "doCancel"},
                {kind: "Button", flex: 1, caption: $L("Get BibleZ HD Pro"), onclick: "openAppCat", className: "enyo-button-affirmative"}
            ]}
        ]}

    ],

    openAppCat: function () {
        window.location = "http://developer.palm.com/appredirect/?packageid=de.zefanjas.biblezhdpro";
        this.doCancel();
    },

    doCancel: function () {
        enyo.setCookie("biblezpro", "false");
        this.close();
    }
});