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
    name: "BibleZ.main",
    kind: enyo.VFlexBox,
	components: [
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{kind: "ApplicationEvents", onWindowParamsChange: "launchParamsChanged"},
		{kind: "ApplicationEvents", onUnload: "savePassage"},
		{kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},

		{kind: "AppMenu", components: [
			{caption: $L("Module Manager"), onclick: "openModuleMgr"},
			{caption: $L("Preferences"), onclick: "openPrefs"},
			{caption: $L("Help"), onclick: "openHelp"},
			{caption: $L("Leave A Review"), onclick: "openReview"},
			{caption: $L("About"), onclick: "openAbout"}
		]},
		{name: "errorDialog", kind: "BibleZ.Error"},
		{name: "notePopup", kind: "BibleZ.AddNote", onAddNote: "addNote", onEditNote: "handleEditNote"},
		{name: "noteView", kind: "BibleZ.ShowNote", onNoteTap: "handleEditNote", style: "min-width: 100px; max-width: 300px;"},
		{name: "versePopup", kind: "BibleZ.VersePopup", className: "verse-popup", onOpen: "hideColors", onNote: "handleNote", onBookmark: "handleBookmark", onEditBookmark: "handleEditBookmark", onHighlight: "handleHighlight", onRelease: "handleSidebarMouseRelease"},
		{name: "fontMenu", kind: "BibleZ.FontMenu", onFontSize: "changeFontSize", onFont: "changeFont"},
		{name: "biblezAbout", kind: "BibleZ.About"},
		{name: "mainPane", flex: 1, kind: "Pane", transitionKind: "enyo.transitions.Simple", onSelectView: "viewSelected", components: [
			{name: "verseView", kind: "VFlexBox", flex: 1, components: [
				{name: "mainToolbar", kind: "Toolbar", components: [
                    //{icon: "images/modules.png", onclick: "selectModule"},
                    {kind: "HFlexBox", flex: 1, components: [
						{kind: "ToolButton", icon: "images/history.png", onclick: "openHistoryMenu"},
						{kind: "Spacer"},
						{kind: "ToolButton", name: "tbModLeft", onclick: "selectModule"}
					]},
					{kind: "HFlexBox", flex: 1, components: [
						{kind: "Spacer"},
						{kind: "ToolButton", name: "tbPassage", caption: "Go To", onclick: "showToaster"},
						{kind: "Spinner", showing: true},
						{kind: "Spacer"}
					]},
                    {kind: "HFlexBox", flex: 1, components: [
						{kind: "ToolButton", name: "btSplitView", icon: "images/splitView.png", onclick: "openSplitMenu"},
						{kind: "ToolButton", name: "tbModRight", onclick: "openSplitMenu", showing: false},
						{kind: "Spacer"},
						{kind: "ToolButton", icon: "images/font.png", onclick: "openFontMenu"},
						{kind: "ToolButton", name: "btSidebar", icon: "images/sidebar.png", toggling: true,  onclick: "openSidebar"},
						{kind: "ToolButton", name: "btStop", icon: "images/stop.png", showing: false, onclick: "hideSplitView"}
					]}
				]},
				{name: "modMenu", kind: "Menu", lazy: false},
				{name: "splitMenu", kind: "Menu", lazy: false},
				{name: "historyMenu", kind: "Menu", lazy: false},
				//{name: "mainView", kind: "BibleZ.Scroller", onSnap: "changeChapter", onVerseTap: "handleVerseTap", onShowNote: "openShowNote"},
				{name: "mainViewPane", kind: "Pane", flex: 1, className: "scroller-background", transitionKind: "enyo.transitions.Simple", onSelectView: "mainSelected", components: [
					{name: "singleContainer", kind: "HFlexBox", flex: 1, components: [
						{name: "mainView", kind: "BibleZ.Scroller", onSnap: "changeChapter", onVerseTap: "handleVerseTap", onShowNote: "openShowNote", onShowFootnote: "openFootnote"},
						{name: "sidebarContainer", className: "main-sidebar",components: [
							{name: "noteBmSidebar", kind: "BibleZ.Sidebar", onVerse: "handleSidebarVerse", onSearch: "handleSearch", onNewBm: "getBookmarks", onNewNote: "getNotes"}
						]}
					]},
					{name: "biblezHint", flex: 1, className: "scroller-background biblez-hint", content: ""},
					{name: "firstStart", flex: 1, className: "first-start scroller-background", components: [
						{allowHtml: true, content: $L("Thank you for installing BibleZ HD. Currently there are no modules installed. Please open the Module Manager and add at least one module!")},
						{kind: "Button", caption: $L("Open Module Manager"), className: "first-start-button", onclick: "openModuleMgr"}
					]},
					{name: "splitContainer", flex: 1, kind: "BibleZ.SplitView", onRotate: "splitRotated", onLeftSnap: "changeChapter", onVerseTap: "handleVerseTap", onShowNote: "openShowNote", onShowFootnote: "openFootnote"}
				]}
			]},
			{name: "selector", kind: "BibleZ.Selector", onChapter: "getVMax", onVerse: "getPassage"},
			{name: "modManView", kind: "BibleZ.ModMan",
				onUntar: "untarModules",
				onUnzip: "installModule",
				onGetDetails: "getDetails",
				onRemove: "removeModule",
				onGetSync: "getSyncConfig",
				onGetRepos: "getRemoteSources",
				onRefreshSource: "getRefreshRemoteSource",
				onListModules: "listRemoteModules",
				onBack: "goToMainView"},
			{name: "prefs", kind: "BibleZ.Prefs", onBack: "goToMainView", onBgChange: "changeBackground", onLbChange: "changeLinebreak", onScrollChange: "changeScrolling"}
		]},
		{kind: "Hybrid", name: "plugin", executable: "pluginSword", width:"0", height:"0", onPluginReady: "handlePluginReady", style: "float: left;"}
	],
	published: {
        dbSets: window.localStorage,
        verses: {},
        versesRight: {},
        launchParams: null,
        justType: null
    },

	pluginReady: false,

	create: function() {
		this.inherited(arguments);

		enyo.application.dbSets = window.localStorage;
		enyo.application.splitBnumber = 0;
		enyo.application.splitCnumber = 0;
		enyo.application.splitVnumber = 0;
		enyo.application.footnotes = true;
		enyo.application.heading = true;
		enyo.application.hebrewFont = "";
		enyo.application.greekFont = "";
		enyo.application.book = "";

		/*this.$.firstStart.hide();
		this.$.biblezHint.hide(); */
		this.$.sidebarContainer.hide();
		this.$.mainToolbar.hide();

		biblezTools.createDB();
		this.start = 0;
		enyo.application.currentModule = undefined;
		this.currentSplitModule = undefined;
		this.currentFontSize = 20;
		this.currentFont = "Prelude";

		this.position = 0;
		this.$.plugin.addCallback("returnModules", enyo.bind(this, "handleGetModules"), true);
		this.$.plugin.addCallback("returnVerses", enyo.bind(this, "handleGetVerses"), true);
		this.$.plugin.addCallback("returnBooknames", enyo.bind(this, "handleBooknames"), true);
		this.$.plugin.addCallback("returnVMax", enyo.bind(this, "handleVMax"), true);
		this.$.plugin.addCallback("returnUntar", enyo.bind(this, "handleUntar"), true);
		this.$.plugin.addCallback("returnUnzip", enyo.bind(this, "handleUnzip"), true);
		this.$.plugin.addCallback("returnRemove", enyo.bind(this, "handleRemove"), true);
		//this.$.plugin.addCallback("returnReadConfs", enyo.bind(this, "handleReadConfs"), true);
		this.$.plugin.addCallback("returnGetDetails", enyo.bind(this, "handleGetDetails"), true);
        this.$.plugin.addCallback("returnSearch", enyo.bind(this, "handleSearchResults"), true);
        this.$.plugin.addCallback("returnProgress", enyo.bind(this, "handleProgress"), true);
		//InstallMgr
		this.$.plugin.addCallback("returnSyncConfig", enyo.bind(this.$.modManView, this.$.modManView.handleGotSyncConfig), true);
		this.$.plugin.addCallback("returnRemoteSources", enyo.bind(this.$.modManView, this.$.modManView.handleGotRepos), true);
		this.$.plugin.addCallback("returnRefreshRemoteSource", enyo.bind(this, "handleRefreshedSource"), true);
		this.$.plugin.addCallback("returnListModules", enyo.bind(this, this.handleReadConfs), true);

        enyo.keyboard.setResizesWindow(false);
		//enyo.log(enyo.fetchDeviceInfo().platformVersion);
		//enyo.log(enyo.json.stringify(new enyo.g11n.currentLocale().getLocale()));

		//enyo.log(this.$.sidebarContainer);

		//this.$.mainViewPane.selectViewByName("splitContainer");
	},

	rendered: function () {
		this.inherited(arguments);
		//enyo.byId("main").className = enyo.byId("main").className + " scroller-grayscale";
		//enyo.log(this.$.mainViewPane.node);
	},

	launchParamsChanged: function (inSender) {
		if (enyo.windowParams && inSender) {
			if (enyo.windowParams.search) {
				enyo.log("Lauchned with params", decodeURIComponent(enyo.windowParams.search));
				this.justType = decodeURIComponent(enyo.windowParams.search);
				if (this.start === 1)
					this.getVerses(this.justType);
			}
		}

	},

	//SERVICE STUFF
	callFileService: function () {
		enyo.log("Calling service...");
		this.$.fileHelper.readDir();
	},

	//SIDEBAR STUFF
	openSidebar: function () {
		if (this.$.btSidebar.depressed === true) {
			this.$.sidebarContainer.show();
			//this.$.btSidebar.setState("down", true);
			this.$.mainView.setSidebarWidth(320);
		} else {
			//this.$.btSidebar.setState("down", false);
			this.$.sidebarContainer.hide();
			this.$.mainView.setSidebarWidth(0);
		}
		this.$.mainView.setSnappers();
		this.$.mainView.setPrevChapter(this.$.selector.getPrevPassage().passage);
		this.$.mainView.setNextChapter(this.$.selector.getNextPassage().passage);
		this.$.mainView.snapTo(this.$.mainView.index);
	},

	hideSplitView: function (inSender, inEvent) {
		this.$.mainViewPane.selectViewByName("singleContainer");
		this.uncheckSplitModules();
	},

	handleSidebarVerse: function (inSender, inEvent) {
		//enyo.log(this.$.noteBmSidebar.getPassage());
		this.$.selector.setVerse(this.$.noteBmSidebar.getVerse());
		this.getVerses(this.$.noteBmSidebar.getPassage());
	},

	//POPUP STUFF

	handleVerseTap: function(inSender, inEvent) {
		this.$.versePopup.setTappedVerse(inSender.tappedVerse);
		this.$.versePopup.setVerse(enyo.byId("verse"+inSender.tappedVerse).innerHTML.replace(/<[^>]*>/g, ""));
		this.$.versePopup.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);

		var bmID = (inSender.name == "splitContainer") ? "bmIconLeft" : "bmIcon";
		var noteID = (inSender.name == "splitContainer") ? "noteIconLeft" : "noteIcon";

		if (enyo.byId(bmID+inSender.tappedVerse).innerHTML !== "") {
			this.$.versePopup.setBmCaption($L("Bookmark") + " - ");
		} else {
			this.$.versePopup.setBmCaption($L("Bookmark") + " + ");
		}
		if (enyo.byId(noteID+inSender.tappedVerse).innerHTML !== "") {
			this.$.versePopup.setNoteCaption($L("Note") + " - ");
		} else {
			this.$.versePopup.setNoteCaption($L("Note") + " + ");
		}
	},

	handleNote: function () {
		this.$.versePopup.close();
		var verseNumber = (this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : this.$.mainView.tappedVerse;
		var passage = {"bnumber" : this.$.selector.getBnumber(), "cnumber": this.$.selector.getChapter(), "vnumber" : verseNumber};
		var noteID = (this.$.mainViewPane.getViewName() == "splitContainer") ? "noteIconLeft" : "noteIcon";
		if (enyo.byId(noteID+verseNumber).innerHTML !== "") {
			biblezTools.removeNote(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, enyo.bind(this, this.getNotes));
			enyo.byId(noteID+verseNumber).innerHTML = "";
		} else {
			this.$.noteBmSidebar.setBmMode("add");
			this.$.noteBmSidebar.openEditPopup({name: "itemNote"}, null, passage);
			this.$.noteBmSidebar.setPopupFocus("note");
		}
	},

	openAddNote: function () {
        //enyo.keyboard.setResizesWindow(false);
		this.$.versePopup.close();
		this.$.notePopup.clearInput();
        this.$.notePopup.openAtCenter();

        //this.$.notePopup.setFocus();

	},

	addNote: function (inSender, inEvent) {
		var verseNumber = (this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : this.$.mainView.tappedVerse;
		if (inSender.edit === false) {
			biblezTools.addNote(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, enyo.json.stringify(this.$.notePopup.getNote()), "", "", "", enyo.bind(this, this.getNotes));
		} else {
			biblezTools.updateNote(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, enyo.json.stringify(this.$.notePopup.getNote()), "", "", "", enyo.bind(this, this.getNotes));
		}
	},

	handleEditNote: function (inSender, inEvent) {
		this.$.noteView.close();
		var verseNumber = (this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : this.$.mainView.tappedVerse;
		var passage = {"bnumber" : this.$.selector.getBnumber(), "cnumber": this.$.selector.getChapter(), "vnumber" : verseNumber};
		this.$.noteBmSidebar.setBmMode("edit");
		this.$.noteBmSidebar.openEditPopup({name: "itemNote"}, null, passage);
		this.$.noteBmSidebar.setPopupFocus("note");
		/*if (enyo.byId(noteID+verseNumber).innerHTML !== "") {

		} else {
			this.$.noteBmSidebar.setBmMode("add");
			this.$.noteBmSidebar.openEditPopup({name: "itemNote"}, null, passage);
		}*/
	},

	getNotes: function() {
		if (this.$.mainViewPane.getViewName() == "splitContainer") {
			biblezTools.getNotes(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.splitContainer, this.$.splitContainer.setNotes));
		} else {
			biblezTools.getNotes(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.mainView, this.$.mainView.setNotes));
		}
		biblezTools.getNotes(-1,-1,enyo.bind(this.$.noteBmSidebar, this.$.noteBmSidebar.handleNotes));
	},

	openShowNote: function (inSender, inEvent) {
		//enyo.log("Show Notes...");
		enyo.keyboard.setResizesWindow(false);
		this.$.noteView.setNote(enyo.application.notes[inSender.tappedNote].note);
		this.$.noteView.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
		this.$.noteView.setShowType("note");

		/*this.$.notePopup.setCaption("");
		this.$.notePopup.setNote(enyo.application.notes[inSender.tappedNote].note);
		this.$.notePopup.setEditMode();
		this.$.notePopup.setDismissWithClick(true);
        this.$.notePopup.hideCancel();
		this.$.notePopup.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true); */
	},

	openFootnote: function (inSender, inEvent) {
		//enyo.log("Show footnote...");
		enyo.keyboard.setResizesWindow(false);
		this.$.noteView.setNote(enyo.application.currentFootnote);
		this.$.noteView.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
		this.$.noteView.setShowType("footnote");
	},

	handleBookmark: function (inSender, inEvent) {
		this.$.versePopup.close();
		var verseNumber = (this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : this.$.mainView.tappedVerse;
		var bmID = (this.$.mainViewPane.getViewName() == "splitContainer") ? "bmIconLeft" : "bmIcon";
		if (enyo.byId(bmID+verseNumber).innerHTML !== "") {
			biblezTools.removeBookmark(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, enyo.bind(this, this.getBookmarks));
			enyo.byId(bmID+verseNumber).innerHTML = "";
		} else {
			biblezTools.addBookmark(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, "", "", "", enyo.bind(this, this.getBookmarks));
		}
	},

	handleEditBookmark: function (inSender, inEvent) {
		this.$.versePopup.close();
		var verseNumber = (this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : this.$.mainView.tappedVerse;
		var bmID = (this.$.mainViewPane.getViewName() == "splitContainer") ? "bmIconLeft" : "bmIcon";
		var passage = {"bnumber" : this.$.selector.getBnumber(), "cnumber": this.$.selector.getChapter(), "vnumber" : verseNumber};
		if (enyo.byId(bmID+verseNumber).innerHTML !== "") {
			this.$.noteBmSidebar.setBmMode("edit");
			this.$.noteBmSidebar.openEditPopup({name: "itemBm"}, null, passage);
		} else {
			this.$.noteBmSidebar.setBmMode("add");
			this.$.noteBmSidebar.openEditPopup({name: "itemBm"}, null, passage);
		}
	},

	handleSidebarMouseRelease: function (inSender, inEvent) {
		this.$.noteBmSidebar.setPopupFocus();
	},

	getBookmarks: function() {
		if (this.$.mainViewPane.getViewName() == "splitContainer") {
			biblezTools.getBookmarks(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.splitContainer, this.$.splitContainer.setBookmarks));
		} else {
			biblezTools.getBookmarks(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.mainView, this.$.mainView.setBookmarks));
		}
        biblezTools.getBookmarks(-1,-1,enyo.bind(this.$.noteBmSidebar, this.$.noteBmSidebar.handleBookmarks));
	},

	handleHighlight: function (inSender, inEvent) {
		//enyo.log("BG:",enyo.byId("verse"+this.$.mainView.tappedVerse).style.backgroundColor);
		var verseNumber = (this.$.mainViewPane.getViewName() == "splitContainer") ? this.$.splitContainer.tappedVerse : this.$.mainView.tappedVerse;
		var verseID = (this.$.mainViewPane.getViewName() == "splitContainer") ? "verseLeft" : "verse";
		if (enyo.byId(verseID+verseNumber).style.backgroundColor.search("rgba") == -1) {
			biblezTools.addHighlight(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, inSender.getColor(), "",enyo.bind(this, this.getHighlights));
		} else {
			biblezTools.updateHighlight(this.$.selector.getBnumber(), this.$.selector.getChapter(), verseNumber, inSender.getColor(), "",enyo.bind(this, this.getHighlights));
		}
		enyo.byId(verseID+verseNumber).style.backgroundColor = inSender.getColor();

	},

	getHighlights: function() {
		if (this.$.mainViewPane.getViewName() == "splitContainer") {
			biblezTools.getHighlights(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.splitContainer, this.$.splitContainer.setHighlights));
		} else {
			biblezTools.getHighlights(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.mainView, this.$.mainView.setHighlights));
		}
        biblezTools.getHighlights(-1,-1,enyo.bind(this.$.noteBmSidebar, this.$.noteBmSidebar.handleHighlights));
	},

	hideColors: function (inSender, inEvent) {
		//this.$.versePopup.hideColors();
	},

	openAbout: function ()  {
		this.$.biblezAbout.openAtCenter();
	},

	showError: function (message) {
		this.$.errorDialog.setError(message);
		this.$.errorDialog.openAtCenter();
	},

	selectModule: function (inSender, inEvent) {
		this.$.modMenu.openAtEvent(inEvent);
	},

	openSplitMenu: function (inSender, inEvent) {
		this.$.splitMenu.openAtEvent(inEvent);
	},

	openHistoryMenu: function (inSender, inEvent) {
		this.$.historyMenu.openAtEvent(inEvent);
	},

	openFontMenu: function (inSender, inEvent) {
		this.$.fontMenu.openAtEvent(inEvent);
		this.$.fontMenu.setFontSize(this.currentFontSize);
		this.$.fontMenu.setFont(this.currentFont);
	},

	changeFontSize: function (inSender, inEvent) {
		if (inSender) {this.currentFontSize = inSender.getFontSize();}
		this.$.mainView.setFontSize(this.currentFontSize);
		this.$.splitContainer.setFontSize(this.currentFontSize);
	},

	changeFont: function (inSender, inEvent) {
		if (inSender) {
			if (inSender.getFont() == "greek") {
				this.currentFont = enyo.application.greekFont;
			} else if (inSender.getFont() == "hebrew") {
				this.currentFont = enyo.application.hebrewFont;
			} else {
				this.currentFont = inSender.getFont();
			}
		}
		this.$.mainView.setFont(this.currentFont);
		this.$.splitContainer.setFont(this.currentFont);
	},

	//PREFERENCES

	changeBackground: function () {
		enyo.log(this.$.prefs.getBackground());
		this.$.mainViewPane.addRemoveClass("scroller-background", false);
		this.$.mainViewPane.addRemoveClass("scroller-grayscale", false);
		this.$.mainViewPane.addRemoveClass("scroller-night", false);
		switch (this.$.prefs.getBackground()) {
			case "palm":
				this.$.mainViewPane.addClass("");
			break;
			case "biblez":
				this.$.mainViewPane.addClass("scroller-background");
			break;
			case "grayscale":
				this.$.mainViewPane.addClass("scroller-grayscale");
			break;
			case "night":
				this.$.mainViewPane.addClass("scroller-night");
			break;
		}
		//enyo.log(this.$.mainViewPane.getClassName());
	},

	changeLinebreak: function (inSender, inEvent) {
		this.$.mainView.setLinebreak(inSender.getLinebreak());
		this.$.splitContainer.setLinebreak(inSender.getLinebreak());
	},

	changeScrolling: function (inSender, inEvent) {
		this.$.mainView.createMainView();
	},

	//HYBRID STUFF

	handlePluginReady: function(inSender) {
		this.pluginReady = true;
		//this.$.plugin.hide();
		this.getModules();
	},

	handleGetModules: function(modules) {
		//enyo.log("INFO: " + modules);
		var mods = enyo.json.parse(modules);
		this.$.modManView.setInstalledModules(enyo.json.parse(modules));

		var comp = this.getComponents();
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/modulesItem\d+/) != -1 || comp[j].name.search(/splitItem\d+/) != -1) {
				comp[j].destroy();
			}
		}

		if (mods.length > 0) {
			//this.$.firstStart.hide();
			this.$.mainToolbar.show();

			//Check if saved Module currently exists
			var ifModule = 0;
			if (this.dbSets.lastRead) {
				for (var k=0;k<mods.length;k++) {
					if (enyo.json.parse(this.dbSets.lastRead).module.name == mods[k].name) {
						ifModule = 1;
					}
				}
			}
			enyo.application.currentModule = (this.dbSets.lastRead && ifModule == 1)? enyo.json.parse(this.dbSets.lastRead).module : mods[0];

			//Get current Booknames
			this.getBooknames(enyo.application.currentModule.name);

			//enyo.application.currentModule = mods[0];
			var kindName = "";
			for (var i=0;i<mods.length;i++) {
				kindName = "modulesItem" + i;
				this.$.modMenu.createComponent({name: kindName, kind: "MenuCheckItem", module: mods[i], caption: mods[i].name, onclick: "handleSelectModules", className: "module-item"}, {owner: this});
				if (enyo.application.currentModule.name == mods[i].name) {
					this.$[kindName].setChecked(true);
				}
				kindName = "splitItem" + i;
				this.$.splitMenu.createComponent({name: kindName, kind: "MenuCheckItem", module: mods[i], caption: mods[i].name, onclick: "handleSplitModules", className: "module-item"}, {owner: this});
			}
			this.$.modMenu.render();
			this.$.splitMenu.render();

			if (this.start === 0) {
				if (enyo.application.dbSets.lastRead) {
					var lastRead = enyo.json.parse(enyo.application.dbSets.lastRead);
					this.$.selector.setBnumber(lastRead.bnumber);
					this.$.selector.setChapter(lastRead.chapter);
					this.$.selector.setVerse(lastRead.verse);
					this.$.selector.setBook(lastRead.book);
					this.currentFontSize = lastRead.fontSize;
					this.currentFont = lastRead.font;
					this.changeFontSize();
					this.changeFont();
					this.$.prefs.setBgItem(lastRead.background);
					this.changeBackground();
					this.$.mainView.setLinebreak(lastRead.linebreak);
					this.$.splitContainer.setLinebreak(lastRead.linebreak);
					this.$.prefs.setLinebreak(lastRead.linebreak);
					enyo.application.heading = lastRead.heading;
					this.$.prefs.setHeading(lastRead.heading);
					enyo.application.footnotes = lastRead.footnotes;
					this.$.prefs.setFootnotes(lastRead.footnotes);
					enyo.application.hebrewFont = lastRead.hebrewFont;
					enyo.application.greekFont = lastRead.greekFont;
					this.$.prefs.setCustomFonts(lastRead.hebrewFont, lastRead.greekFont);
					if(enyo.application.dbSets.scrolling == "true")
						this.$.prefs.setScrolling(false);
					else
						this.$.prefs.setScrolling(true);
					//this.changeScrolling();
				}
			}
			this.start = 1;
		} else {
			enyo.log("NO MODULES");
			this.$.mainToolbar.hide();
			//this.$.mainView.hide();
			this.$.mainViewPane.selectViewByName("firstStart");
			//this.$.firstStart.show();
		}
	},

	handleSelectModules: function (inSender, inEvent) {
		enyo.log("MODULE: " + inSender.module.name);
		enyo.application.currentModule = inSender.module;
		var comp = this.getComponents();
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/modulesItem\d+/) != -1) {
				comp[j].setChecked(false);
			}
		}
		inSender.setChecked(true);
        //this.getBooknames(enyo.application.currentModule.name);
		this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), inSender.module.name);
	},

	handleSplitModules: function (inSender, inEvent) {
		this.$.mainViewPane.selectViewByName("splitContainer");
		enyo.log("MODULE: " + inSender.module.name);
		this.currentSplitModule = inSender.module;
		this.uncheckSplitModules();
		inSender.setChecked(true);
		this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), inSender.module.name, "right");
	},

	uncheckSplitModules: function () {
		var comp = this.getComponents();
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/splitItem\d+/) != -1) {
				comp[j].setChecked(false);
			}
		}
	},

	handleBooknames: function(response) {
		//enyo.log(response);
		enyo.application.bookNames = enyo.json.parse(response);
		this.$.selector.createSection("books", enyo.application.bookNames);
		this.$.selector.setBookNames(enyo.application.bookNames);
		this.$.noteBmSidebar.setBookNames(enyo.application.bookNames);
		if (this.$.mainPane.getViewName() == "verseView" && !this.justType) {
		    this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), enyo.application.currentModule.name);
		} else {
			this.getVerses(this.justType);
			this.justType = null;
		}

	},

	handleGetVerses: function(verses, side, passage) {
		//enyo.log(verses);
		//this.$.mainView.setPlain(verses);
		//enyo.log(passage);
		this.$.selector.setCurrentPassage(enyo.json.parse(passage));
		if (side == "right") {
			this.versesRight = enyo.json.parse(verses);
			enyo.application.versesRight = enyo.json.parse(verses);

		} else {
			this.verses = enyo.json.parse(verses);
			enyo.application.verses = enyo.json.parse(verses);
		}


		if (this.$.mainViewPane.getViewName() !== "splitContainer") {
			if (this.verses.length !== 0) {
				this.$.mainViewPane.selectViewByName("singleContainer");
			} else {
				enyo.log("Chapter not available!");
				this.$.biblezHint.setContent($L("The chapter is not available in this module! :-("));
				this.$.mainViewPane.selectViewByName("biblezHint");
			}
		} else {
			this.$.mainViewPane.selectViewByName("splitContainer");
		}

		//enyo.log(enyo.json.stringify(this.dbSets["history"]));
		this.setHistory();
		this.$.spinner.hide();
	},

	setHistory: function () {
		var history = [];
		if(this.dbSets.history) {
			history = enyo.json.parse(this.dbSets.history);
			if (history.length > 10) {
				history.splice(11,history.length-10);
			}
			for (var l=0;l<history.length;l++) {
				if(history[l].passage == this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter()) {
					history.splice(l,1);
				}
			}
		}

		history.unshift({"passage": this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter()});
		this.dbSets.history = enyo.json.stringify(history);

		var comp = this.getComponents();
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/historyItem\d+/) != -1) {
				comp[j].destroy();
			}
		}

		var kindName = "";
		for (var i=0;i<history.length;i++) {
			kindName = "historyItem" + i;
			this.$.historyMenu.createComponent({name: kindName, kind: "MenuItem", passage: history[i], caption: history[i].passage, onclick: "handleSelectHistory", className: "module-item"}, {owner: this});
		}
		this.$.historyMenu.render();
	},

	handleVMax: function(response) {
		//enyo.log(response);
		this.$.selector.createSection("verses", parseInt(response, 10));
	},

	untarModules: function (inSender, inEvent) {
		this.log("INFO", "Untar Modules...", inSender.allModsPath);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("untarMods", inSender.allModsPath); }
			catch (e) { this.log("ERROR", "Plugin exception: " + e);}
		}
		else {
			this.log("ERROR", "plugin not ready");
		}
	},

	handleUntar: function (response) {
		enyo.log(response);
		if (response == "0") {
			this.log("INFO", "Read available confs...");
			if (this.pluginReady) {
				try { var status = this.$.plugin.callPluginMethod("readConfs"); }
				catch (e) { this.log("ERROR", "Plugin exception: " + e);}
			}
			else {
				this.log("ERROR", "plugin not ready");
			}
		} else {
			this.$.modManView.stopSpinner();
			enyo.log("Couldn't untar mods.d.gz");
			this.showError("Couldn't untar mods.d.tar. You need to remove the /media/internal/.sword/ directory!");
		}
	},

	handleReadConfs: function(modules) {
		enyo.log("Got all available modules...", this);
		biblezTools.prepareModules(enyo.json.parse(modules), enyo.bind(this.$.modManView, this.$.modManView.getLang));
	},

	unzipModule: function(inSender, inEvent) {
		//enyo.log(inSender.modulePath);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("unzipModule", inSender.modulePath); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	installModule: function(inSender, inEvent) {
		//enyo.log(inSender.modulePath);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("remoteInstallModule", enyo.application.dbSets.currentRepo, inSender.getModuleToInstall()); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	handleUnzip: function (response) {
		if (enyo.json.parse(response).returnValue) {
			enyo.log("Installed Module!");
			enyo.windows.addBannerMessage($L("Installed Module!"), enyo.json.stringify({}));
			this.$.modManView.setBtInstall();
			this.getModules();
		} else {
			this.showError(enyo.json.parse(response).message);
			this.$.modManView.stopSpinner();
		}
	},

	removeModule: function (inSender, inEvent) {
		enyo.log(inSender.moduleToRemove.name);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("uninstallModule", inSender.moduleToRemove.name); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	handleRemove: function (response) {
		enyo.log("REMOVE: " + response);
		if (enyo.json.parse(response).returnValue) {
			enyo.windows.addBannerMessage($L("Uninstalled Module!"), enyo.json.stringify({}));
			this.getModules();
		}
	},

	getDetails: function (inSender, inEvent) {
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("getModuleDetails", inSender.getModuleToInstall(), enyo.application.dbSets.currentRepo); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	handleGetDetails: function (details) {
		//enyo.log("DETAILS", details);
		this.$.modManView.showDetails(enyo.json.parse(details));
	},

    handleSearch: function (inSender, inValue) {
        enyo.log(inSender.getScope());
        if (this.pluginReady) {
            enyo.log(inSender.getSearchType());
			try { var status = this.$.plugin.callPluginMethod("search", enyo.application.currentModule.name, inSender.getSearchTerm(), inSender.getScope(), inSender.getSearchType()); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
    },

    handleSearchResults: function (results) {
        //enyo.log("RESULTS:", results);
        this.$.noteBmSidebar.setSearchResults(enyo.json.parse(results));
    },

    handleProgress: function (response) {
        //enyo.log("PROCESS: ", process);
        this.$.modManView.setInstallProgress(parseInt(enyo.json.parse(response).total, 10), parseInt(enyo.json.parse(response).completed, 10));
    },

	getModules:function(inSender, inEvent) {
		//this.log(inSender, inEvent);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("getModules", "all"); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	getPassage: function (inSender, inEvent) {
		this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter());
		if (this.$.mainViewPane.getViewName() == "splitContainer") {
			this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), this.currentSplitModule.name, "right");
		}
	},

	getVerses: function(passage, module, side) {
		if(!module) {module = enyo.application.currentModule.name;}
		if(!side) {side = "left";}
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getVerses", module, passage, side);}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	getBooknames:function(modName) {
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getBooknames", modName);}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	getVMax:function() {
		var passage = this.$.selector.getBook().name + " " + this.$.selector.getChapter();
		enyo.log(passage);
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getVMax", passage);}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	//InstallMgr

	getSyncConfig:function() {
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("syncConfig");}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	getRemoteSources:function() {
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("listRemoteSources");}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	getRefreshRemoteSource: function () {
		enyo.log(enyo.application.dbSets.currentRepo);
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("refreshRemoteSource", enyo.application.dbSets.currentRepo);}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	handleRefreshedSource: function (response) {
		enyo.log(response);
		if (enyo.json.parse(response).returnValue)
			this.listRemoteModules();
		else
			this.showError(enyo.json.parse(response).message);
			this.$.modManView.stopSpinner();
	},

	listRemoteModules: function () {
		enyo.log(enyo.application.dbSets.currentRepo);
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("remoteListModules", enyo.application.dbSets.currentRepo);}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},

	//OTHER STUFF

	handleSelectHistory: function (inSender, inEvent) {
		this.$.selector.setVerse(1);
		this.getVerses(inSender.passage.passage);
		//enyo.log(this.$.mainViewPane.getViewName());
		if (this.$.mainViewPane.getViewName() == "splitContainer") {
			this.getVerses(inSender.passage.passage, this.currentSplitModule.name, "right");
		}
	},

	changeChapter: function (inSender, inEvent) {
		//enyo.log(inSender.index);
		if (inSender.index === 0 || inSender.getIndexLeft() === 0) {
			var prev = this.$.selector.getPrevPassage();
			//enyo.log(prev);
			if (prev.prevBnumber === 0 && prev.prevChapter === 0) {
				this.$.mainView.setIndex(1);
			} else {
				this.getVerses(prev.passage);
				if (this.$.mainViewPane.getViewName() == "splitContainer") {this.getVerses(prev.passage, this.currentSplitModule.name, "right");}
				this.$.selector.setBook(prev.prevBook);
				this.$.selector.setChapter(prev.prevChapter);
				this.$.selector.setBnumber(prev.prevBnumber);
				this.$.selector.setVerse(1);
			}
		} else if (inSender.index == inSender.numberOfSnappers + 2 || inSender.getIndexLeft() === 2) {
			var next = this.$.selector.getNextPassage();
			if (next.nextBook !== "" && next.nextChapter !== 0) {
				this.getVerses(next.passage);
				if (this.$.mainViewPane.getViewName() == "splitContainer") {this.getVerses(next.passage, this.currentSplitModule.name, "right");}
				this.$.selector.setBook(next.nextBook);
				this.$.selector.setChapter(next.nextChapter);
				this.$.selector.setBnumber(next.nextBnumber);
				this.$.selector.setVerse(1);
			} else {
				this.$.mainView.setIndex(this.$.mainView.getIndex()-1);
			}
		}
	},

	openModuleMgr: function (inSender, inEvent) {
		this.$.mainPane.selectViewByName("modManView");
	},

	openPrefs: function (inSender, inEvent) {
		this.$.mainPane.selectViewByName("prefs");
	},

	openHelp: function () {
		this.$.palmService.call({
			id: 'com.palm.app.browser',
            params: {
				"target": "http://zefanjas.de/biblez"
            }
        });
	},

	openReview: function () {
		window.location = "http://developer.palm.com/appredirect/?packageid=de.zefanjas.biblez.enyo";
		//this.$.mainViewPane.selectViewByName("splitContainer");
	},

	showToaster: function() {
		this.$.selector.openSelector();
	},

	goToMainView: function () {
		this.$.mainPane.selectViewByName("verseView");
	},

	viewSelected: function(inSender, inView, inPreviousView) {
		//enyo.log(inView.name);
		if (inView.name == "modManView") {
			//this.$.modManView.downloadMods();
			this.$.modManView.getRepos();
		} else if (inView.name == "verseView") {
			if(this.$.modManView.installedModules.length !== 0) {
				this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), enyo.application.currentModule.name);
			}
		}
	},

	mainSelected: function (inSender, inView, inPreviousView) {
		//enyo.log(this.$.selector.verse);
		this.$.tbPassage.setCaption(this.$.selector.getBook().name + " " + this.$.selector.getChapter());
		enyo.application.book = this.$.selector.getBook().abbrev;
		this.$.noteBmSidebar.setBookName(enyo.application.book);
		if (inView.name == "singleContainer") {
			this.$.btSidebar.show();
			this.$.btStop.hide();
			this.$.tbModRight.hide();
			this.$.btSplitView.show();


			this.$.tbModLeft.setCaption(enyo.application.currentModule.name);
			this.$.mainView.setVerses(this.verses, this.$.selector.verse);
			//this.$.mainView.setSnappers(this.$.selector.verse);
			this.$.mainView.setPrevChapter(this.$.selector.getPrevPassage().passage);
			this.$.mainView.setNextChapter(this.$.selector.getNextPassage().passage);

			this.getNotes();
			this.getBookmarks();
			this.getHighlights();
		} else if (inView.name == "splitContainer") {
			this.$.btSidebar.hide();
			this.$.btStop.show();
			this.$.tbModRight.show();
			this.$.btSplitView.hide();
			//this.$.tbPassage.setCaption(this.$.selector.getBook().name + " " + this.$.selector.getChapter());
			this.$.tbModLeft.setCaption(enyo.application.currentModule.name);
			this.$.tbModRight.setCaption(this.currentSplitModule.name);
			//this.$.splitContainer.windowRotated();

			//Right
			if (this.versesRight.length === 0) {
				this.$.splitContainer.setMessageRight($L("The chapter is not available in this module! :-("));
			} else {
				this.$.splitContainer.setVersesRight(this.versesRight, this.$.selector.verse);
			}
			this.$.splitContainer.setPrevChapterRight(this.$.selector.getPrevPassage().passage);
			this.$.splitContainer.setNextChapterRight(this.$.selector.getNextPassage().passage);

			//Left
			if (this.verses.length === 0) {
				this.$.splitContainer.setMessageLeft($L("The chapter is not available in this module! :-("));
			} else {
				this.$.splitContainer.setVersesLeft(this.verses, this.$.selector.verse);
			}
			this.$.splitContainer.setPrevChapterLeft(this.$.selector.getPrevPassage().passage);
			this.$.splitContainer.setNextChapterLeft(this.$.selector.getNextPassage().passage);

			this.getNotes("left");
			this.getBookmarks("left");
			this.getHighlights("left");
		}
	},

	splitRotated: function(inSender) {
		//enyo.log("SpliView rotated");
		//this.$.mainView.setVerses(this.verses, this.$.selector.verse);
		//this.$.mainView.windowRotated();
	},

	openAppMenuHandler: function() {
		this.$.appMenu.open();
	},

	closeAppMenuHandler: function() {
		this.$.appMenu.close();
	},

	//SAVE CURRENT PASSAGE

	savePassage: function () {
		var lastRead = {
			"passage" : this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(),
			"module" : enyo.application.currentModule,
			"bnumber": this.$.selector.bnumber,
			"chapter": this.$.selector.chapter,
			"verse": this.$.selector.verse,
			"book": this.$.selector.book,
			"fontSize": this.currentFontSize,
			"font": this.currentFont,
			"background" : this.$.prefs.getBackground(),
			"linebreak": this.$.prefs.getLinebreak(),
			"footnotes": enyo.application.footnotes,
			"heading": enyo.application.heading,
			"greekFont": enyo.application.greekFont,
			"hebrewFont": enyo.application.hebrewFont
		};
		//enyo.log(enyo.json.stringify(lastRead));
		if(enyo.application.currentModule) {
			enyo.application.dbSets.lastRead = enyo.json.stringify(lastRead);
		}
	}
});

//Turn Logging off
//enyo.log = function(){}