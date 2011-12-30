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
		onLbChange: ""
    },
	published: {
		background: "biblez",
		linebreak: false,
		backupTime: ""
	},
	components: [
		{kind: "FileService", name: "backupService" },
        {name: "filepicker", kind: "FilePicker", extensions: ["json"], fileType:["document"], allowMultiSelect:true, onPickFile: "handleFilePicker"},
        {kind: "Header", components: [
            {name: "btBack", kind: "Button", caption: $L("Back"), onclick: "doBack"},
			{kind: "Spacer"},
			{content: $L("Preferences")},
			{kind: "Spacer"}
        ]},
        {kind: "Scroller", flex: 1, components: [
            {kind: "RowGroup", caption: $L("General"), defaultKind: "HFlexBox", style: "margin-left: auto; margin-right: auto;", className: "prefs-container", components: [
                {name: "generalSelector", kind: "ListSelector", label: $L("Background"), onChange: "itemChanged", items: [
                    {caption: $L("Default"), value: "biblez"},
					{caption: $L("Paper Grayscale"), value: "grayscale"},
                    {caption: $L("Gray"), value: "palm"},
					{caption: $L("Night View"), value: "night"},
					{caption: $L("Plain White"), value: "white"}
                ]},
				{align: "center", components: [
					{flex: 1, name: "linebreak", content: $L("Enable Linebreaks")},
					{name: "toggleLB", kind: "ToggleButton", state: this.linebreak, onChange: "changeLinebreak"}
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
            {kind: "Spacer"}
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        if (enyo.fetchDeviceInfo().keyboardAvailable) {
            this.$.btBack.hide();
        }
    },
    
    itemChanged: function(inSender, inValue, inOldValue) {
        this.background = inValue;
        this.doBgChange();
    },
    
    setBgItem: function (value) {
        this.background = value;
        this.$.generalSelector.setValue(value);
    },
	
	changeLinebreak: function (inSender, inState) {
		//enyo.log(inState);
		this.linebreak = inState;
		this.doLbChange();
	},
	
	linebreakChanged: function (inSender, inEvent) {
		this.$.toggleLB.setState(this.linebreak);
	},

    handleHebrewFont: function (inSender, inEvent) {
        //enyo.log(inSender.getValue());
        enyo.application.hebrewFont = "'" + inSender.getValue() + "'";
    },

    handleGreekFont: function (inSender, inEvent) {
        //enyo.log(inSender.getValue());
        enyo.application.greekFont = "'" + inSender.getValue() + "'";
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
		biblezTools.getNotes(-1,-1,enyo.bind(this, this.callBackupNotes));
		biblezTools.getBookmarks(-1,-1,enyo.bind(this, this.callBackupBookmarks));
		biblezTools.getHighlights(-1,-1,enyo.bind(this, this.callBackupHighlights));
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
                    biblezTools.restoreBookmarks(enyo.json.parse(inResponse.content), enyo.bind(this, this.callbackRestore, $L("Bookmarks")));
                break;
                case "notes":
                    biblezTools.restoreNotes(enyo.json.parse(inResponse.content), enyo.bind(this, this.callbackRestore, $L("Notes")));
                break;
                case "highlights":
                    biblezTools.restoreHighlights(enyo.json.parse(inResponse.content), enyo.bind(this, this.callbackRestore, $L("Highlights")));
                break;
            }
        }       
    },

    callbackRestore: function (inType) {
        //enyo.log("RESTORE", inType);
        enyo.windows.addBannerMessage($L("Restored") + " " + inType, enyo.json.stringify({}));
    }
});