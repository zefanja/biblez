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
	name: "App.ModMan",
	kind: enyo.VFlexBox,
    events: {
        onUntar: "",
		onBack: "",
		onInstallModule: "",
		onRemove: "",
		onGetDetails: "",
        onGetRepos: "",
        onGetSync: "",
        onRefreshSource: "",
        onListModules: "",
        onGetModules: "",
        onModulesChanged: ""
    },
	published: {
		installedModules: [],
		moduleToRemove: {},
        moduleToInstall: "",
        lang: [],
        modules: [],
        modulePath: "",
        allModsPath: ""
	},
	components: [
        {kind: enyo.PalmService,
            name: "DownloadMgr",
            service: "palm://com.palm.downloadmanager/",
            method: "download",
            targetDir: "/media/internal/.sword/install",
            subscribe: true,
            onResponse: "updateStatus",
            onSuccess : "downloadFinished"
        },
		{kind: "Header", components: [
			{kind: "Button", caption: $L("Back"), onclick: "doBack"},
			{kind: "Spacer"},
			{content: $L("Module Manager")},
			{kind: "Spacer"},
			{kind: "Spinner", showing: false},
            {kind: "ListSelector", name: "repoSelector", onChange: "reloadRepo"}

		]},
        {name: "errorDialog", kind: "BibleZ.Error"},
        {name: "reposPopup", kind: "BibleZ.Repos", onAccept: "doGetSync", onSelectRepo: "callRefreshSource", onDenied: "doBack"},
		{name: "slidingPane", kind: "SlidingPane", flex: 1, components: [
			{name: "left", width: "320px", kind:"SlidingView", components: [
                {name: "scrollerLeft", kind: "Scroller", flex: 1, components: [
                    {name: "langList", kind: "VirtualRepeater", onSetupRow: "getLangListItem", components: [
						{name: "itemLang", kind: "Item", layoutKind: "HFlexLayout", tapHighlight: true, className: "list-item", components: [
							{name: "langCode", style: "width: 60px;"},
							{name: "langName", style: "font-style: italic;"}
						],
						onclick: "getModules"
						}]
					},
                    {name: "langHint", showing: false, className: "hint"}
                ]},
                {kind: "Toolbar", components: [
                    {kind: "GrabButton"},
					{kind: "Spacer"},
					{icon: "images/refresh.png", onclick: "doGetRepos"},
					{kind: "Spacer"}
                ]}
			]},
			{name: "middle", width: "320px", kind:"SlidingView", peekWidth: 50, components: [
                {name: "scrollerMiddle", kind: "Scroller", flex: 1, components: [
                    {name: "modList", kind: "VirtualRepeater", onSetupRow: "getModListItem", components: [
						{name: "itemMod", kind: "Item", layoutKind: "VFlexLayout", tapHighlight: true, className: "list-item", components: [
							{name: "modDivider", kind: "Divider"},
                            {name: "modName"}
						],
						onclick: "getDetails"
						}]
					},
					{name: "modHint", showing: false, className: "hint"}
                ]},
                {kind: "Toolbar", components: [
                    {kind: "GrabButton"}
                ]}
			]},
			{name: "right", kind:"SlidingView", flex: 1, components: [
                {name: "scrollerRight", kind: "Scroller", flex: 1, style: "background-color: transparent;", components: [
                    {name: "detailsContainer", components: [
						{name: "detailsName", className: "details-name"},
						{name: "detailsDescription", className: "details-descr"},
						{name: "detailsSize", className: "details-info"},
						{name: "detailsVersion", className: "details-info"},
						{name: "btInstall", kind: "ProgressButton", cancelable: false, position: 100, onclick: "downloadAddIn", className: "modules-button-install", components: [
							{kind: "HFlexBox", components: [
								{name:"btInstallCaption", content: $L("Install")}
							]}
						]},
                        //{name: "btInstall", kind: "ActivityButton", caption: $L("Install"), onclick: "downloadAddIn", className: "enyo-button-affirmative modules-button-install"},
						{name: "btRemove", caption: $L("Remove"), kind: "Button", onclick: "removeModule", className: "enyo-button-negative modules-button-remove"},
						{kind: "Divider", caption: $L("About")},
						{name: "detailsAbout", allowHtml: true, className: "details-info"},
						{kind: "Divider", caption: $L("Copyright & License")},
						{name: "detailsCopyright", className: "details-info"},
						{name: "detailsLicense", className: "details-info"},
						{name: "detailsAVN", className: "details-info"}
					]}
                ]},
                {kind: "Toolbar", components: [
                    {kind: "GrabButton"}
                ]}
			]}
		]}
	],

    create: function () {
        this.inherited(arguments);
		this.$.detailsContainer.hide();
    },

	refreshModules: function (inSender, inEvent) {
		this.$.spinner.show();
		enyo.windows.addBannerMessage($L("Downloading List of available Modules..."), enyo.json.stringify({}));
        this.$.DownloadMgr.call({target: "http://www.crosswire.org/ftpmirror/pub/sword/raw/mods.d.tar.gz", targetDir: "/media/internal/.sword/install"});
	},

    getRepos: function () {
        //enyo.log(enyo.application.dbSets.syncRepos);
        if (enyo.getCookie("syncRepos") !== "true") {
            this.$.reposPopup.openAtCenter();
        } else if (!enyo.getCookie("currentRepo")) {
            this.doGetRepos();
        } else {
            this.getLang();
        }
    },

    handleGotSyncConfig: function (reponse) {
        //enyo.log(reponse);
        if (enyo.json.parse(reponse).returnValue) {
            enyo.setCookie("syncRepos", "true");
            this.doGetRepos();
        } else {
            this.showError($L("Couldn't get repositories. Please check your internet connection!"));
            enyo.setCookie("syncRepos", "false");
        }
        this.$.reposPopup.setActivity(false);
    },

    handleGotRepos: function (reponse) {
        //enyo.log(this.$.reposPopup.showing);
        var repos = enyo.json.parse(reponse);
        if (repos.length !== 0) {
            enyo.setCookie("remoteRepos", reponse);
            this.$.reposPopup.setConfirmed(true);
            this.$.reposPopup.setRepos(repos);
            if(!this.$.reposPopup.showing)
                this.$.reposPopup.openAtCenter();
        } else {
            this.showError($L("No Repositories found :("));
        }
    },

    callRefreshSource: function () {
        this.$.spinner.show();
        this.doRefreshSource();
    },

    reloadRepo: function (inSender, inValue, inOldValue) {
        enyo.setCookie("currentRepo", inValue);
        this.doListModules();
    },

    downloadMods: function(update) {
		//console.log(enyo.json.stringify(this.dbSets["lastModUpdate"]));
        if (!enyo.application.dbSets.lastModUpdate) {
            console.log("mods.d.tar.gz missing. Downloading now...");
			enyo.windows.addBannerMessage($L("Downloading List of available Modules..."), enyo.json.stringify({}));
            this.$.DownloadMgr.call({target: "http://www.crosswire.org/ftpmirror/pub/sword/raw/mods.d.tar.gz", targetDir: "/media/internal/.sword/install"});
			//this.doUntar();
        } else {
			this.getLang();
		}
    },

	downloadAddIn: function () {
		this.$.btInstall.setPosition(0);
		this.$.btInstallCaption.setContent($L("Installing..."));
		/* url = "http://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/" + this.moduleToInstall + ".zip";
		console.log(url);
		this.$.DownloadMgr.call({target: url, targetDir: "/media/internal/.sword/install"});
        this.$.btInstall.setCaption($L("Installing..."));
        this.$.btInstall.setActive(true);
        this.$.btInstall.setDisabled(true); */
        this.doInstallModule();
	},

    updateStatus: function (inSender, inResponse) {
        this.log("STATUS", enyo.json.stringify(inResponse));
    },

    downloadFinished: function (inSender, inResponse) {
		console.log(enyo.json.stringify(inResponse));
		this.$.btInstall.setMaximum(inResponse.amountTotal);
		this.$.btInstall.setPosition(inResponse.amountReceived);
        if (inResponse.completed === true) {
            this.log("SUCCESS", "finished download");
			if (inResponse.url == "http://www.crosswire.org/ftpmirror/pub/sword/raw/mods.d.tar.gz") {
				this.allModsPath = inResponse.target;
				this.doUntar();
			} else if(inResponse.url.search("http://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/") !== -1) {
				console.log("DO UNZIP...");
				this.$.btInstallCaption.setContent($L("Installed"));
				this.modulePath = inResponse.target;
				this.doUnzip();
			}

        } else {
            this.log("INFO", "Downloading");
        }
    },

	getLang: function () {
		//this.$.langList.render();
		enyo.log("Getting languages...");
		api.getLang(enyo.bind(this, this.setLang));
        var repos = [];
        var tmpRepos = enyo.json.parse(enyo.getCookie("remoteRepos"));
        for (var i=0;i<tmpRepos.length; i++) {
            repos.push({caption: tmpRepos[i].name, value: tmpRepos[i].name});
        }
        this.$.repoSelector.setItems(repos);
        this.$.repoSelector.setValue(enyo.getCookie("currentRepo"));
	},

	setLang: function(lang) {
		//console.log(lang);
        this.$.scrollerLeft.scrollTo(0,0);
		this.lang = lang;
		this.$.langList.render();
        if (lang.length !== 0) {
            this.$.langHint.hide();
        } else {
            this.$.langHint.show();
            this.$.langHint.setContent($L("No Module available. Be sure to refresh the remote source first!"));
        }
		this.modules = [];
        this.$.modList.render();
        this.$.detailsContainer.hide();
        this.$.spinner.hide();

	},

	getLangListItem: function(inSender, inIndex) {
        var r = this.lang[inIndex];
		this.tmpLang = "";
        if (r) {
			//console.log(r + " - " + this.tmpLang);
			this.$.langCode.setContent(r);
			this.$.langName.setContent((languages[r]) ? (languages[r]) : r);

			var isRowSelected = (inIndex == this.lastLangItem);
			this.$.itemLang.applyStyle("background", isRowSelected ? "#3A8BCB" : null);
            return true;
        } else {
            return false;
        }
    },

	getModules: function (inSender, inEvent, rowIndex) {
		this.$.detailsContainer.hide();
		api.getModules(this.lang[rowIndex], enyo.bind(this, this.setModules));
		this.lastLangItem = rowIndex;
		this.lastModItem = null;
		this.$.langList.render();
		this.$.scrollerMiddle.scrollTo(0,0);
	},

	setModules: function (modules) {
		//console.log(modules);
		this.modules = modules;
		this.$.modList.render();
		if (modules.length !== 0) {
			this.$.modHint.hide();
		} else {
			this.$.modHint.show();
			this.$.modHint.setContent($L("No Module available"));
		}

	},

	getModListItem: function(inSender, inIndex) {
        var r = this.modules[inIndex];
        if (r) {
			this.$.modName.setContent(r.modName);
            if(inIndex === 0 || r.modType != this.modules[inIndex-1].modType) {
                this.$.modDivider.setCaption(mappings[r.modType]);
            } else {
                this.$.modDivider.hide();
            }
			var isRowSelected = (inIndex == this.lastModItem);
			this.$.itemMod.applyStyle("background", isRowSelected ? "#3A8BCB" : null);
            return true;
        } else {
            return false;
        }
    },

	getDetails: function (inSender, inEvent, rowIndex) {
		//this.$.spinner.show();
		this.lastModItem = rowIndex;
		this.$.modList.render();
		this.$.scrollerRight.scrollTo(0,0);

		this.moduleToInstall = this.modules[rowIndex].modName;
		this.doGetDetails();
	},

	showDetails: function (details) {
        details = enyo.json.parse(details);
		this.$.btInstall.show();
		this.$.btRemove.hide();
		this.$.btInstallCaption.setContent($L("Install"));
		this.$.btInstall.setMaximum(100);
		this.$.btInstall.setPosition(100);

		this.$.detailsName.setContent(details.name);
		this.$.detailsDescription.setContent(details.description);
		this.$.detailsAbout.setContent(details.about.replace(/\\par/g, "<br>"));
		this.$.detailsSize.setContent($L("Install Size") + ": " + Math.round(parseInt(details.installSize, 10) / 1048576 * 100) / 100 + " MB");
		this.$.detailsVersion.setContent($L("Version") + ": " + details.version);
		if (details.copyright) {this.$.detailsCopyright.setContent($L("Copyright") + ": " + details.copyright);}
		if (details.distributionLicense) {this.$.detailsLicense.setContent($L("License") + ": " + details.distributionLicense);}
		//this.$.detailsType.setContent($L("Type") + ": " + details.category);
		//var tmpLang = (languages[details.lang]) ? (languages[details.lang]) : details.lang;
		//this.$.detailsLang.setContent($L("Language") + ": " + tmpLang);

		for(var i=0;i<biblez.modules.length;i++) {
			if(biblez.modules[i].name ==  details.name) {
				this.$.btInstall.hide();
				this.$.btRemove.show();
				this.moduleToRemove = biblez.modules[i];
			}
		}

		this.$.detailsContainer.show();
		//this.$.spinner.hide();
	},

	removeModule: function(inSender, inEvent) {
		this.doRemove();
		this.$.btInstall.show();
		this.$.btRemove.hide();
	},

    handleRemove: function (response) {
        enyo.log("REMOVE: " + response);
        if (enyo.json.parse(response).returnValue) {
            enyo.windows.addBannerMessage($L("Uninstalled Module!"), enyo.json.stringify({}));
            this.doGetModules();
        }
    },

    handleInstalledModule: function (response) {
        if (enyo.json.parse(response).returnValue) {
            enyo.log("Installed Module!");
            enyo.windows.addBannerMessage(enyo.json.parse(response).message, enyo.json.stringify({}));
            this.setBtInstall();
            this.doGetModules();
        } else {
            this.showError(enyo.json.parse(response).message);
            this.$.modManView.stopSpinner();
        }
    },

    handleGetModules: function (modules) {
        biblez.modules = enyo.json.parse(modules);
        this.doModulesChanged();
    },

    showError: function (message) {
        this.$.errorDialog.setError(message);
        this.$.errorDialog.openAtCenter();
    },

    setBtInstall: function () {
        this.$.btInstallCaption.setContent($L("Installed"));
        this.$.btInstall.setMaximum(100);
        this.$.btInstall.setPosition(100);
        /* this.$.btInstall.setActive(spin);
        if (!spin)
            this.$.btInstall.setCaption($L("Installed"));
        */
    },

    setInstallProgress: function (response) {
        response = enyo.json.parse(response);
        this.$.btInstall.setMaximum(parseInt(response.total, 10));
        this.$.btInstall.setPosition(parseInt(response.completed, 10));
    },

	stopSpinner: function () {
		this.$.spinner.hide();
	}
});