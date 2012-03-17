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
    name: "BibleZ.SwordApi",
    kind: "VFlexBox",
    components: [
        {kind: "Hybrid", name: "sword", executable: "pluginSword", width:"0", height:"0", onPluginReady: "handlePluginReady", style: "float: left;"}
    ],
    events: {
        onSwordReady: "",
        onGetModules: "",
        onGetBooknames: "",
        onGetVerses: "",
        onGetVMax: "",
        onGetSyncConfig: "",
        onRefreshedSource: "",
        onGetRemoteModules: "",
        onInstalledModule: "",
        onProgress: "",
        onGetResults: "",
        onPluginError: ""
    },
    published: {
        pluginReady: false
    },

    create: function() {
        this.inherited(arguments);

        //SWORD CALLBACKS//

        //this.$.sword.addCallback("returnModules", enyo.bind(this, "handleInstalledModules"), true);
        //this.$.sword.addCallback("returnVerses", enyo.bind(this, "handleGetVerses"), true);
        //this.$.sword.addCallback("returnBooknames", enyo.bind(this, "handleBooknames"), true);
        //this.$.sword.addCallback("returnVMax", enyo.bind(this, "handleVMax"), true);
        /*this.$.sword.addCallback("returnUntar", enyo.bind(this, "handleUntar"), true); */
        this.$.sword.addCallback("returnUnzip", enyo.bind(this, "handleInstallModule"), true);
        /*this.$.sword.addCallback("returnRemove", enyo.bind(this, "handleRemove"), true);
        this.$.sword.addCallback("returnGetDetails", enyo.bind(this, "handleGetDetails"), true); */
        this.$.sword.addCallback("returnSearch", enyo.bind(this, "handleSearchResults"), true);
        this.$.sword.addCallback("returnProgress", enyo.bind(this, "handleProgress"), true);

        //InstallMgr
        this.$.sword.addCallback("returnSyncConfig", enyo.bind(this, "handleGotSyncConfig"), true);
        //this.$.sword.addCallback("returnRemoteSources", enyo.bind(this.$.modManView, this.$.modManView.handleGotRepos), true);
        this.$.sword.addCallback("returnRefreshRemoteSource", enyo.bind(this, "handleRefreshedSource"), true);
        this.$.sword.addCallback("returnListModules", enyo.bind(this, this.handleGetRemoteModules), true);
    },

    //SWORD API//

    handlePluginReady: function(inSender) {
        enyo.log("Plugin is ready.");
        this.pluginReady = true;
        this.doSwordReady();
    },

    getInstalledModules: function (inCallback) {
        try { var status = this.$.sword.callPluginMethodDeferred(inCallback, "getModules", "all"); }
        catch (e) { this.showError("Plugin exception: " + e);}
        /*if (this.pluginReady) {
            try { var status = this.$.sword.callPluginMethodDeferred(inCallback, "getModules", "all"); }
            catch (e) { this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("Plugin not ready!");
        }*/
    },

    handleInstalledModules: function (modules) {
        //enyo.log(modules);
        this.doGetModules(enyo.json.parse(modules));
    },

    getBooknames:function(inCallback, modName) {
        //enyo.log(modName);
        try {var status = this.$.sword.callPluginMethodDeferred(inCallback, "getBooknames", modName);}
        catch (e) {this.showError("Plugin exception: " + e);}
        /*if (this.pluginReady) {
            try {var status = this.$.sword.callPluginMethod("getBooknames", modName);}
            catch (e) {this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }*/
    },

    handleBooknames: function (bnames) {
        this.doGetBooknames(enyo.json.parse(bnames));
    },

    getVerses: function(inCallback, passage, module) {
        //enyo.log(passage, module);
        if(!module)
            module = enyo.json.parse(enyo.getCookie("mainModule")).name;
        try {var status = this.$.sword.callPluginMethodDeferred(inCallback, "getVerses", module, passage);}
        catch (e) {this.showError("Plugin exception: " + e);}
        /*if (this.pluginReady) {
            try {var status = this.$.sword.callPluginMethod("getVerses", module, passage);}
            catch (e) {this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }*/
    },

    handleGetVerses: function (verses, passage) {
        this.doGetVerses(enyo.json.parse(verses), enyo.json.parse(passage));
    },

    getVMax:function(inCallback, passage) {
        try {var status = this.$.sword.callPluginMethodDeferred(inCallback, "getVMax", passage);}
        catch (e) {this.showError("Plugin exception: " + e);}
        /*if (this.pluginReady) {
            try {var status = this.$.sword.callPluginMethod("getVMax", passage);}
            catch (e) {this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }*/
    },

    handleVMax: function (vmax) {
        this.doGetVMax(parseInt(vmax, 10));
    },

    getRemoteSources:function(inCallback) {
        try {var status = this.$.sword.callPluginMethodDeferred(inCallback, "listRemoteSources");}
        catch (e) {this.showError("Plugin exception: " + e);}
        /*if (this.pluginReady) {
            try {var status = this.$.plugin.callPluginMethod("listRemoteSources");}
            catch (e) {this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }*/
    },

    getSyncConfig:function() {
        enyo.log("Calling GetSyncConfig...");
        if (this.pluginReady) {
            try {var status = this.$.sword.callPluginMethod("syncConfig");}
            catch (e) {this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }
    },

    handleGotSyncConfig: function (response) {
        this.doGetSyncConfig(response);
    },

    getRefreshRemoteSource: function () {
        enyo.log("Calling getRefreshRemoteSource...", enyo.getCookie("currentRepo"));
        //enyo.log(enyo.application.dbSets.currentRepo);
        if (this.pluginReady) {
            try {var status = this.$.sword.callPluginMethod("refreshRemoteSource", enyo.getCookie("currentRepo"));}
            catch (e) {this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }
    },

    handleRefreshedSource: function (response) {
        this.doRefreshedSource(response);
    },

    getRemoteModules: function () {
        enyo.log("Calling getRemoteModules...", enyo.getCookie("currentRepo"));
        //enyo.log(enyo.application.dbSets.currentRepo);
        if (this.pluginReady) {
            try {var status = this.$.sword.callPluginMethod("remoteListModules", enyo.getCookie("currentRepo"));}
            catch (e) {this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }
    },

    handleGetRemoteModules: function (response) {
        //enyo.log("handleGetRemoteModules", response);
        this.doGetRemoteModules(response);
    },

    getModuleDetails: function (inCallback, module) {
        try { var status = this.$.sword.callPluginMethodDeferred(inCallback, "getModuleDetails", module, enyo.getCookie("currentRepo")); }
        catch (e) { this.showError("Plugin exception: " + e);}
        /*if (this.pluginReady) {
            try { var status = this.$.plugin.callPluginMethod("getModuleDetails", inSender.getModuleToInstall(), enyo.application.dbSets.currentRepo); }
            catch (e) { this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }*/
    },

    installModule: function(module) {
        //enyo.log("Calling installModule...", module);
        if (this.pluginReady) {
            try { var status = this.$.sword.callPluginMethod("remoteInstallModule", enyo.getCookie("currentRepo"), module); }
            catch (e) { this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }
    },

    handleInstallModule: function (response) {
        //enyo.log(response);
        this.doInstalledModule(response);
    },

    handleProgress: function (response) {
        //enyo.log(response);
        this.doProgress(response);
    },

    uninstallModule: function (inCallback, module) {
        //enyo.log(module);
        try { var status = this.$.sword.callPluginMethodDeferred(inCallback, "uninstallModule", module); }
        catch (e) { this.showError("Plugin exception: " + e);}
        /*if (this.pluginReady) {
            try { var status = this.$.plugin.callPluginMethod("uninstallModule", module); }
            catch (e) { this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }*/
    },

    search: function (module, searchTerm, searchScope, searchType, view) {
        //enyo.log("API:", module, searchTerm, searchScope, searchType);
        if (this.pluginReady) {
            try { var status = this.$.sword.callPluginMethod("search", module, searchTerm, searchScope, searchType, view); }
            catch (e) { this.showError("Plugin exception: " + e);}
        }
        else {
            this.showError("plugin not ready");
        }
    },

    handleSearchResults: function (results, view) {
        //enyo.log("API:", view);
        this.doGetResults(enyo.json.parse(results), view);
    },

    //MISC//

    showError: function (message) {
        enyo.error(message);
        this.doPluginError(message);
    }
});

var api = {

    //DATABASE API//
    createDB: function() {
        try {
            this.db = openDatabase('ext:settings', '', 'BibleZ Settings Data', 200000);
            enyo.log("Created/Opened database");
        } catch (e) {
            enyo.log("ERROR", e);
        }

        switch (this.db.version) {
            case '':
                enyo.log("Create Tables...");
                this.dbCreateTables('', "1");
            break;
            case "1":
                enyo.log("Update Tables to 2");
                this.dbCreateTables("1", "2");
            break;
            case "2":
                enyo.log("Update Tables to 3");
                //this.dbCreateTables("2", "3");
            break;
        }
    },

    dbCreateTables: function(oldVersion, newVersion) {
        try {
            var sqlNote = "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, bnumber INTEGER, cnumber INTEGER, vnumber INTEGER, note TEXT, title TEXT, folder TEXT, tags TEXT);";
            var sqlBook = "CREATE TABLE IF NOT EXISTS bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, bnumber INTEGER, cnumber INTEGER, vnumber INTEGER, title TEXT, folder TEXT, tags TEXT);";
            var sqlHighlight = "CREATE TABLE IF NOT EXISTS highlights (id INTEGER PRIMARY KEY AUTOINCREMENT, bnumber INTEGER, cnumber INTEGER, vnumber INTEGER, color TEXT, description TEXT);";
            this.db.changeVersion(oldVersion, newVersion,
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sqlNote, [],
                        enyo.bind(this, function () {enyo.log("SUCCESS: Created notes table");}),
                        enyo.bind(this,this.errorHandler)
                    );

                    transaction.executeSql(sqlBook, [],
                        enyo.bind(this, function () {enyo.log("SUCCESS: Created bookmarks table");}),
                        enyo.bind(this,this.errorHandler)
                    );

                    transaction.executeSql(sqlHighlight, [],
                        enyo.bind(this, function () {enyo.log("SUCCESS: Created highlights table");}),
                        enyo.bind(this,this.errorHandler)
                    );
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    prepareModules: function (modules, inCallback) {
        enyo.log("Prepare modules", modules.length, this.db);
        try {
            var sql = 'DROP TABLE IF EXISTS modules;';
            this.db.transaction(
                enyo.bind(this, function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("SUCCESS: Dropped modules table");
                        //this.importModuleData(modules);
                        try {
                            var sql = 'CREATE TABLE IF NOT EXISTS modules (lang TEXT, modType TEXT, modName TEXT, descr TEXT);';
                            this.db.transaction(
                                enyo.bind(this,function (transaction) {
                                    transaction.executeSql(sql, [],
                                    enyo.bind(this, function () {
                                        enyo.log("SUCCESS: Created modules table");
                                        this.importModuleData(modules, inCallback);
                                    }),
                                    enyo.bind(this,this.errorHandler));
                                })
                            );
                        } catch (e) {
                            enyo.log("ERROR", e);
                        }
                    }),
                    enyo.bind(this,this.errorHandler));
                })
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    importModuleData: function(modules, inCallback)  {
        enyo.log("Reading Module Data...");
        var z = 0;
        try {
            var sql = "";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    sql = "INSERT INTO modules (lang, modType, modName, descr) VALUES (?,?,?,?)";
                    //enyo.log(sql);
                    for(var i=0; i<modules.length; i++) {
                        if(modules[i].datapath) {
                            transaction.executeSql(sql, [modules[i].lang, modules[i].datapath.split("/")[2], modules[i].name, modules[i].description],
                            enyo.bind(this, function () {
                                //enyo.log("SUCCESS: Insert Module " + z);
                                z++;
                                if (z == modules.length) {
                                    //var date = new Date();
                                    //enyo.application.dbSets.lastModUpdate = enyo.json.stringify({"lastUpdate": date.getTime()});
                                    inCallback();
                                }
                            }),
                            enyo.bind(this,this.errorHandler));
                        } else {
                            z++;
                        }
                    }
                    if(modules.length === 0)
                        inCallback();
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    getLang: function (inCallback) {
        var lang = [];
        try {
            var sql = 'SELECT lang FROM modules ORDER BY lang ASC;';
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
                            if (results.rows.item(j).lang !== "undefined") {
                                if (j === 0) {
                                    lang.push(results.rows.item(j).lang);
                                } else if (results.rows.item(j).lang !== results.rows.item(j-1).lang) {
                                    lang.push(results.rows.item(j).lang);
                                }
                            }
                        }
                        inCallback(lang);
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    getModules: function (lang, inCallback) {
        var modules = [];
        try {
            //var sql = "SELECT * FROM modules WHERE lang = '" + lang + "' AND modType = 'texts' ORDER BY modType, modName ASC;";
            var sql = "SELECT * FROM modules WHERE lang = '" + lang + "' ORDER BY modType DESC, modName ASC;"; //AND (modType = 'texts' OR modType = 'comments')
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
                            modules.push({"lang": results.rows.item(j).lang, "modName": results.rows.item(j).modName, "modType": results.rows.item(j).modType, "descr": results.rows.item(j).descr});
                        }
                        inCallback(modules);
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    addNote: function (bnumber, cnumber, vnumber, noteText, title, folder, tags, inCallback) {
        enyo.log(bnumber, cnumber, vnumber, noteText, title, folder, tags);
        try {
            var sql = "INSERT INTO notes (bnumber, cnumber, vnumber, note, title, folder, tags) VALUES (?,?,?,?,?,?,?)";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [bnumber, cnumber, vnumber, noteText, title, folder, tags],
                    enyo.bind(this, function () {
                        enyo.log("Successfully inserted note!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    removeNote: function (id, inCallback) {
        try {
            var sql = "DELETE FROM notes WHERE id = '" + id + "'";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully deleted note!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    updateNote: function (id, noteText, title, folder, tags, inCallback) {
        try {
            var sql = 'UPDATE notes SET note = "' + noteText.replace(/"/g,"") + '", title = "' + title + '", folder = "' + folder + '", tags = "' + tags + '" WHERE id = "' + id + '"';
            enyo.log(sql);
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully updated note!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    getNotes: function(bnumber, cnumber, inCallback, searchTerm) {
        //enyo.log("NOTES: ", bnumber, cnumber);
        var notes = [];
        try {
            var sql = (parseInt(bnumber, 10) !== -1 && parseInt(cnumber, 10) !== -1) ? "SELECT * FROM notes WHERE bnumber = '" + bnumber + "' AND cnumber = '" + cnumber + "' ORDER BY vnumber ASC;" : "SELECT * FROM notes ORDER BY bnumber, cnumber, vnumber ASC;";
            //enyo.log(sql);
            //var sql = "SELECT * FROM notes;";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
                            if (searchTerm) {
                                if (results.rows.item(j).note.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).title.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).folder.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).tags.toLowerCase().search(searchTerm) !== -1 || biblez.bookNames[parseInt(results.rows.item(j).bnumber, 10)].abbrev.toLowerCase().search(searchTerm) !== -1) {
                                    notes.push({"id": results.rows.item(j).id, "bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "note": results.rows.item(j).note, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
                                }
                            } else {
                                notes.push({"id": results.rows.item(j).id, "bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "note": results.rows.item(j).note, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
                            }
                        }
                        inCallback(notes);
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    addBookmark: function (bnumber, cnumber, vnumber, title, folder, tags, inCallback) {
        enyo.log(bnumber, cnumber, vnumber, title, folder, tags);
        try {
            var sql = "INSERT INTO bookmarks (bnumber, cnumber, vnumber, title, folder, tags) VALUES (?,?,?,?,?,?)";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [bnumber, cnumber, vnumber, title, folder, tags],
                    enyo.bind(this, function () {
                        enyo.log("Successfully inserted bookmark!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    updateBookmark: function (id, title, folder, tags, inCallback) {
        //enyo.log(bnumber, cnumber, vnumber, title, folder, tags);
        try {
            var sql = 'UPDATE bookmarks SET title = "' + title + '", folder = "' + folder + '", tags = "' + tags + '" WHERE id = "' + id + '"';
            enyo.log(sql);
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully updated bookmark!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    removeBookmark: function (id, inCallback) {
        //enyo.log(bnumber, cnumber, vnumber);
        try {
            var sql = "DELETE FROM bookmarks WHERE id = '" + id + "'";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully deleted bookmark!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    getBookmarks: function(bnumber, cnumber, inCallback, searchTerm) {
        //enyo.log("BM: ", bnumber, cnumber);
        var bm = [];
        var sql = "";
        try {
            sql = (parseInt(bnumber, 10) !== -1 && parseInt(cnumber, 10) !== -1) ? "SELECT * FROM bookmarks WHERE bnumber = '" + bnumber + "' AND cnumber = '" + cnumber + "' ORDER BY vnumber ASC;" : "SELECT * FROM bookmarks ORDER BY bnumber, cnumber, vnumber ASC;";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
                            if (searchTerm) {
                                if (results.rows.item(j).title.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).folder.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).tags.toLowerCase().search(searchTerm) !== -1 || biblez.bookNames[parseInt(results.rows.item(j).bnumber, 10)].abbrev.toLowerCase().search(searchTerm) !== -1) {
                                    bm.push({"id": results.rows.item(j).id, "bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
                                }
                            } else {
                                bm.push({"id": results.rows.item(j).id, "bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
                            }
                        }
                        inCallback(bm);
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    getFolders: function (inCallback) {
        var folders = [];
        var sql = "";
        try {
            sql = "SELECT folder FROM bookmarks UNION SELECT folder FROM notes ORDER BY folder ASC";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
                            //enyo.log(results.rows.item(j));
                            if (results.rows.item(j).folder !== "" && results.rows.item(j).folder !== results.rows.item(j-1).folder) {
                                folders.push(results.rows.item(j).folder);
                            }
                        }
                        inCallback(folders);
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    addHighlight: function (bnumber, cnumber, vnumber, color, descr, inCallback) {
        enyo.log(bnumber, cnumber, vnumber, color, descr);
        try {
            var sql = "INSERT INTO highlights (bnumber, cnumber, vnumber, color, description) VALUES (?,?,?,?,?)";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [bnumber, cnumber, vnumber, color, descr],
                    enyo.bind(this, function () {
                        enyo.log("Successfully inserted highlight!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    removeHighlight: function (id, inCallback) {
        try {
            var sql = "DELETE FROM highlights WHERE id = '" + id + "'";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully deleted highlight!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    updateHighlight: function (id, color, descr, inCallback) {
        try {
            var sql = 'UPDATE highlights SET color = "' + color + '" WHERE id = "' + id + '"';
            //enyo.log(sql);
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully updated highlight!");
                        inCallback();
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    getHighlights: function(bnumber, cnumber, inCallback) {
        //enyo.log("NOTES: ", bnumber, cnumber);
        var hl = [];
        try {
            var sql = (parseInt(bnumber, 10) !== -1 && parseInt(cnumber, 10) !== -1) ? "SELECT * FROM highlights WHERE bnumber = '" + bnumber + "' AND cnumber = '" + cnumber + "' ORDER BY vnumber ASC;" : "SELECT * FROM highlights ORDER BY bnumber, cnumber, vnumber ASC;";
            //enyo.log(sql);
            //var sql = "SELECT * FROM notes;";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
                            hl.push({"id": results.rows.item(j).id, "bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "color": results.rows.item(j).color, "descr": results.rows.item(j).description});
                        }
                        inCallback(hl);
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.log("ERROR", e);
        }
    },

    //RESTORE STUFF

    restoreBookmarks: function (content, inCallback) {
        z = 0;
        try {
            var sql = "DELETE FROM bookmarks";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully deleted bookmark table!");
                        var sql = "INSERT INTO bookmarks (bnumber, cnumber, vnumber, title, folder, tags) VALUES (?,?,?,?,?,?)";
                        for(var i=0; i<content.length; i++) {
                            transaction.executeSql(sql, [content[i].bnumber, content[i].cnumber, content[i].vnumber, content[i].title, content[i].folder, content[i].tags],
                            function () {
                                z++;
                                if (z == content.length) {
                                    inCallback();
                                }
                            },
                            enyo.bind(this,this.errorHandler));
                        }
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.error("ERROR", e);
        }
    },

    restoreNotes: function (content, inCallback) {
        z = 0;
        try {
            var sql = "DELETE FROM notes";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully deleted notes table!");
                        var sql = "INSERT INTO notes (bnumber, cnumber, vnumber, note, title, folder, tags) VALUES (?,?,?,?,?,?,?)";
                        for(var i=0; i<content.length; i++) {
                            transaction.executeSql(sql, [content[i].bnumber, content[i].cnumber, content[i].vnumber, content[i].note, content[i].title, content[i].folder, content[i].tags],
                            function () {
                                z++;
                                if (z == content.length) {
                                    inCallback();
                                }
                            },
                            enyo.bind(this,this.errorHandler));
                        }
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.error("ERROR", e);
        }
    },

    restoreHighlights: function (content, inCallback) {
        z = 0;
        try {
            var sql = "DELETE FROM highlights";
            this.db.transaction(
                enyo.bind(this,(function (transaction) {
                    transaction.executeSql(sql, [],
                    enyo.bind(this, function () {
                        enyo.log("Successfully deleted highlights table!");
                        var sql = "INSERT INTO highlights (bnumber, cnumber, vnumber, color, description) VALUES (?,?,?,?,?)";
                        for(var i=0; i<content.length; i++) {
                            transaction.executeSql(sql, [content[i].bnumber, content[i].cnumber, content[i].vnumber, content[i].color, content[i].descr],
                            function () {
                                z++;
                                if (z == content.length) {
                                    inCallback();
                                }
                            },
                            enyo.bind(this,this.errorHandler));
                        }
                    }),
                    enyo.bind(this,this.errorHandler));
                }))
            );
        } catch (e) {
            enyo.error("ERROR", e);
        }
    },

    renderVerses: function (verses, vnumber, linebreak, view) {
        var findBreak = "";
        var content = "";
        var tmpVerse = "";
        var noteID = (view == "split") ? "noteIconSplit" : "noteIcon";
        var bmID = (view == "split") ? "bmIconSplit" : "bmIcon";
        var verseID = (view == "split") ? "verseSplit" : "verse";
        var vnID = (view == "split") ? "vnSplit" : "vn";
        var fnID = (view == "split") ? "footnoteSplit" : "footnote";
        var notes = [];

        for (var i=0; i<verses.length; i++) {
            //.replace(/\*x/g,"")
            tmpVerse = verses[i].content.replace(/color=\u0022red\u0022/g,"color=\u0022#E60000\u0022").replace(/\*x/g,"");
            //enyo.log(tmpVerse);

            if (!biblez.footnote) {
                tmpVerse = tmpVerse.replace(/<small><sup[^>]*>\*n<\/sup><\/small>/g, "");
            } else {
                tmpVerse = tmpVerse.replace(/<small><sup[^>]*>\*n<\/sup><\/small>/g, " <img id='" + fnID + verses[i].vnumber + "' src='images/footnote.png' />");
            }

            if (tmpVerse.search("<br /><br />") != -1) {
                findBreak = "<br /><br />";
                tmpVerse = tmpVerse.replace(/<br \/><br \/>/g, "");
            } else {
                findBreak = "";
            }
            if (verses[i].intro && biblez.intro) {
                //enyo.log("Intro:", verses[i].intro);
                content = content + "<div class='verse-intro'>" + verses[i].intro + "</div>";
            }

            if (verses[i].heading && biblez.heading) {
                //enyo.log("Heading:", verses[i].heading);
                content = content + "<div class='verse-heading'>" + verses[i].heading.replace(/<[^>]*>?/g, "") + "</div>";
            }
            content = content + "<a href='verse://" + verses[i].vnumber + "'>";
            content = content + " <span id='" + vnID + verses[i].vnumber + "' class='verse-number'>" + verses[i].vnumber + "</span> </a>";
            content = (parseInt(vnumber, 10) != 1 && parseInt(vnumber, 10) == parseInt(verses[i].vnumber, 10)) ? content + "<span id='" + verseID + verses[i].vnumber +  "' class='verse-highlighted'>" + tmpVerse + "</span>" : content + "<span id='" + verseID + verses[i].vnumber +  "'>" + tmpVerse + "</span>";
            content = content + " <span id='" + noteID + verses[i].vnumber + "'></span> ";
            content = content + " <span id='" + bmID + verses[i].vnumber + "'></span> ";
            content = content + findBreak;

            if (linebreak) {
                content = content + "<br>";
            }
        }
        //enyo.log(content);
        return content;
    },

    getUrlParams: function (url) {
        var params = {};
        //enyo.log(url);
        if (url.search("&") != -1) {
            var tmpUrl = url.split("?")[1];
            if (tmpUrl.search("&") != -1 && tmpUrl.search("=") -1) {
                for (var i=0; i<tmpUrl.split("&").length; i++) {
                    params[tmpUrl.split("&")[i].split("=")[0]] = decodeURIComponent(tmpUrl.split("&")[i].split("=")[1]);
                }
            }
            //enyo.log(enyo.json.stringify(params));
            return params;
        } else {
            return params;
        }

    },

    //MISC//
    showError: function (message) {
        enyo.error(message);
    }
};

var biblez = {};