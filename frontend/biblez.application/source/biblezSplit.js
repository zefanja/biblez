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
	name: "BibleZ.SplitView",
	kind: "HFlexBox",
    //style: "background: url('../images/background.png')",
    //className: "scroller-background",
    published: {
        linebreak: false,
        tappedVerse: 1,
        tappedNote: 0
    },
    events: {
        onLeftSnap: "",
        onVerseTap: "",
        onShowNote: "",
        onShowFootnote: "",
        onRotate: ""
    },
	components: [
        {kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{name: "leftSnapper", kind: "SnapScroller", flex: 1, className: "splitview-left", onSnap: "doLeftSnap", autoVertical: false, vertical: false, components: [
	        {className: "selector-scroller", components: [
                {name: "prevChapterLeft", content: "Previous Chapter", className: "chapter-nav-left chapter-nav"}
	        ]},
	        {name: "leftScroller", kind: "Scroller", className: "selector-scroller", components: [
                {name: "leftView", kind: "HtmlContent", allowHtml: true, content: "middle", className: "splitview-verse", onLinkClick: "handleVerseTap"}
	        ]},
	        {className: "selector-scroller", components: [
                {name: "nextChapterLeft", content: "Next Chapter", className: "chapter-nav-right chapter-nav"}
	        ]}
		]},
		{name: "rightSnapper", kind: "SnapScroller", flex: 1, onSnap: "", className: "splitview-right", autoVertical: false, vertical: false, components: [
			{name: "leftleft", className: "selector-scroller", components: [
                {name: "prevChapterRight", content: "Previous Chapter", className: "chapter-nav-left chapter-nav"}
            ]},
            {name: "rightScroller", kind: "Scroller", className: "selector-scroller", components: [
                {name: "rightView", kind: "HtmlContent", allowHtml: true, content: "middle", className: "splitview-verse"}
            ]},
            {name: "leftright", className: "selector-scroller", components: [
                {name: "nextChapterRight", content: "Next Chapter", className: "chapter-nav-right chapter-nav"}
            ]}
		]}
	],

    create: function () {
        this.inherited(arguments);
        this.$.leftright.hide();
        this.$.leftleft.hide();
    },

    handleVerseTap: function(inSender, inUrl) {
        //console.log(inUrl + " " + inUrl.match(/.*\:\/\//i));
        var urlParams = biblezTools.getUrlParams(inUrl);
        if (inUrl.match(/.*\:\/\//i) == "verse://") {
            this.tappedVerse = inUrl.replace("verse://","");
            enyo.application.tappedVerse = inUrl.replace("verse://","");
            this.popupTop = enyo.byId("verseLeft" + inUrl.replace("verse://","")).getBoundingClientRect().top;
            this.popupLeft = enyo.byId("verseLeft" + inUrl.replace("verse://","")).getBoundingClientRect().left;
            this.doVerseTap();
        } else if (inUrl.match(/.*\:\/\//i) == "note://") {
            this.tappedNote = parseInt(inUrl.replace("note://","").split(":")[0]);
            this.tappedVerse = parseInt(inUrl.replace("note://","").split(":")[1]);
            enyo.application.tappedNote = parseInt(inUrl.replace("note://","").split(":")[0]);
            enyo.application.tappedVerse = parseInt(inUrl.replace("note://","").split(":")[1]);
            this.popupTop = enyo.byId("noteLeft" + this.tappedNote).getBoundingClientRect().top;
            this.popupLeft = enyo.byId("noteLeft" + this.tappedNote).getBoundingClientRect().left;
            this.doShowNote();
        } else if (urlParams.action == "showNote") {
            enyo.application.currentFootnote = enyo.application.verses[parseInt(urlParams.passage.split(":")[1], 10)-1].footnotes[parseInt(urlParams.value, 10)-1].body;
            //enyo.log(enyo.application.verses[parseInt(urlParams.passage.split(":")[1], 10)-1].footnotes[parseInt(urlParams.value, 10)-1].body);
            this.tappedVerse = parseInt(urlParams.passage.split(":")[1], 10);
            this.popupTop = enyo.byId("footnoteLeft" + this.tappedVerse).getBoundingClientRect().top;
            this.popupLeft = enyo.byId("footnoteLeft" + this.tappedVerse).getBoundingClientRect().left;
            this.doShowFootnote();
        }

        //this.$.versePopup.openAt({top: top, left: left});
    },

    setBackground: function (className) {
        //this.$.leftSnapper.setClassName("splitview-left " + className);
        //this.$.rightSnapper.setClassName(className);
        //enyo.log(this.hasNode());
        this.setClassName(className);
    },

    setFontSize: function (size) {
        this.$.leftView.addStyles("font-size: " + size + "px;");
        this.$.rightView.addStyles("font-size: " + size + "px;");
    },

    setFont: function (font) {
        this.$.leftView.addStyles("font-family: " + font + ";");
        this.$.rightView.addStyles("font-family: " + font + ";");
    },

    setVersesLeft: function (verses, vnumber) {
        this.$.leftSnapper.setIndex(1);
        this.$.leftScroller.setScrollTop(0);
        //enyo.log(this.node.clientHeight, this.$.leftSnapper.node.clientHeight);
        this.$.leftScroller.addStyles("height: " + this.node.clientHeight + "px;");
        this.$.leftView.setContent(biblezTools.renderVerses(verses, vnumber, this.linebreak, "left"));
    },

    setVersesRight: function (verses, vnumber) {
        this.$.rightSnapper.setIndex(1);
        this.$.rightScroller.setScrollTop(0);
        //enyo.log(this.node.clientHeight, this.$.leftSnapper.node.clientHeight);
        this.$.rightScroller.addStyles("height: " + this.node.clientHeight + "px;");
        this.$.rightView.setContent(biblezTools.renderVerses(verses, vnumber, this.linebreak, "right"));
    },

    setNotes: function(notes) {
        enyo.application.notes = notes;
        for (var i=0;i<notes.length; i++) {
            enyo.byId("noteIconLeft"+notes[i].vnumber).innerHTML = "<a href='note://" + i + ":" + notes[i].vnumber + "'><img id='noteLeft" + i + "' src='images/note.png' /></a>";
        }
    },

    setBookmarks: function(bookmarks) {
        enyo.application.bookmarks = bookmarks;
        for (var i=0;i<bookmarks.length; i++) {
            enyo.byId("bmIconLeft"+bookmarks[i].vnumber).innerHTML = "<a href='bookmark://" + i + ":" + bookmarks[i].vnumber + "'><img id='bookmarkLeft" + i + "' src='images/bookmark.png' /></a>";
        }
    },

    setHighlights: function(highlights) {
        enyo.application.highlights = highlights;
        for (var i=0;i<highlights.length; i++) {
            enyo.byId("verseLeft"+ highlights[i].vnumber).style.backgroundColor = highlights[i].color;
        }
    },

    setMessageLeft: function (message) {
        this.$.leftSnapper.setIndex(1);
        this.$.leftView.setContent(message);
    },

    setMessageRight: function (message) {
        this.$.rightSnapper.setIndex(1);
        this.$.rightView.setContent(message);
    },

    setPrevChapterLeft: function (passage) {
        this.$.prevChapterLeft.setContent("< " + passage);
    },

    setNextChapterLeft: function (passage) {
        this.$.nextChapterLeft.setContent(passage + " >");
    },

    setPrevChapterRight: function (passage) {
        this.$.prevChapterRight.setContent("< " + passage);
    },

    setNextChapterRight: function (passage) {
        this.$.nextChapterRight.setContent(passage + " >");
    },

    getIndexLeft: function () {
       return this.$.leftSnapper.getIndex();
    },

    windowRotated: function(inSender) {
        var height = enyo.byId("main").clientHeight;
        var width = enyo.byId("main").clientWidth/2;
        var widthFull = enyo.byId("main").clientWidth;
        //enyo.log(height, width);
        this.$.leftScroller.addStyles("height: " + height + "px;");
        this.$.leftScroller.addStyles("width: " + width + "px;");
        this.$.rightScroller.addStyles("height: " + height + "px;");
        this.$.rightScroller.addStyles("width: " + width + "px;");

        this.$.leftSnapper.setIndex(this.$.leftSnapper.index);
        this.$.rightSnapper.setIndex(this.$.rightSnapper.index);

        //this.doRotate();
    }
});