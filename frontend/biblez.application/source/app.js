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
    name: "BibleZ.App",
    kind: enyo.VFlexBox,
    components: [
        {kind: "ApplicationEvents", onUnload: "saveSettings"},
        {kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
        {name: "swordApi", kind: "BibleZ.SwordApi",
            onGetSyncConfig: "handleGetSyncConfig",
            onRefreshedSource: "handleRefreshedSource",
            onGetRemoteModules: "handleGetRemoteModules",
            onInstalledModule: "handleInstalledModule",
            onProgress: "handleProgress",
            onGetResults: "handleGetResults",
            onPluginError: "showError"
        },
        {kind: "AppMenu", components: [
            {caption: $L("Module Manager"), onclick: "openModuleMgr"},
            {caption: $L("Preferences"), onclick: "openPrefs"},
            {caption: $L("Disable Auto Dimm"), onclick: "setDimm", dimm: true},
            {caption: $L("Help"), onclick: "openHelp"},
            {caption: $L("Leave A Review"), onclick: "openReview"},
            {caption: $L("About"), onclick: "openAbout"}
        ]},
        {name: "biblezAbout", kind: "BibleZ.About"},
        {name: "errorDialog", kind: "BibleZ.Error"},
        {name: "mainPane", flex: 1, kind: "Pane", transitionKind: "enyo.transitions.Simple", onSelectView: "viewSelected", components: [
            {name: "start", kind: "App.Start"},
            {name: "welcome", kind: "App.Welcome", onOpenModMan: "openModuleMgr"},
            {name: "verseView", kind: "HFlexBox",/* className: "scroller-background", */ components: [
                {name: "mainView", kind: "App.MainView", flex: 1,
                    onGetModules: "handleGetModules",
                    onGetBooknames: "handleGetBooknames",
                    onGetVerses: "handleGetVerses",
                    onGoToMain: "goToMainView",
                    onWelcome: "goToWelcome",
                    onGetVMax: "handleGetVMax",
                    onSync: "handleSyncSplitView",
                    onSearch: "handleSearch"
                },
                {name: "splitPane", kind: "Pane", showing: false, flex: 1, components: [
                    {name: "splitView", kind: "App.MainView", className: "split-view", view: "split",
                        onGetModules: "handleGetModules",
                        onGetBooknames: "handleGetBooknames",
                        onGetVerses: "handleGetVerses",
                        onGoToMain: "goToMainView",
                        onWelcome: "goToWelcome",
                        onGetVMax: "handleGetVMax",
                        onSplitVerse: "handleSplitVerse",
                        onSync: "handleSyncSplitView",
                        onSearch: "handleSearch"
                    }
                ]}
            ]},

            {name: "modManView", kind: "App.ModMan",
                onUntar: "untarModules",
                onInstallModule: "handleInstallModule",
                onGetDetails: "getModuleDetails",
                onRemove: "removeModule",
                onGetSync: "getSyncConfig",
                onGetRepos: "handleRemoteSources",
                onRefreshSource: "getRefreshRemoteSource",
                onListModules: "getRemoteModules",
                onGetModules: "handleGetModules",
                onModulesChanged: "handleModulesChanged",
                onBack: "goToMainView"
            },
            {name: "prefs", kind: "BibleZ.Prefs",
                onBack: "goToMainView",
                onBgChange: "changeBackground",
                onLbChange: "changeLinebreak",
                onScrollChange: "changeScrolling"
            }
        ]},
        {name: "btSplit", content: "", className: "split-button", showing: true, allowDrag: true,
            onclick: "openSecondViewClicked",
            ondragstart: "seperatorDragStart",
            ondrag: "seperatorDrag",
            ondragfinish: "seperatorDragFinish"
        }
    ],

    published: {
        launchParams: null
    },

    splitWidth: 0,

    create: function() {
        this.inherited(arguments);
        api.createDB();

        enyo.keyboard.setResizesWindow(false);
        biblez.isOpen = false;
        //biblez.scrollHorizontal = true;

        //LOAD PREFERENCES
        if (enyo.getCookie("mainModule"))
            this.$.mainView.setCurrentModule(enyo.json.parse(enyo.getCookie("mainModule")));
        if (enyo.getCookie("splitModule"))
            this.$.splitView.setCurrentModule(enyo.json.parse(enyo.getCookie("splitModule")));
    },

    //SWORD API CALLS

    handleGetModules: function (inSender) {
        this.$.swordApi.getInstalledModules(enyo.bind(inSender, inSender.handleGetModules));
    },

    handleModulesChanged: function (inSender) {
        this.$.mainView.handleModulesChanged(biblez.modules);
        this.$.splitView.handleModulesChanged(biblez.modules);
    },

    handleGetBooknames: function (inSender, module) {
        this.$.swordApi.getBooknames(enyo.bind(inSender, inSender.handleGetBooknames), module);
    },

    handleGetVerses: function (inSender, passage, module, single) {
        //enyo.log(inSender, passage, module);
        this.$.swordApi.getVerses(enyo.bind(inSender, inSender.handleGetVerses), passage, module, single);
    },

    handleGetVMax: function (inSender, passage) {
        //enyo.log(inSender, passage);
        this.$.swordApi.getVMax(enyo.bind(inSender, inSender.handleGetVMax), passage);
    },

    handleRemoteSources: function (inSender) {
        this.$.swordApi.getRemoteSources(enyo.bind(inSender, inSender.handleGotRepos));
    },

    getSyncConfig: function (inSender) {
        this.$.swordApi.getSyncConfig();
    },

    handleGetSyncConfig: function (inSender, response) {
        this.$.modManView.handleGotSyncConfig(response);
    },

    getRefreshRemoteSource: function (inSender) {
        this.$.swordApi.getRefreshRemoteSource();
    },

    handleRefreshedSource: function (inSender, response) {
        enyo.log(response);
        if (enyo.json.parse(response).returnValue)
            this.getRemoteModules();
        else
            this.showError(null, enyo.json.parse(response).message);
            this.$.modManView.stopSpinner();
    },

    getRemoteModules: function () {
        this.$.swordApi.getRemoteModules();
    },

    handleGetRemoteModules: function (inSender, modules) {
        enyo.log("Got all available modules...");
        api.prepareModules(enyo.json.parse(modules), enyo.bind(this.$.modManView, this.$.modManView.getLang));
    },

    getModuleDetails: function (inSender) {
        this.$.swordApi.getModuleDetails(enyo.bind(inSender, inSender.showDetails), inSender.getModuleToInstall());
    },

    handleInstallModule: function (inSender) {
        this.$.swordApi.installModule(inSender.getModuleToInstall());
    },

    handleInstalledModule: function (inSender, response) {
        this.$.modManView.handleInstalledModule(response);
    },

    handleProgress: function (inSender, response) {
        this.$.modManView.setInstallProgress(response);
    },

    removeModule: function (inSender) {
        this.$.swordApi.uninstallModule(enyo.bind(inSender, inSender.handleRemove), inSender.getModuleToRemove().name);
    },

    handleSearch: function (inSender, module, searchTerm, searchType, searchScope, view) {
        //enyo.log(module, searchTerm, searchType, searchScope, view);
        this.$.swordApi.search((module === "mainModule") ? this.$.mainView.getCurrentModule().name : module, searchTerm, searchScope, searchType, view);
    },

    handleGetResults: function (inSender, results, view) {
        if (view === "main")
            this.$.mainView.handleSearchResults(results, view);
        else
            this.$.splitView.handleSearchResults(results, view);
    },

    //PANE STUFF

    goToMainView: function () {
        if (biblez.welcome)
            this.$.mainPane.back();
        else
            this.$.mainPane.selectViewByName("verseView");
    },

    goToWelcome: function () {
        biblez.welcome = true;
        this.$.mainPane.selectViewByName("welcome");
    },

    viewSelected: function(inSender, inView, inPreviousView) {
        //enyo.log(inPreviousView.name);
        this.$.btSplit.hide();
        if (inView.name == "modManView") {
            this.$.modManView.getRepos();
        } else if (inView.name == "verseView") {
            this.$.btSplit.show();
            if(biblez.modules.length !== 0) {
                if (this.scrollingChanged) {
                    this.$.mainView.changeScrolling(biblez.scrollHorizontal);
                    this.$.splitView.changeScrolling(biblez.scrollHorizontal);
                    this.scrollingChanged = false;
                }
                this.$.mainView.getVerses();
            }
        }
    },

    openSecondViewClicked: function () {
        enyo.nextTick(this, this.openSecondView);
    },

    openSecondView: function (inSender, inEvent) {
        //enyo.log("Tapped + Button");
        if (!this.drag) {
            if (this.$.splitPane.showing) {
                this.$.splitPane.hide();
                this.$.btSplit.setClassName("split-button");
                this.$.btSplit.addStyles("right: 0px;");
                this.$.mainView.resizeHandler(true);
            } else {
                this.$.splitPane.show();
                this.$.btSplit.setClassName("split-button-middle");
                var right = (this.splitWidth === 0) ? window.innerWidth/2-31 : this.splitWidth;
                this.$.btSplit.addStyles("right: " +  right + "px;");
                this.$.splitView.getVerses(this.$.mainView.getPassage().passage);
                this.$.splitView.resizeHandler();
                this.$.mainView.resizeHandler(true);
            }
        } else {
            this.drag = false;
        }
    },

    seperatorDragStart: function (inSender, inEvent) {
        if (Math.abs(inEvent.dx) > Math.abs(inEvent.dy)) {
            this.drag = true;
            return true;
        }
    },

    seperatorDrag: function (inSender, inEvent) {
        if (Math.abs(inEvent.dx) > Math.abs(inEvent.dy) && this.$.splitPane.showing) {
            this.splitWidth = window.innerWidth - inEvent.pageX -31;
            this.$.btSplit.addStyles("right: " + this.splitWidth + "px;");
        }
    },

    seperatorDragFinish: function (inSender, inEvent) {
        if (this.drag) {
            var left = inEvent.pageX;
            var right = window.innerWidth - inEvent.pageX;
            var ggt = this.getGGT(left, right);
            this.$.mainView.addStyles("-webkit-box-flex: " + ggt.left + ";");
            this.$.splitPane.addStyles("-webkit-box-flex: " + ggt.right + ";");

            this.$.splitView.resizeHandler(true);
            this.$.mainView.resizeHandler(true);
        }
    },

    getGGT: function (a,b) {
        var a1=a;
        var b1=b;
        while (a1!=b1)
            if (a1>b1)
                a1=a1-b1;
            else
                b1=b1-a1;
        return {"left": a/a1, "right": b/a1};
    },

    //SPLIT VIEW

    handleSyncSplitView: function (inSender, inEvent) {
        if (this.$.splitView.getSync() && this.$.splitPane.showing) {
            if (inSender.goPrev) {
                this.$.splitView.setGoPrev(true);
                this.$.splitView.getVerses(this.$.mainView.getPassage().passage);
                inSender.setGoPrev(false);
            } else
                this.$.splitView.getVerses(this.$.mainView.getPassage().passage);
        }
    },

    handleSplitVerse: function (inSender, verse, passage) {
        //enyo.log(verse, passage);
        this.$.mainView.getVerses(passage, verse);
    },

    //APP MENU

    openModuleMgr: function (inSender, inEvent) {
        this.$.mainPane.selectViewByName("modManView");
    },

    openPrefs: function (inSender, inEvent) {
        this.$.mainPane.selectViewByName("prefs");
    },

    setDimm: function (inSender, inEvent) {
        if (inSender.dimm) {
            inSender.setCaption($L("Enable Auto Dimm"));
            inSender.dimm = false;
            enyo.windows.setWindowProperties(window, {blockScreenTimeout: true});
        } else {
            inSender.setCaption($L("Disable Auto Dimm"));
            inSender.dimm = true;
            enyo.windows.setWindowProperties(window, {blockScreenTimeout: false});
        }
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
        window.location = "http://developer.palm.com/appredirect/?packageid=de.zefanjas.biblezprohd";
    },

    openAbout: function ()  {
        this.$.biblezAbout.openAtCenter();
    },

    //PREFS
    changeBackground: function () {
        this.$.mainView.setBackground(biblez.background);
        this.$.splitView.setBackground(biblez.background);
    },

    changeScrolling: function (inSender, inEvent) {
        this.scrollingChanged = true;
    },

    //MISC

    saveSettings: function () {
        enyo.windows.setWindowProperties(window, {blockScreenTimeout: false});
        enyo.setCookie("passage", enyo.json.stringify(this.$.mainView.getPassage()));
        enyo.setCookie("mainModule", enyo.json.stringify(this.$.mainView.getCurrentModule()));
        enyo.setCookie("splitModule", enyo.json.stringify(this.$.splitView.getCurrentModule()));
        //enyo.setCookie("secondModule");
    },

    showError: function (inSender, message) {
        this.$.errorDialog.setError(message);
        this.$.errorDialog.openAtCenter();
    },

    resizeHandler: function() {
        //enyo.log("resized main");
        this.inherited(arguments);
        if (this.$.splitPane.showing) {
            var right = this.$.splitPane.hasNode().clientWidth-29;
            //enyo.log(right);
            this.$.btSplit.addStyles("right: " +  right + "px;");
        }
    }
});