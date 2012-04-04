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
	name: "BibleZ.Prefs",
	kind: enyo.VFlexBox,
    events: {
        onBack: "",
        onBgChange: "",
		onLbChange: "",
        onScrollChange: ""
    },
	published: {
		background: "biblez",
		linebreak: false,
        footnotes: true,
        heading: true,
        scrolling: false,
		backupTime: ""
	},
	components: [
		{kind: "FileService", name: "backupService" },
        {name: "filepicker", kind: "FilePicker", extensions: ["json"], fileType:["document"], allowMultiSelect:true, onPickFile: "handleFilePicker"},
        {kind: "Header", components: [
            {kind: "Button", caption: $L("Back"), onclick: "doBack"},
			{kind: "Spacer"},
			{content: $L("Preferences")},
			{kind: "Spacer"}
        ]},
        {kind: "Scroller", flex: 1, components: [
            {kind: "RowGroup", caption: $L("General"), defaultKind: "HFlexBox", style: "margin-left: auto; margin-right: auto;", className: "prefs-container", components: [
                {name: "generalSelector", kind: "ListSelector", label: $L("Background"), onChange: "itemChanged", items: [
                    {caption: $L("Default"), value: "default"},
					{caption: $L("Paper Grayscale"), value: "grayscale"},
                    {caption: $L("Gray"), value: "palm"},
					{caption: $L("Night View"), value: "night"}
                ]},
                {align: "center", components: [
                    {flex: 1, name: "scrolling", content: $L("Scrolling Method")},
                    {name: "toggleScroll", kind: "ToggleButton", onLabel: $L("Horizontal"), offLabel: $L("Vertical"), state: true, onChange: "changeScrolling"}
                ]},
				{align: "center", components: [
					{flex: 1, name: "linebreak", content: $L("Enable Linebreaks")},
					{name: "toggleLB", kind: "ToggleButton", state: this.linebreak, onChange: "changeLinebreak"}
				]},
                {align: "center", components: [
                    {flex: 1, content: $L("Enable Headings")},
                    {name: "toggleHeading", kind: "ToggleButton", state: true, onChange: "changeHeading"}
                ]},
                {align: "center", components: [
                    {flex: 1, content: $L("Enable Book Introductions")},
                    {name: "toggleIntro", kind: "ToggleButton", state: true, onChange: "changeIntro"}
                ]},
                {align: "center", components: [
                    {flex: 1, name: "footnotes", content: $L("Enable Footnotes")},
                    {name: "toggleFN", kind: "ToggleButton", state: true, onChange: "changeFootnote"}
                ]},
                {align: "center", components: [
                    {flex: 1, name: "crossRef", content: $L("Enable Cross References")},
                    {name: "toggleCR", kind: "ToggleButton", state: false, onChange: "changeCrossRef"}
                ]},
                {align: "center", components: [
                    {kind: "VFlexBox", flex: 1, components: [
                        {name: "strongs", content: $L("Enable Strong's Numbers")},
                        {content: $L("You have to install the 'StrongsGreek' and 'StrongsHebrew' module to use this feature!"), style: "font-size: 0.8em;"}
                    ]},
                    {name: "toggleStrongs", kind: "ToggleButton", state: false, onChange: "changeStrongs"}
                ]}
            ]},
            {kind: "Group", caption: $L("Custom Fonts"), defaultKind: "HFlexBox", style: "margin-left: auto; margin-right: auto;", className: "prefs-container", components: [
                {kind: "VFlexBox", components: [
                    {content: $L("You need to install your font to '/usr/share/fonts' first! (<a href='http://zefanjas.de/biblez'>more Infos here</a>)."), allowHtml: true, className: "hint-small"},
                    {name: "hebrewInput", kind: "Input", hint: "", onblur: "handleHebrewFont", components: [
                        {content: $L("Hebrew Font"), className: "popup-label"}
                    ]}
                ]},
                {kind: "VFlexBox", components: [
                    {name: "greekInput", kind: "Input", hint: "", onblur: "handleGreekFont", components: [
                        {content: $L("Greek Font"), className: "popup-label"}
                    ]}
                ]}
            ]},
            {kind: "RowGroup", caption: $L("Backup & Restore"), defaultKind: "HFlexBox", style: "margin-left: auto; margin-right: auto;", className: "prefs-container", components: [
				{kind: "VFlexBox", components: [
					{kind: "ActivityButton", name: "btBackup", caption: $L("Backup Data"), onclick: "handleBackup"},
					{content: $L("Backups are stored in '/media/internal/biblez'"), className: "hint-small"}
				]},
                {kind: "VFlexBox", components: [
                    {kind: "ActivityButton", name: "btRestore", caption: $L("Restore Data"), onclick: "openFilePicker"},
                    {content: $L("All your current data will be removed!!!"), className: "hint-small"}
                ]}
            ]},
            {kind: "RowGroup", caption: $L("Restore BibleZ Pro Backup (old webOS Phone version)"), defaultKind: "HFlexBox", style: "margin-left: auto; margin-right: auto;", className: "prefs-container", components: [
                {kind: "VFlexBox", components: [
                    {kind: "ActivityButton", name: "btRestoreOld", caption: $L("Restore Old Data"), onclick: "handleOldBackup"},
                    {kind: "RichText", name: "oldBackupInput", hint: $L("Paste your backup here"), richContent: false}

                ]}
            ]},
            {kind: "Spacer"}
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        if (enyo.getCookie("scrolling")) {
            biblez.scrollHorizontal = enyo.json.parse(enyo.getCookie("scrolling"));
            this.$.toggleScroll.setState(biblez.scrollHorizontal);
        }

        if (enyo.getCookie("linebreak")) {
            biblez.linebreak = enyo.json.parse(enyo.getCookie("linebreak"));
            this.$.toggleLB.setState(biblez.linebreak);
        }

        if (enyo.getCookie("intro")) {
            biblez.intro = enyo.json.parse(enyo.getCookie("intro"));
            this.$.toggleIntro.setState(biblez.intro);
        } else {
            biblez.intro = true;
        }

        if (enyo.getCookie("heading")) {
            biblez.heading = enyo.json.parse(enyo.getCookie("heading"));
            this.$.toggleHeading.setState(biblez.heading);
        } else {
            biblez.heading = true;
        }

        if (enyo.getCookie("footnote")) {
            biblez.footnote = enyo.json.parse(enyo.getCookie("footnote"));
            this.$.toggleFN.setState(biblez.footnote);
        } else {
            biblez.footnote = true;
        }

        if (enyo.getCookie("crossRef")) {
            biblez.crossRef = enyo.json.parse(enyo.getCookie("crossRef"));
            this.$.toggleCR.setState(biblez.crossRef);
        } else {
            biblez.crossRef = false;
        }

        if (enyo.getCookie("strongs")) {
            biblez.strongs = enyo.json.parse(enyo.getCookie("strongs"));
            this.$.toggleStrongs.setState(biblez.strongs);
        } else {
            biblez.strongs = false;
        }

        if (enyo.getCookie("background")) {
            biblez.background = enyo.json.parse(enyo.getCookie("background"));
            this.$.generalSelector.setValue(biblez.background);
        } else {
            biblez.background = "default";
        }

        if (enyo.getCookie("hebrewFont")) {
            biblez.hebrewFont = enyo.json.parse(enyo.getCookie("hebrewFont"));
            this.$.hebrewInput.setValue(biblez.hebrewFont.replace(/'/g, ""));
        }

        if (enyo.getCookie("greekFont")) {
            biblez.greekFont = enyo.json.parse(enyo.getCookie("greekFont"));
            this.$.greekInput.setValue(biblez.greekFont.replace(/'/g, ""));
        }
    },

    itemChanged: function(inSender, inValue, inOldValue) {
        enyo.setCookie("background", enyo.json.stringify(inValue));
        biblez.background = inValue;
        this.doBgChange();
    },

    setBgItem: function (value) {
        this.background = value;
        this.$.generalSelector.setValue(value);
    },

    changeScrolling: function (inSender, inState) {
        biblez.scrollHorizontal = inState;
        enyo.setCookie("scrolling", enyo.json.stringify(inState));
        this.doScrollChange();
    },

	changeLinebreak: function (inSender, inState) {
		//enyo.log(inState);
        enyo.setCookie("linebreak", enyo.json.stringify(inState));
		biblez.linebreak = inState;
	},

    changeHeading: function (inSender, inState) {
        //enyo.log(inState);
        enyo.setCookie("heading", enyo.json.stringify(inState));
        biblez.heading = inState;
    },

    changeIntro: function (inSender, inState) {
        //enyo.log(inState);
        enyo.setCookie("intro", enyo.json.stringify(inState));
        biblez.intro = inState;
    },

    changeFootnote: function (inSender, inState) {
        //enyo.log(inState);
        enyo.setCookie("footnote", enyo.json.stringify(inState));
        biblez.footnote = inState;
    },

    changeCrossRef: function (inSender, inState) {
        //enyo.log(inState);
        enyo.setCookie("crossRef", enyo.json.stringify(inState));
        biblez.crossRef = inState;
    },

    changeStrongs: function (inSender, inState) {
        //enyo.log(inState);
        enyo.setCookie("strongs", enyo.json.stringify(inState));
        biblez.strongs = inState;
    },

    scrollingChanged: function (inSender, inEvent) {
        this.$.toggleScroll.setState(this.scrolling);
    },

	linebreakChanged: function (inSender, inEvent) {
		this.$.toggleLB.setState(this.linebreak);
	},

    headingChanged: function (inSender, inEvent) {
        this.$.toggleHeading.setState(this.heading);
    },

    footnotesChanged: function (inSender, inEvent) {
        this.$.toggleFN.setState(this.footnotes);
    },

    handleHebrewFont: function (inSender, inEvent) {
        //enyo.log(inSender.getValue());
        biblez.hebrewFont = "'" + inSender.getValue() + "'";
        enyo.setCookie("hebrewFont", enyo.json.stringify(biblez.hebrewFont));
    },

    handleGreekFont: function (inSender, inEvent) {
        //enyo.log(inSender.getValue());
        biblez.greekFont = "'" + inSender.getValue() + "'";
        enyo.setCookie("greekFont", enyo.json.stringify(biblez.greekFont));
    },

    setCustomFonts: function (hebrew, greek) {
        this.$.hebrewInput.setValue(hebrew.replace(/'/g, ""));
        this.$.greekInput.setValue(greek.replace(/'/g, ""));
    },

	handleBackup: function (inSender, inEvent) {
		this.$.btBackup.setActive(true);
		var time = new Date();
		this.backupTime = time.getFullYear().toString() + (time.getMonth() + 1).toString() + time.getDate().toString();
		//enyo.log(this.backupTime, time.getFullYear(), time.getMonth() + 1, time.getDate());
		api.getNotes(-1,-1,enyo.bind(this, this.callBackupNotes));
		api.getBookmarks(-1,-1,enyo.bind(this, this.callBackupBookmarks));
		api.getHighlights(-1,-1,enyo.bind(this, this.callBackupHighlights));
	},

	callBackupNotes: function (content) {
		this.$.backupService.writeFile("/media/internal/biblez/biblezNotes-" + this.backupTime + ".json", enyo.json.stringify(content), enyo.bind(this, this.callbackBackup, $L("Notes")));
	},

	callBackupBookmarks: function (content) {
		this.$.backupService.writeFile("/media/internal/biblez/biblezBookmarks-" + this.backupTime + ".json", enyo.json.stringify(content), enyo.bind(this, this.callbackBackup, $L("Bookmarks")));
	},

	callBackupHighlights: function (content) {
		this.$.backupService.writeFile("/media/internal/biblez/biblezHighlights-" + this.backupTime + ".json", enyo.json.stringify(content), enyo.bind(this, this.callbackBackup, $L("Highlights")));
	},

	callbackBackup: function (inType, inResponse) {
		this.$.btBackup.setActive(false);
		//enyo.log("RESPONSE:", inResponse);
		if (inResponse.returnValue) {
			enyo.windows.addBannerMessage($L("Backuped") + " " + inType, enyo.json.stringify({}));
		}
	},

    handleOldBackup: function () {
        this.oldData = enyo.json.parse(PalmSystem.decrypt("JesusIsTheLord", this.$.oldBackupInput.getValue()));
        if (this.oldData.notes && this.oldData.notes.length !== 0) {
            api.getNotes(-1,-1,enyo.bind(this, this.callbackOldNotes));
        }

        if (this.oldData.bookmarks && this.oldData.bookmarks.length !== 0) {
            api.getBookmarks(-1,-1,enyo.bind(this, this.callbackOldBookmarks));
        }
    },

    callbackOldNotes: function (data) {
        var tmpNotes = [];
        var found = 0;
        for (var i=0; i<this.oldData.notes.length; i++) {
            found = 0;
            for (var j=0; j<data.length; j++) {
                if (this.oldData.notes[i].bnumber === data[j].bnumber && this.oldData.notes[i].cnumber === data[j].cnumber && this.oldData.notes[i].vnumber === data[j].vnumber) {
                    found = j;
                } else {

                }
            }
            if (found === 0)
                data.push(this.oldData.notes[i]);
            else {
                data[found].note = data[found].note += "<p> --- Restored Note ----- </p>" + this.oldData.notes[i].note;
            }
        }
        api.restoreNotes(data, enyo.bind(this, this.callbackRestore, $L("Old Notes")));
        this.$.oldBackupInput.setValue("");
    },

    callbackOldBookmarks: function (data) {
        var found = 0;
        for (var i=0; i<this.oldData.bookmarks.length; i++) {
            found = 0;
            for (var j=0; j<data.length; j++) {
                if (this.oldData.bookmarks[i].bnumber === data[j].bnumber && this.oldData.bookmarks[i].cnumber === data[j].cnumber && this.oldData.bookmarks[i].vnumber === data[j].vnumber) {
                    found = j;
                } else {

                }
            }
            if (found === 0)
                data.push(this.oldData.bookmarks[i]);
        }
        api.restoreBookmarks(data, enyo.bind(this, this.callbackRestore, $L("Old Bookmarks")));
        this.$.oldBackupInput.setValue("");
    },

    openFilePicker: function (inSender, inEvent) {
        this.$.filepicker.pickFile();
    },
    handleFilePicker: function (inSender, files) {
        for (var i=0;i<files.length;i++) {
            if (files[i].fullPath.search("biblezBookmarks") != -1) {
                this.$.backupService.readFile(files[i].fullPath, enyo.bind(this, this.callbackReadFile, "bookmarks"));
            } else if (files[i].fullPath.search("biblezNotes") != -1) {
                this.$.backupService.readFile(files[i].fullPath, enyo.bind(this, this.callbackReadFile, "notes"));
            } else if (files[i].fullPath.search("biblezHighlights") != -1) {
                this.$.backupService.readFile(files[i].fullPath, enyo.bind(this, this.callbackReadFile, "highlights"));
            }
        }
    },

    callbackReadFile: function (inType, inResponse) {
        //this.$.btBackup.setActive(false);
        //enyo.log("RESPONSE:", inType, inResponse);
        if (inResponse.returnValue) {
            switch (inType) {
                case "bookmarks":
                    api.restoreBookmarks(enyo.json.parse(inResponse.content), enyo.bind(this, this.callbackRestore, $L("Bookmarks")));
                break;
                case "notes":
                    api.restoreNotes(enyo.json.parse(inResponse.content), enyo.bind(this, this.callbackRestore, $L("Notes")));
                break;
                case "highlights":
                    api.restoreHighlights(enyo.json.parse(inResponse.content), enyo.bind(this, this.callbackRestore, $L("Highlights")));
                break;
            }
        }
    },

    callbackRestore: function (inType) {
        //enyo.log("RESTORE", inType);
        enyo.windows.addBannerMessage($L("Restored") + " " + inType, enyo.json.stringify({}));
    }
});