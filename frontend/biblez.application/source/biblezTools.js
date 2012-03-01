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

var biblezTools = {
	//dbSets: window.localStorage,

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
			var sqlNote = "CREATE TABLE IF NOT EXISTS notes (bnumber INTEGER, cnumber INTEGER, vnumber INTEGER, note TEXT, title TEXT, folder TEXT, tags TEXT);";
			var sqlBook = "CREATE TABLE IF NOT EXISTS bookmarks (bnumber INTEGER, cnumber INTEGER, vnumber INTEGER, title TEXT, folder TEXT, tags TEXT);";
			var sqlHighlight = "CREATE TABLE IF NOT EXISTS highlights (bnumber INTEGER, cnumber INTEGER, vnumber INTEGER, color TEXT, description TEXT);";
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
			var sql = "SELECT * FROM modules WHERE lang = '" + lang + "' AND (modType = 'texts' OR modType = 'comments') ORDER BY modType DESC, modName ASC;";
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

	removeNote: function (bnumber, cnumber, vnumber, inCallback) {
		enyo.log(bnumber, cnumber, vnumber);
		try {
			var sql = "DELETE FROM notes WHERE bnumber = '" + bnumber + "' AND cnumber = '" + cnumber + "' AND vnumber = '" + vnumber + "'";
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

	updateNote: function (bnumber, cnumber, vnumber, noteText, title, folder, tags, inCallback) {
		enyo.log(bnumber, cnumber, vnumber, noteText, title, folder, tags);
		try {
			var sql = 'UPDATE notes SET note = "' + noteText.replace(/"/g,"") + '", title = "' + title + '", folder = "' + folder + '", tags = "' + tags + '" WHERE bnumber = "' + bnumber + '" AND cnumber = "' + cnumber + '" AND vnumber = "' + vnumber + '"';
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
								if (results.rows.item(j).note.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).title.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).folder.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).tags.toLowerCase().search(searchTerm) !== -1 || enyo.application.bookNames[parseInt(results.rows.item(j).bnumber, 10)].abbrev.toLowerCase().search(searchTerm) !== -1) {
									notes.push({"bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "note": results.rows.item(j).note, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
								}
							} else {
								notes.push({"bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "note": results.rows.item(j).note, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
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

	updateBookmark: function (bnumber, cnumber, vnumber, title, folder, tags, inCallback) {
		enyo.log(bnumber, cnumber, vnumber, title, folder, tags);
		try {
			var sql = 'UPDATE bookmarks SET title = "' + title + '", folder = "' + folder + '", tags = "' + tags + '" WHERE bnumber = "' + bnumber + '" AND cnumber = "' + cnumber + '" AND vnumber = "' + vnumber + '"';
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

	removeBookmark: function (bnumber, cnumber, vnumber, inCallback) {
		//enyo.log(bnumber, cnumber, vnumber);
		try {
			var sql = "DELETE FROM bookmarks WHERE bnumber = '" + bnumber + "' AND cnumber = '" + cnumber + "' AND vnumber = '" + vnumber + "'";
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
								if (results.rows.item(j).title.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).folder.toLowerCase().search(searchTerm) !== -1 || results.rows.item(j).tags.toLowerCase().search(searchTerm) !== -1 || enyo.application.bookNames[parseInt(results.rows.item(j).bnumber, 10)].abbrev.toLowerCase().search(searchTerm) !== -1) {
									bm.push({"bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
								}
							} else {
								bm.push({"bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
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

	removeHighlight: function (bnumber, cnumber, vnumber, inCallback) {
		enyo.log(bnumber, cnumber, vnumber);
		try {
			var sql = "DELETE FROM highlights WHERE bnumber = '" + bnumber + "' AND cnumber = '" + cnumber + "' AND vnumber = '" + vnumber + "'";
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

	updateHighlight: function (bnumber, cnumber, vnumber, color, descr, inCallback) {
		try {
			var sql = 'UPDATE highlights SET color = "' + color + '" WHERE bnumber = "' + bnumber + '" AND cnumber = "' + cnumber + '" AND vnumber = "' + vnumber + '"';
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
			var sql = (parseInt(bnumber) !== -1 && parseInt(cnumber) !== -1) ? "SELECT * FROM highlights WHERE bnumber = '" + bnumber + "' AND cnumber = '" + cnumber + "' ORDER BY vnumber ASC;" : "SELECT * FROM highlights ORDER BY bnumber, cnumber, vnumber ASC;";
		    //enyo.log(sql);
			//var sql = "SELECT * FROM notes;";
			this.db.transaction(
		        enyo.bind(this,(function (transaction) {
		            transaction.executeSql(sql, [],
					enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
							hl.push({"bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "color": results.rows.item(j).color, "descr": results.rows.item(j).description});
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
		var noteID = (view == "left") ? "noteIconLeft" : "noteIcon";
		var bmID = (view == "left") ? "bmIconLeft" : "bmIcon";
		var verseID = (view == "left") ? "verseLeft" : "verse";
		var fnID = (view == "left") ? "footnoteLeft" : "footnote";
		var notes = [];

		//enyo.log(noteID, bmID, verseID);

		for (var i=0; i<verses.length; i++) {
			//.replace(/\*x/g,"")
			tmpVerse = verses[i].content.replace(/color=\u0022red\u0022/g,"color=\u0022#E60000\u0022").replace(/\*x/g,"");
			//enyo.log(tmpVerse);

			if (view == "right" || enyo.application.footnotes === false) {
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
			//enyo.log(tmpVerse);
			if (verses[i].heading && enyo.application.heading === true) {
				content = content + "<div class='verse-heading'>" + verses[i].heading + "</div>";
			}
			content = content + "<a href='verse://" + verses[i].vnumber + "'>";
			content = content + " <span id='" + verses[i].vnumber + "' class='verse-number'>" + verses[i].vnumber + "</span> </a>";
			content = (parseInt(vnumber) != 1 && parseInt(vnumber) == parseInt(verses[i].vnumber)) ? content + "<span id='" + verseID + verses[i].vnumber +  "' class='verse-highlighted'>" + tmpVerse + "</span>" : content + "<span id='" + verseID + verses[i].vnumber +  "'>" + tmpVerse + "</span>";
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

	errorHandler: function (transaction, error) {
		enyo.log("ERROR", error.message);
	},

	logDB: function() {
		//enyo.log(this.db);
		try {
			var sql = 'SELECT * FROM modules;';
		    this.db.transaction(
		        enyo.bind(this,(function (transaction) {
		            transaction.executeSql(sql, [],
					enyo.bind(this, function (transaction, results) {
                        enyo.log(results.rows.item(1));
					}),
                    enyo.bind(this,this.errorHandler));
		        }))
		    );
		} catch (e) {
			enyo.log("ERROR", e);
		}
	}
};

enyo.kind({
	name: "FileService",
	kind: enyo.Component,
	components: [
	{
		kind: enyo.PalmService,
		name: "service",
		service: "palm://de.zefanjas.biblez.enyo.fileio/",
		method: "writefile",
		onSuccess: "handleSuccess",
		onFailure: "handleError"
	},
	{
		kind: enyo.PalmService,
		name: "readService",
		service: "palm://de.zefanjas.biblez.enyo.fileio/",
		method: "readfile",
		onSuccess: "handleSuccess",
		onFailure: "handleError"
	}
	],

	writeFile: function(path, content, callback) {
		// store the callback on the request object created by call
		this.$.service.call({"path": path, "content": content}, {"callback": callback});
	},

	readFile: function(path, callback) {
		// store the callback on the request object created by call
		this.$.readService.call({"path": path}, {"callback": callback});
	},

	handleSuccess: function(inSender, inResponse, inRequest) {
		inRequest.callback(inResponse);
		//enyo.log("PROVIDE DIR RESPONSE", inResponse);
	},

	handleError: function (inSender, inResponse, inRequest) {
		enyo.error("GOT AN ERROR!", inResponse);
		//inRequest.callback(inResponse);
	}
});