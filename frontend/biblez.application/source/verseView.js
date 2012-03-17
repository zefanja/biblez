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
    name: "App.VerseView",
    kind: enyo.VFlexBox,
    events: {
        onPrevChapter: "",
        onNextChapter: "",
        onVerseTap: "",
        onShowNote: "",
        onShowFootnote: ""
    },
    components: [
            {kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
            {kind: "VFlexBox", name: "viewContainer", flex: 1, components: [
                {name: "verseSnapper", kind: "SnapScroller", index: 1, onSnap: "changeChapter", autoVertical: false, vertical: false, components: [
                    {name: "firstSnapper", kind: "VFlexBox", pack: "center", align: "end", components: [
                        {name: "prevChapter", content: "Previous Chapter", className: "chapter-nav-left chapter-nav"}
                    ]},
                    {kind: "BasicScroller", name: "mainScroller", autoVertical: false, vertical: false, autoHorizontal: false, horizontal: false, style: "overflow: visible;", components: [
                        {name: "plain", kind: "HtmlContent", className: "view-plain", content: "", showing: false},
                        {name: "view", kind: "HtmlContent", className: "view-verses", content: "", onLinkClick: "handleVerseTap"}
                    ]}
                ]}
            ]}
    ],

    published: {
        vnumber: 0,
        numberOfSnappers: 0,
        prevPassage: "< Previous Chapter",
        nextPassage: "Next Chapter >",
        popupLeft: 0,
        popupTop: 0,
        tappedVerse: 1,
        tappedNote: 0,
        currentFootnote: "",
        verses: [],
        view: "main",
        scrollHorizontal: true

    },

    rendered: function () {
        this.inherited(arguments);
        if (enyo.getCookie("scrolling")) {
            this.scrollHorizontal = enyo.json.parse(enyo.getCookie("scrolling"));
        }
        if (!this.scrollHorizontal)
            this.changeScrolling(this.scrollHorizontal, true);
    },

    changeScrolling: function (inScrolling, inDontSetSnappers) {
        this.scrollHorizontal = inScrolling;

        if(!inScrolling) {
            this.$.verseSnapper.setIndex(1);
            this.$.view.addRemoveClass("view-verses-single", true);
            this.$.view.addRemoveClass("view-verses", false);
            this.$.mainScroller.setVertical(true);
            this.$.mainScroller.setAutoVertical(true);
        } else {
            this.$.mainScroller.scrollIntoView(0,0);
            this.$.view.addRemoveClass("view-verses-single", false);
            this.$.view.addRemoveClass("view-verses", true);
            this.$.mainScroller.setVertical(false);
            this.$.mainScroller.setAutoVertical(false);
        }

        if(!inDontSetSnappers)
            this.setSnappers(this.vnumber);
    },

    //Testing Your Faith1James, a bond-servant of God and of the Lord Jesus Christ,To the twelve tribes who are dispersed abroad: Greetings.2Consider it all joy, my brethren, when you encounter various trials,3knowing that the testing of your faith produces endurance.4And let endurance have its perfect result, so that you may be perfect and complete, lacking in nothing.5But if any of you lacks wisdom, let him ask of God, who gives to all generously and without reproach, and it will be given to him.6But he must ask in faith without any doubting, for the one who doubts is like the surf of the sea, driven and tossed by the wind.7For that man ought not to expect that he will receive anything from the Lord,8being a double-minded man, unstable in all his ways.9But the brother of humble circumstances is to glory in his high position;10and the rich man is to glory in his humiliation, because like flowering grass he will pass away.11For the sun rises with a scorching wind and withers the grass; and its flower falls off and the beauty of its appearance is destroyed; so too the rich man in the midst of his pursuits will fade away.12Blessed is a man who perseveres under trial; for once he has been approved, he will receive the crown of life which the Lord has promised to those who love Him.13Let no one say when he is tempted, “I am being tempted by God”; for God cannot be tempted by evil, and He Himself does not tempt anyone.14But each one is tempted when he is carried away and enticed by his own lust.15Then when lust has conceived, it gives birth to sin; and when sin is accomplished, it brings forth death.16Do not be deceived, my beloved brethren.17Every good thing given and every perfect gift is from above, coming down from the Father of lights, with whom there is no variation or shifting shadow.18In the exercise of His will He brought us forth by the word of truth, so that we would be a kind of first fruits among His creatures.19This you know, my beloved brethren. But everyone must be quick to hear, slow to speak and slow to anger;20for the anger of man does not achieve the righteousness of God.21Therefore, putting aside all filthiness and all that remains of wickedness, in humility receive the word implanted, which is able to save your souls.22But prove yourselves doers of the word, and not merely hearers who delude themselves.23For if anyone is a hearer of the word and not a doer, he is like a man who looks at his natural face in a mirror;24for once he has looked at himself and gone away, he has immediately forgotten what kind of person he was.25But one who looks intently at the perfect law, the law of liberty, and abides by it, not having become a forgetful hearer but an effectual doer, this man will be blessed in what he does.26If anyone thinks himself to be religious, and yet does not bridle his tongue but deceives his own heart, this man’s religion is worthless.27Pure and undefiled religion in the sight of our God and Father is this: to visit orphans and widows in their distress, and to keep oneself unstained by the world.Testing Your Faith1James, a bond-servant of God and of the Lord Jesus Christ,To the twelve tribes who are dispersed abroad: Greetings.2Consider it all joy, my brethren, when you encounter various trials,3knowing that the testing of your faith produces endurance.4And let endurance have its perfect result, so that you may be perfect and complete, lacking in nothing.5But if any of you lacks wisdom, let him ask of God, who gives to all generously and without reproach, and it will be given to him.6But he must ask in faith without any doubting, for the one who doubts is like the surf of the sea, driven and tossed by the wind.7For that man ought not to expect that he will receive anything from the Lord,8being a double-minded man, unstable in all his ways.9But the brother of humble circumstances is to glory in his high position;10and the rich man is to glory in his humiliation, because like flowering grass he will pass away.11For the sun rises with a scorching wind and withers the grass; and its flower falls off and the beauty of its appearance is destroyed; so too the rich man in the midst of his pursuits will fade away.12Blessed is a man who perseveres under trial; for once he has been approved, he will receive the crown of life which the Lord has promised to those who love Him.13Let no one say when he is tempted, “I am being tempted by God”; for God cannot be tempted by evil, and He Himself does not tempt anyone.14But each one is tempted when he is carried away and enticed by his own lust.15Then when lust has conceived, it gives birth to sin; and when sin is accomplished, it brings forth death.16Do not be deceived, my beloved brethren.17Every good thing given and every perfect gift is from above, coming down from the Father of lights, with whom there is no variation or shifting shadow.18In the exercise of His will He brought us forth by the word of truth, so that we would be a kind of first fruits among His creatures.19This you know, my beloved brethren. But everyone must be quick to hear, slow to speak and slow to anger;20for the anger of man does not achieve the righteousness of God.21Therefore, putting aside all filthiness and all that remains of wickedness, in humility receive the word implanted, which is able to save your souls.22But prove yourselves doers of the word, and not merely hearers who delude themselves.23For if anyone is a hearer of the word and not a doer, he is like a man who looks at his natural face in a mirror;24for once he has looked at himself and gone away, he has immediately forgotten what kind of person he was.25But one who looks intently at the perfect law, the law of liberty, and abides by it, not having become a forgetful hearer but an effectual doer, this man will be blessed in what he does.26If anyone thinks himself to be religious, and yet does not bridle his tongue but deceives his own heart, this man’s religion is worthless.27Pure and undefiled religion in the sight of our God and Father is this: to visit orphans and widows in their distress, and to keep oneself unstained by the world.

    //VERSES STUFF

    setVerses: function (verses, vnumber) {
        //enyo.log("Set verses...");
        this.$.plain.hide();
        this.$.view.show();
        this.vnumber = vnumber;
        this.$.verseSnapper.setIndex(1);
        this.verses = verses;

        this.$.view.setContent(api.renderVerses(verses, vnumber, biblez.linebreak, this.view));

        this.setSnappers(vnumber);
    },

    setPlain: function (content) {
        this.$.plain.setContent("<center><b>" + content + "</b></center>");
        this.$.plain.show();
        this.$.view.hide();
        this.setSnappers();
    },

    handleVerseTap: function(inSender, inUrl) {
        //enyo.log(inUrl);
        var urlParams = biblezTools.getUrlParams(inUrl);
        if (inUrl.match(/.*\:\/\//i) == "verse://") {
            var verseID = (this.view === "main") ? "vn" : "vnSplit";
            this.tappedVerse = parseInt(inUrl.replace("verse://",""), 10);
            this.popupTop = enyo.byId(verseID + this.tappedVerse).getBoundingClientRect().top;
            this.popupLeft = enyo.byId(verseID + this.tappedVerse).getBoundingClientRect().left;
            this.doVerseTap();
        } else if (inUrl.match(/.*\:\/\//i) == "note://") {
            var noteID = (this.view === "main") ? "note" : "noteSplit";
            this.tappedNote = parseInt(inUrl.replace("note://","").split(":")[0], 10);
            this.tappedVerse = parseInt(inUrl.replace("note://","").split(":")[1], 10);
            this.popupTop = enyo.byId(noteID + this.tappedNote).getBoundingClientRect().top;
            this.popupLeft = enyo.byId(noteID + this.tappedNote).getBoundingClientRect().left;
            this.doShowNote();
        } else if (urlParams.action == "showNote") {
            var footnoteID = (this.view === "main") ? "footnote" : "footnoteSplit";
            //enyo.log(footnoteID);
            this.currentFootnote = this.verses[parseInt(urlParams.passage.split(":")[1], 10)-1].footnotes[parseInt(urlParams.value, 10)-1].body;
            //enyo.log(enyo.application.verses[parseInt(urlParams.passage.split(":")[1], 10)-1].footnotes[parseInt(urlParams.value, 10)-1].body);
            this.tappedVerse = parseInt(urlParams.passage.split(":")[1], 10);
            this.popupTop = enyo.byId(footnoteID + this.tappedVerse).getBoundingClientRect().top;
            this.popupLeft = enyo.byId(footnoteID + this.tappedVerse).getBoundingClientRect().left;
            this.doShowFootnote();
        }
    },

    setBookmarks: function(bookmarks) {
        var bmID = "bmIcon";
        if (this.view === "main") {
            biblez.mainBookmarks = bookmarks;
        } else {
            biblez.splitBookmarks = bookmarks;
            bmID = "bmIconSplit";
        }

        for (var i=0;i<bookmarks.length; i++) {
            enyo.byId(bmID+bookmarks[i].vnumber).innerHTML = "<a href='bookmark://" + i + ":" + bookmarks[i].vnumber + "'><img id='bookmark" + i + "' src='images/bookmark.png' /></a>";
            //enyo.byId("bmIconLeft"+bookmarks[i].vnumber).innerHTML = "<a href='bookmark://" + i + ":" + bookmarks[i].vnumber + "'><img id='bookmark" + i + "' src='images/bookmark.png' /></a>";
        }
    },

    setNotes: function(notes) {
        var noteIcon = "noteIcon";
        var noteID = "note";
        if (this.view === "main") {
            biblez.mainNotes = notes;
        } else {
            biblez.splitNotes = notes;
            noteIcon = "noteIconSplit";
            noteID = "noteSplit";
        }

        for (var i=0;i<notes.length; i++) {
            enyo.byId(noteIcon+notes[i].vnumber).innerHTML = "<a href='note://" + i + ":" + notes[i].vnumber + "'><img id='" + noteID + i + "' src='images/note.png' /></a>";
            //enyo.byId("noteIconLeft"+notes[i].vnumber).innerHTML = "<a href='note://" + i + ":" + notes[i].vnumber + "'><img id='note" + i + "' src='images/note.png' /></a>";
        }
    },

    setHighlights: function(highlights) {
        //biblez.highlights = highlights;
        for (var i=0;i<highlights.length; i++) {
            enyo.byId("verse"+highlights[i].vnumber).style.backgroundColor = highlights[i].color;
        }
    },

    //FONT SETTINGS

    setFontSize: function (size) {
        this.$.view.addStyles("font-size: " + size + "px;");
        if (this.vnumber !== 0)
            this.setSnappers(this.vnumber);
    },

    setFont: function (font) {
        this.$.view.addStyles("font-family: " + font + ";");
        if (this.vnumber !== 0)
            this.setSnappers(this.vnumber);
    },

    //CHAPTER STUFF

    setPrev: function () {
        this.$.prevChapter.setContent(this.prevPassage);
    },

    setNext: function () {
        this.$.nextChapter.setContent(this.nextPassage + " >");
    },

    changeChapter: function (inSender, inEvent) {
        //enyo.log(this.$.verseSnapper.index);
        if (this.$.verseSnapper.index === 0) {
            this.doPrevChapter();
        } else if (this.$.verseSnapper.index == this.numberOfSnappers + 2) {
            this.doNextChapter();
        }
    },

    setIndex: function (index) {
        this.$.verseSnapper.setIndex(index);
    },

    getIndex: function () {
        return this.$.verseSnapper.getIndex();
    },

    setSnappers: function (vnumber, resize) {
        //this.inherited(arguments);
        //enyo.log("Resize VerseView", vnumber, resize, this.$.verseSnapper.getIndex(), this.view);
        if (!biblez.isOpen || resize) {
            var comp = this.$.verseSnapper.getComponents();
            for (var i=0;i<comp.length;i++) {
                if (comp[i].name.search(/snapper\d+/) != -1 || comp[i].name.search("lastSnapper") != -1) {
                    comp[i].destroy();
                }
            }

            //enyo.log(this.$.mainScroller.node.scrollWidth);
            var height = this.$.viewContainer.node.clientHeight - 40;
            var width = this.$.viewContainer.node.clientWidth -40;

            this.$.mainScroller.addStyles("width: " + this.$.viewContainer.node.clientWidth + "px;");
            this.$.mainScroller.addStyles("height: " + this.$.viewContainer.node.clientHeight + "px;");
            this.$.view.addStyles("height: " + height + "px;");
            this.$.view.addStyles("width: " + width + "px;");

            //enyo.log(height, width);
            //enyo.log(this.$.mainScroller.node.scrollWidth,this.$.mainScroller.node.clientWidth, parseInt((this.$.mainScroller.node.scrollWidth - this.$.mainScroller.node.clientWidth) / this.$.mainScroller.node.clientWidth, 10)+1);

            this.numberOfSnappers = (this.$.mainScroller.node.scrollWidth > this.$.mainScroller.node.clientWidth) ? parseInt((this.$.mainScroller.node.scrollWidth - this.$.mainScroller.node.clientWidth) / this.$.mainScroller.node.clientWidth, 10)+1 : 0;
            //enyo.log(this.numberOfSnappers);
            this.$.firstSnapper.addStyles("width: " + this.$.viewContainer.node.clientWidth + "px;");

            var kindName = "";
            for (var j=0;j<this.numberOfSnappers; j++) {
                kindName = "snapper" + j;
                this.$.verseSnapper.createComponent({name: kindName, style: "width: " + this.$.viewContainer.node.clientWidth + "px;"}).render();
            }

            this.$.verseSnapper.createComponent({name: "lastSnapper", kind: "VFlexBox", pack: "center", align: "center", style: "-webkit-box-align: start;-webkit-box-pack: center; width: " + this.$.viewContainer.node.clientWidth + "px;", components: [{name: "nextChapter", content: this.nextPassage, className: "chapter-nav-right chapter-nav"}]}).render();

            if (vnumber) {
                var verseID = (this.view === "main") ? "vn" : "vnSplit";
                if (this.scrollHorizontal) {
                    //enyo.log(typeof vnumber, vnumber, enyo.byId(verseID + enyo.json.stringify(vnumber)).getBoundingClientRect().left, this.$.viewContainer.node.clientWidth);
                    this.$.verseSnapper.setIndex((this.view === "main") ? parseInt(enyo.byId(verseID + enyo.json.stringify(vnumber)).getBoundingClientRect().left / this.$.viewContainer.node.clientWidth, 10) + 1 : parseInt((enyo.byId(verseID + enyo.json.stringify(vnumber)).getBoundingClientRect().left - (window.innerWidth - this.$.viewContainer.node.clientWidth)) / this.$.viewContainer.node.clientWidth, 10) + 1);
                } else {
                    this.$.mainScroller.scrollIntoView(parseInt(enyo.byId(verseID + enyo.json.stringify(vnumber)).getBoundingClientRect().top, 10), 0);
                }
            } else if (resize) {
                this.$.verseSnapper.setIndex(this.$.verseSnapper.getIndex());
            } else {
                //this.$.verseSnapper.setIndex(1);
                //this.$.verseSnapper.setIndex(this.$.verseSnapper.getIndex());
            }

            this.setPrev();
            //this.setNext();
        }
    },

    windowRotated: function(inSender) {
        this.setSnappers(null, true);
    }
});