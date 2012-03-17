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

#include <stdio.h>
#include <string>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <fstream>
#include <sys/types.h>
#include <dirent.h>
#include <errno.h>
#include <vector>
#include <algorithm>
#include <iterator>

#include "unzip.h"
#include <regex.h>
#include <pthread.h>

/*PALM/HP HEADER */
#include "SDL.h"
#include "PDL.h"

/*SWORD HEADER */
#include <swmgr.h>
#include <swmodule.h>
#include <markupfiltmgr.h>
#include <listkey.h>
#include <versekey.h>
#include <swlocale.h>
#include <localemgr.h>
#include <installmgr.h>
#include <ftptrans.h>
#include <filemgr.h>

#define WRITEBUFFERSIZE (20971520) // 20Mb buffer

using namespace sword;

SWMgr *displayLibrary = 0;
SWMgr *searchLibrary = 0;

std::string searchModule = "";
std::string searchTerm = "";
std::string searchScope = "";
std::string verseView = "";
std::string remoteSource = "";
std::string modName = "";
int searchType = -2;

std::string convertString(std::string s) {
    std::stringstream ss;
    for (size_t i = 0; i < s.length(); ++i) {
        if (unsigned(s[i]) < '\x20' || s[i] == '\\' || s[i] == '"') {
            ss << "\\u" << std::setfill('0') << std::setw(4) << std::hex << unsigned(s[i]);
        } else {
            ss << s[i];
        }
    }
    return ss.str();
}

void splitstring(std::string str, std::string separator, std::string &first, std::string &second) {
	size_t i = str.find(separator); //find seperator
	if(i != std::string::npos) {
		size_t y = 0;
		if(!str.empty()) {
			first=""; second="";
			while(y != i) {
				first += str[y++]; //creating first string
			}
			y += separator.length(); //jumping forward separator length
			while(y != str.length()) {
				second += str[y++]; //creating second string
			}
		}
	} else {
		first = str;
		second = ""; //if seperator is not there then second string == empty string
	}
}

int getdir (std::string dir, std::vector<std::string> &files)
{
    DIR *dp;
    struct dirent *dirp;
    if((dp  = opendir(dir.c_str())) == NULL) {
        std::cout << "Error(" << errno << ") opening " << dir << std::endl;
        return errno;
    }

    while ((dirp = readdir(dp)) != NULL) {
        files.push_back(std::string(dirp->d_name));
    }
    closedir(dp);
    return 0;
}

std::string UpToLow(std::string str) {
    for (int i=0;i<strlen(str.c_str());i++)
        if (str[i] >= 0x41 && str[i] <= 0x5A)
            str[i] = str[i] + 0x20;
    return str;
}

std::vector<std::string> split(const std::string& s, const std::string& delim, const bool keep_empty = true) {
    std::vector<std::string> result;
    if (delim.empty()) {
        result.push_back(s);
        return result;
    }
    std::string::const_iterator substart = s.begin(), subend;
    while (true) {
        subend = search(substart, s.end(), delim.begin(), delim.end());
        std::string temp(substart, subend);
        if (keep_empty || !temp.empty()) {
            result.push_back(temp);
        }
        if (subend == s.end()) {
            break;
        }
        substart = subend + delim.size();
    }
    return result;
}

void refreshManagers() {
	delete displayLibrary;
	delete searchLibrary;
	displayLibrary = new SWMgr(new MarkupFilterMgr(FMT_HTMLHREF));
	searchLibrary = new SWMgr();
    displayLibrary->setGlobalOption("Footnotes","On");
	displayLibrary->setGlobalOption("Headings", "On");
	//displayLibrary->setGlobalOption("Strong's Numbers", "On");
}

/*INSTALL MANAGER STUFF */

SWMgr *mgr = 0;
InstallMgr *installMgr = 0;
StatusReporter *statusReporter = 0;
SWBuf baseDir;
SWBuf confPath;

void usage(const char *progName = 0, const char *error = 0);

class MyInstallMgr : public InstallMgr {
public:
	MyInstallMgr(const char *privatePath = "./", StatusReporter *sr = 0) : InstallMgr(privatePath, sr) {}

virtual bool isUserDisclaimerConfirmed() const {
	/*static bool confirmed = false;
        if (!confirmed) {
		cout << "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n";
		cout << "                -=+* WARNING *+=- -=+* WARNING *+=-\n\n\n";
		cout << "Although Install Manager provides a convenient way for installing\n";
		cout << "and upgrading SWORD components, it also uses a systematic method\n";
		cout << "for accessing sites which gives packet sniffers a target to lock\n";
		cout << "into for singling out users. \n\n\n";
		cout << "IF YOU LIVE IN A PERSECUTED COUNTRY AND DO NOT WISH TO RISK DETECTION,\n";
		cout << "YOU SHOULD *NOT* USE INSTALL MANAGER'S REMOTE SOURCE FEATURES.\n\n\n";
		cout << "Also, Remote Sources other than CrossWire may contain less than\n";
		cout << "quality modules, modules with unorthodox content, or even modules\n";
		cout << "which are not legitimately distributable.  Many repositories\n";
		cout << "contain wonderfully useful content.  These repositories simply\n";
		cout << "are not reviewed or maintained by CrossWire and CrossWire\n";
		cout << "cannot be held responsible for their content. CAVEAT EMPTOR.\n\n\n";
		cout << "If you understand this and are willing to enable remote source features\n";
		cout << "then type yes at the prompt\n\n";
		cout << "enable? [no] ";

		char prompt[10];
		fgets(prompt, 9, stdin);
		confirmed = (!strcmp(prompt, "yes\n"));
		cout << "\n";
	}
	return confirmed; */
	return true;
}
};

class MyStatusReporter : public StatusReporter {
	int last;
        virtual void statusUpdate(double dltotal, double dlnow) {
			/*int p = 74 * (int)(dlnow / dltotal);
			for (;last < p; ++last) {
				if (!last) {
					SWBuf output;
					output.setFormatted("[ File Bytes: %ld", (long)dltotal);
					while (output.size() < 75) output += " ";
					output += "]";
					std::cout << output.c_str() << "\n ";
				}
				std::cout << "-";
			}
			std::cout.flush(); */
		}

        virtual void preStatus(long totalBytes, long completedBytes, const char *message) {
			std::stringstream out;

			out << "{\"total\": \"" << totalBytes << "\", \"completed\": \"" << completedBytes << "\"}";

			const std::string& tmp = out.str();
			const char* cstr = tmp.c_str();

		    const char *params[1];
			params[0] = cstr;
			PDL_Err mjErr = PDL_CallJS("returnProgress", params, 1);
			/*SWBuf output;
			output.setFormatted("[ Total Bytes: %ld; Completed Bytes: %ld", totalBytes, completedBytes);
			while (output.size() < 75) output += " ";
			output += "]";
			std::cout << "\n" << output.c_str() << "\n ";
			int p = 74 * (int)((double)completedBytes/totalBytes);
			for (int i = 0; i < p; ++i) { std::cout << "="; }
			std::cout << "\n\n" << message << "\n";
			last = 0; */
		}
};


void init() {
	if (!mgr) {
		mgr = new SWMgr();

		if (!mgr->config)
			std::cout << "ERROR: SWORD configuration not found.  Please configure SWORD before using this program.";

		SWBuf baseDir = "/media/internal";
		if (baseDir.length() < 1) baseDir = ".";
		baseDir += "/.sword/InstallMgr";
		//PDL_Log("HELLO " + baseDir.c_str());
		confPath = baseDir + "/InstallMgr.conf";
		statusReporter = new MyStatusReporter();
		installMgr = new MyInstallMgr(baseDir, statusReporter);
	}
}


// clean up and exit if status is 0 or negative error code
void finish(int status) {
	delete statusReporter;
	delete installMgr;
	delete mgr;

	installMgr = 0;
	mgr        = 0;

	if (status < 1) {
		std::cout << "\n";
		exit(status);
	}
}


void createBasicConfig(bool enableRemote, bool addCrossWire) {

	FileMgr::createParent(confPath.c_str());
	remove(confPath.c_str());

	InstallSource is("FTP");
	is.caption = "CrossWire";
	is.source = "ftp.crosswire.org";
	is.directory = "/pub/sword/raw";

	SWConfig config(confPath.c_str());
	config["General"]["PassiveFTP"] = "true";
	if (enableRemote) {
		config["Sources"]["FTPSource"] = is.getConfEnt();
	}
	config.Save();
}


void initConfig() {
	init();
	bool enable = true; //installMgr->isUserDisclaimerConfirmed();
	createBasicConfig(enable, true);
}

void *syncConfig(void *foo) {
//int syncConfig() {
	std::stringstream sources;
	init();

	// be sure we have at least some config file already out there
	if (!FileMgr::existsFile(confPath.c_str())) {
		createBasicConfig(true, true);
		finish(1); // cleanup and don't exit
		init();    // re-init with InstallMgr which uses our new config
	}

	if (!installMgr->refreshRemoteSourceConfiguration())
		sources << "{\"returnValue\": true}";
	else
		sources << "{\"returnValue\": false}";

	const std::string& tmp = sources.str();

    const char *params[1];
	params[0] = tmp.c_str();
	PDL_Err mjErr = PDL_CallJS("returnSyncConfig", params, 1);
	//PDL_Err mjErr = PDL_JSReply(parms, tmp.c_str());
}

PDL_bool callSyncConfig(PDL_JSParameters *parms) {
	//initConfig();
	pthread_t thread1;
	int  iret1;

	char *foobar;

	iret1 = pthread_create( &thread1, NULL, syncConfig, (void *) foobar);
    return PDL_TRUE;
}

PDL_bool uninstallModule(PDL_JSParameters *parms) {
	//void uninstallModule(const char *modName) {
	init();
	const char* modName = PDL_GetJSParamString(parms, 0);
	std::stringstream out;
	SWModule *module;
	ModMap::iterator it = searchLibrary->Modules.find(modName);
	if (it == searchLibrary->Modules.end()) {
		PDL_JSException(parms, "uninstallModule: Couldn't find module");
		finish(-2);
		return PDL_FALSE;
	}
	module = it->second;
	installMgr->removeModule(searchLibrary, module->Name());
	out << "{\"returnValue\": true, \"message\": \"Removed module\"}";

	//Refresh Mgr
	refreshManagers();

	const std::string& tmp = out.str();

    /*const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnRemove", params, 1);*/
	PDL_Err mjErr = PDL_JSReply(parms, tmp.c_str());
	return PDL_TRUE;
}


PDL_bool listRemoteSources(PDL_JSParameters *parms) {
	init();
	std::stringstream sources;
	sources << "[";
	for (InstallSourceMap::iterator it = installMgr->sources.begin(); it != installMgr->sources.end(); it++) {
		if (it != installMgr->sources.begin()) {
			sources << ", ";
		}
		sources << "{\"name\": \"" << it->second->caption << "\", ";
		sources << "\"type\": \"" << it->second->type << "\", ";
		sources << "\"source\": \"" << it->second->source << "\", ";
		sources << "\"directory\": \"" << it->second->directory << "\"}";
	}
	sources << "]";

	const std::string& tmp = sources.str();

    //const char *params[1];
	//params[0] = cstr;
	//PDL_Err mjErr = PDL_CallJS("returnRemoteSources", params, 1);
	PDL_Err mjErr = PDL_JSReply(parms, tmp.c_str());
	return PDL_TRUE;
}

void *refreshRemoteSource(void *foo) {
//void refreshRemoteSource(const char *sourceName) {
	std::stringstream out;
	init();
	InstallSourceMap::iterator source = installMgr->sources.find(remoteSource.c_str());
	if (source == installMgr->sources.end()) {
		out << "{\"returnValue\": false, \"message\": \"Couldn't find remote source: " << remoteSource << "\"}";
		finish(-3);
	}

	if (!installMgr->refreshRemoteSource(source->second))
		out << "{\"returnValue\": true, \"message\": \"Remote Source Refreshed\"}";
	else	out << "{\"returnValue\": false, \"message\": \"Error Refreshing Remote Source\"}";

	const std::string& tmp = out.str();
	const char* cstr = tmp.c_str();

    const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnRefreshRemoteSource", params, 1);
}

PDL_bool callRefreshRemoteSource(PDL_JSParameters *parms) {
	const char* sourceName = PDL_GetJSParamString(parms, 0);
	pthread_t thread1;
	int  iret1;

	char *foobar;
	remoteSource = sourceName;

	iret1 = pthread_create( &thread1, NULL, refreshRemoteSource, (void *) foobar);
    return PDL_TRUE;
}


void listModules(SWMgr *otherMgr = 0, bool onlyNewAndUpdates = false) {
	init();
	std::stringstream out;
	SWModule *module;
	if (!otherMgr) otherMgr = mgr;
	std::map<SWModule *, int> mods = InstallMgr::getModuleStatus(*mgr, *otherMgr);

	out << "[";

	for (std::map<SWModule *, int>::iterator it = mods.begin(); it != mods.end(); it++) {
		module = it->first;
		SWBuf version = module->getConfigEntry("Version");
		SWBuf status = " ";
		if (it->second & InstallMgr::MODSTAT_NEW) status = "*";
		if (it->second & InstallMgr::MODSTAT_OLDER) status = "-";
		if (it->second & InstallMgr::MODSTAT_UPDATED) status = "+";

		if (!onlyNewAndUpdates || status == "*" || status == "+") {
			//std::cout << status << "[" << module->Name() << "]  \t(" << version << ")  \t- " << module->Description() << "\n";
			if (it != mods.begin()) {
				out << ", ";
			}
			out << "{\"name\": \"" << module->Name() << "\", ";
			if (module->getConfigEntry("Lang")) {
				out << "\"lang\": \"" << module->getConfigEntry("Lang") << "\", ";
			}
			out << "\"datapath\": \"" << module->getConfigEntry("DataPath") << "\", ";
			out << "\"description\": \"" << module->getConfigEntry("Description") << "\", ";
			out << "\"modType\": \"" << module->Type() << "\"}";
		}
	}
	out << "]";

	const std::string& tmp = out.str();
	const char* cstr = tmp.c_str();

    const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnListModules", params, 1);
}

PDL_bool remoteListModules(PDL_JSParameters *parms) {
//void remoteListModules(const char *sourceName, bool onlyNewAndUpdated = false) {
	bool onlyNewAndUpdated = false;
	const char* sourceName = PDL_GetJSParamString(parms, 0);

	init();
	InstallSourceMap::iterator source = installMgr->sources.find(sourceName);
	if (source == installMgr->sources.end()) {
		PDL_JSException(parms, "remoteListModules: Couldn't find remote source");
		finish(-3);
		return PDL_FALSE;
	}
	listModules(source->second->getMgr(), onlyNewAndUpdated);

	return PDL_TRUE;
}

PDL_bool getModuleDetails (PDL_JSParameters *parms) {
	/*Get information about a module*/
	const char* moduleName = PDL_GetJSParamString(parms, 0);
	const char* sourceName = PDL_GetJSParamString(parms, 1);
	std::stringstream mod;

	init();
	InstallSourceMap::iterator source = installMgr->sources.find(sourceName);
	if (source == installMgr->sources.end()) {
		PDL_JSException(parms, "remoteListModules: Couldn't find remote source");
		finish(-3);
		return PDL_FALSE;
	}

	SWMgr* confReader = source->second->getMgr();
	SWModule *module = confReader->getModule(moduleName);
	if (!module) {
		PDL_JSException(parms, "getModuleDetails: Couldn't find Module");
		return PDL_FALSE;
	}

	mod << "{";

	mod << "\"name\": \"" << module->Name() << "\"";
	mod << ", \"datapath\": \"" << module->getConfigEntry("DataPath") << "\"";
	mod << ", \"description\": \"" << convertString(module->getConfigEntry("Description")) << "\"";
	if (module->getConfigEntry("Lang")) mod << ", \"lang\": \"" << module->getConfigEntry("Lang") << "\"";
	if (module->getConfigEntry("Versification")) mod << ", \"versification\": \"" << module->getConfigEntry("Versification") << "\"";
	if (module->getConfigEntry("About")) mod << ", \"about\": \"" << convertString(module->getConfigEntry("About")) << "\"";
	if (module->getConfigEntry("Version")) mod << ", \"version\": \"" << module->getConfigEntry("Version") << "\"";
	if (module->getConfigEntry("InstallSize")) mod << ", \"installSize\": \"" << module->getConfigEntry("InstallSize") << "\"";
	if (module->getConfigEntry("Copyright")) mod << ", \"copyright\": \"" << convertString(module->getConfigEntry("Copyright")) << "\"";
	if (module->getConfigEntry("DistributionLicense")) mod << ", \"distributionLicense\": \"" << module->getConfigEntry("DistributionLicense") << "\"";
	if (module->getConfigEntry("Category")) mod << ", \"category\": \"" << module->getConfigEntry("Category") << "\"";

	mod << "}";

	const std::string& tmp = mod.str();

	//const char *params[1];
	//params[0] = cstr;
	//PDL_Err mjErr = PDL_CallJS("returnGetDetails", params, 1);
	PDL_Err mjErr = PDL_JSReply(parms, tmp.c_str());
    return PDL_TRUE;
}


void localDirListModules(const char *dir) {
	std::cout << "Available Modules:\n\n";
	SWMgr mgr(dir);
	listModules(&mgr);
}

void *remoteInstallModule(void *foo) {
//void remoteInstallModule(const char *sourceName, const char *modName) {
	init();
	std::stringstream out;
	InstallSourceMap::iterator source = installMgr->sources.find(remoteSource.c_str());
	if (source == installMgr->sources.end()) {
		out << "{\"returnValue\": false, \"message\": \"Couldn't find remote source: " << remoteSource << "\"}";
		finish(-3);
	}
	InstallSource *is = source->second;
	SWMgr *rmgr = is->getMgr();
	SWModule *module;
	ModMap::iterator it = rmgr->Modules.find(modName.c_str());
	if (it == rmgr->Modules.end()) {
		out << "{\"returnValue\": false, \"message\": \"Remote source " << remoteSource << " does not make available module " << modName << "\"}";
		finish(-4);
	}
	module = it->second;

	int error = installMgr->installModule(mgr, 0, module->Name(), is);
	if (error) {
		out << "{\"returnValue\": false, \"message\": \"Error installing module: " << modName << ". (internet connection?)\"}";
	} else out << "{\"returnValue\": true, \"message\": \"Installed module: " << modName << "\"}";

	//Refresh Mgr
	refreshManagers();

	const std::string& tmp = out.str();
	const char* cstr = tmp.c_str();

	const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnUnzip", params, 1);
}

PDL_bool callRemoteInstallModule(PDL_JSParameters *parms) {
	const char* sourceName = PDL_GetJSParamString(parms, 0);
	const char* moduleName = PDL_GetJSParamString(parms, 1);
	pthread_t thread1;
	int  iret1;

	char *foobar;
	remoteSource = sourceName;
	modName = moduleName;

	iret1 = pthread_create( &thread1, NULL, remoteInstallModule, (void *) foobar);
    return PDL_TRUE;
}


void localDirInstallModule(const char *dir, const char *modName) {
	init();
	SWMgr lmgr(dir);
	SWModule *module;
	ModMap::iterator it = lmgr.Modules.find(modName);
	if (it == lmgr.Modules.end()) {
		fprintf(stderr, "Module [%s] not available at path [%s]\n", modName, dir);
		finish(-4);
	}
	module = it->second;
	int error = installMgr->installModule(mgr, dir, module->Name());
	if (error) {
		std::cout << "\nError installing module: [" << module->Name() << "] (write permissions?)\n";
	} else std::cout << "\nInstalled module: [" << module->Name() << "]\n";
}

/*END INSTALL MANAGER STUFF */


PDL_bool getModules(PDL_JSParameters *parms) {
	/*Get all installed modules or all modules of a specific type. Set modType to e.g. "Biblical Texts"
	getModules() returns a JSON string*/
	std::stringstream modules;
	std::string modStr;

	ModMap::iterator it;
	const char* modType = PDL_GetJSParamString(parms, 0);

	modules << "[";

	for (it = displayLibrary->Modules.begin(); it != displayLibrary->Modules.end(); it++) {
		SWModule *module = (*it).second;
		if (strcmp(modType, "all") != 0) {
			if (!strcmp(module->Type(), modType)) {
				if (it != displayLibrary->Modules.begin()) {
					modules << ", ";
				}
				modules << "{\"name\": \"" << module->Name() << "\", ";
				modules << "\"modType\":\"" << module->Type() << "\", ";
				if (module->getConfigEntry("Lang")) {
					modules << "\"lang\": \"" << module->getConfigEntry("Lang") << "\", ";
				}
				modules << "\"dataPath\":\"" << module->getConfigEntry("DataPath") << "\", ";
				modules << "\"descr\": \"" << convertString(module->Description()) << "\"}";
			}
		} else {
			if (it != displayLibrary->Modules.begin()) {
				modules << ", ";
			}
			modules << "{\"name\": \"" << module->Name() << "\", ";
			modules << "\"modType\":\"" << module->Type() << "\", ";
			if (module->getConfigEntry("Lang")) {
				modules << "\"lang\": \"" << module->getConfigEntry("Lang") << "\", ";
			}
			modules << "\"dataPath\":\"" << module->getConfigEntry("DataPath") << "\", ";
			modules << "\"descr\": \"" << convertString(module->Description()) << "\"}";
		}
	}

	modules << "]";

	modStr = modules.str();
	//char reply[1024];
	//snprintf(reply, 1024, "%s", modStr.c_str());
	//reply[0] = modStr.c_str();
	PDL_Err mjErr = PDL_JSReply(parms, modStr.c_str());
    return PDL_TRUE;
}

PDL_bool getVerses(PDL_JSParameters *parms) {
	/*Get verses from a specific module (e.g. "ESV"). Set your biblepassage in key e.g. "James 1:19" */
	const char* moduleName = PDL_GetJSParamString(parms, 0);
	const char* key = PDL_GetJSParamString(parms, 1);
	//const char* side = PDL_GetJSParamString(parms, 2);
	std::stringstream passage;
	std::stringstream tmpPassage;
	std::stringstream out;

	SWModule *module = displayLibrary->getModule(moduleName);
	if (!module || (strcmp(module->Type(), "Lexicons / Dictionaries") == 0 || strcmp(module->Type(), "Generic Books") == 0)) {
		PDL_JSException(parms, "getVerses: Module isn't verse driven (no bible or commentary)");
		return PDL_TRUE;
	}

	module->setKey(key);

	VerseKey *vk = (VerseKey*)module->getKey();
	vk->Headings(true);

	passage << "{\"bookName\": \"" << vk->getBookName() << "\", \"cnumber\": \"" << vk->Chapter()  << "\", \"vnumber\": \"" << vk->Verse() << "\", \"passage\" : \"" << vk->getShortText() << "\", \"abbrev\": \"" << vk->getBookAbbrev() << "\"}";
	tmpPassage << vk->getBookName() << " " << vk->Chapter();
	ListKey verses = VerseKey().ParseVerseList(tmpPassage.str().c_str(), "", true);

	AttributeTypeList::iterator i1;
	AttributeList::iterator i2;
	AttributeValue::iterator i3;

	out << "[";

	for (verses = TOP; !verses.Error(); verses++) {
		vk->setText(verses);

		if (strcmp(module->RenderText(), "") != 0) {
			//headingOn = 0;
			out << "{\"content\": \"" << convertString(module->RenderText()) << "\", ";
			out << "\"vnumber\": \"" << vk->Verse() << "\", ";
			out << "\"cnumber\": \"" << vk->Chapter() << "\"";
			out << ", \"heading\": \"" << module->getEntryAttributes()["Heading"]["Preverse"]["0"].c_str() << "\"";

			for (i1 = module->getEntryAttributes().begin(); i1 != module->getEntryAttributes().end(); i1++) {
				if (strcmp(i1->first, "Footnote") == 0) {
					out << ", \"footnotes\": [";
					for (i2 = i1->second.begin(); i2 != i1->second.end(); i2++) {
						out << "{";
						for (i3 = i2->second.begin(); i3 != i2->second.end(); i3++) {
							out << "\"" << i3->first << "\": \"" << convertString(i3->second.c_str()) << "\"";
							//footnotesOn = 1;
							if (i3 != --i2->second.end()) {
								out << ", ";
							}
						}
						out << "}";
						if (i2 != --i1->second.end()) {
							out << ", ";
						}
					}
					out << "]";
				}
			}

			if (vk->Chapter() == 1 && vk->Verse() == 1) {
				vk->setChapter(0);
				vk->setVerse(0);
				out << ", \"intro\": \"" << convertString(module->RenderText()) << "\"";
			}

			out << "}";

			ListKey helper = verses;
			helper++;
			if (!helper.Error()) {
				out << ", ";
			}
		}
	}

	out << "]";

	/*if (out.str() == "[]") {
		PDL_JSException(parms, "getVerses: Chapter is not available in this module!");
		return PDL_FALSE;
	}*/

	out << "<#split#>" << passage.str();

	const std::string& tmp = out.str();
	//const std::string& tmp2 = passage.str();

	//const char *params[2];
	//params[0] = tmp.c_str();
	//params[1] = side;
	//params[1] = tmp2.c_str();
	//PDL_Err mjErr = PDL_CallJS("returnVerses", params, 2);
	PDL_Err mjErr = PDL_JSReply(parms, tmp.c_str());
    return PDL_TRUE;
}

PDL_bool getBooknames(PDL_JSParameters *parms) {
	const char* moduleName = PDL_GetJSParamString(parms, 0);
	std::stringstream bnames;
	std::string bnStr;

	SWModule *module = displayLibrary->getModule(moduleName);
	if (!module) {
		PDL_JSException(parms, "getBooknames: Couldn't find Module");
		return PDL_FALSE;  // assert we found the module
	}

	VerseKey *vkey = dynamic_cast<VerseKey *>(module->getKey());
	if (!vkey) {
		PDL_JSException(parms, "getBooknames: Couldn't find verse!");
		return PDL_FALSE;    // assert our module uses verses
	}

	VerseKey &vk = *vkey;

	bnames << "[";
	for (int b = 0; b < 2; b++)	{
		vk.setTestament(b+1);
		for (int i = 0; i < vk.BMAX[b]; i++) {
			vk.setBook(i+1);
			bnames << "{\"name\": \"" << convertString(vk.getBookName()) << "\", ";
			bnames << "\"abbrev\": \"" << convertString(vk.getBookAbbrev()) << "\", ";
			bnames << "\"cmax\": \"" << vk.getChapterMax() << "\"}";
			if (i+1 == vk.BMAX[b] && b == 1) {
				bnames << "]";
			} else {
				bnames << ", ";
			}
		}
	}

	const std::string& tmp = bnames.str();

	//const char *params[1];
	//params[0] = cstr;
	//PDL_Err mjErr = PDL_CallJS("returnBooknames", params, 1);
	PDL_Err mjErr = PDL_JSReply(parms, tmp.c_str());
    return PDL_TRUE;
}

void percentUpdate(char percent, void *userData) {
	//std::cout << (int)percent << "% " << std::endl;
	//std::cout.flush();
    /*std::string tmp;
    tmp = (int)percent;
    const char *params[1];
	params[0] = tmp.c_str();
	PDL_Err mjErr = PDL_CallJS("returnSearchProcess", params, 1); */
}

void *handleSearch(void *foo) {
	//Search through a module
	std::stringstream results;
	char c = 100;
	ListKey listkey;
	ListKey scope;
	SWModule *module = searchLibrary->getModule(searchModule.c_str());

	SWKey *k = module->getKey();
	VerseKey *parser = SWDYNAMIC_CAST(VerseKey, k);
	VerseKey kjvParser;
	if (!parser) parser = &kjvParser;
    scope = parser->ParseVerseList(searchScope.c_str(), *parser, true);
	scope.Persist(1);
	module->setKey(scope);

	ListKey verses = module->search(searchTerm.c_str(), searchType, REG_ICASE, 0, 0, &percentUpdate, &c);

    results << "[";

	for (verses = TOP; !verses.Error(); verses++) {
		module->setKey(verses);
		results << "{\"passage\": \"" << VerseKey(module->getKeyText()).getShortText() << "\", ";
        results << "\"abbrev\": \"" << VerseKey(module->getKeyText()).getBookAbbrev() << "\", ";
        results << "\"cnumber\": \"" << VerseKey(module->getKeyText()).getChapter() << "\", ";
        results << "\"vnumber\": \"" << VerseKey(module->getKeyText()).getVerse() << "\"}";
        ListKey helper = verses;
        helper++;
        if (!helper.Error()) {
            results << ", ";
        }
	}

    results << "]";

    //results << verses.getRangeText();

	const std::string& tmp = results.str();
	const char* cstr = tmp.c_str();

	const char *params[2];
	params[0] = cstr;
	params[1] = verseView.c_str();
	PDL_Err mjErr = PDL_CallJS("returnSearch", params, 2);
}

PDL_bool search(PDL_JSParameters *parms) {
    const char* moduleName = PDL_GetJSParamString(parms, 0);
    const char* searchStr = PDL_GetJSParamString(parms, 1);
    const char* scopeVerses = PDL_GetJSParamString(parms, 2);
    int type = PDL_GetJSParamInt(parms, 3);
    const char* view = PDL_GetJSParamString(parms, 4);

	pthread_t thread1;
	int  iret1;

	char *foobar;
	searchModule = moduleName;
	searchTerm = searchStr;
	searchScope = scopeVerses;
    searchType = type;
    verseView = view;

	iret1 = pthread_create( &thread1, NULL, handleSearch, (void *) foobar);
    return PDL_TRUE;
}

PDL_bool getVMax(PDL_JSParameters *parms) {
	/*Get max number of verses in a chapter*/
	std::stringstream vmax;
	const char* key = PDL_GetJSParamString(parms, 0);

	VerseKey vk(key);
	vmax << vk.getVerseMax();

	const std::string& tmp = vmax.str();

	//const char *params[1];
	//params[0] = cstr;
	//PDL_Err mjErr = PDL_CallJS("returnVMax", params, 1);
	PDL_Err mjErr = PDL_JSReply(parms, tmp.c_str());
    return PDL_TRUE;
}

PDL_bool untarMods(PDL_JSParameters *parms) {
	const char* pathMods = PDL_GetJSParamString(parms, 0);
	std::stringstream pathBuilder;
	std::stringstream errString;
	pathBuilder << "tar -xzf " << pathMods << " -C /media/internal/.sword/install/";
	const std::string& tmp = pathBuilder.str();
	const char* cstr = tmp.c_str();

	int err = system(cstr);
	if (err != 0) {
		PDL_JSException(parms, "untarMods: Couldn't untar Module");
		return PDL_FALSE;
	}

	errString << err;
	const std::string& tmp2 = errString.str();
	const char* cstr2 = tmp2.c_str();

    const char *params[1];
	params[0] = cstr2;
	PDL_Err mjErr = PDL_CallJS("returnUntar", params, 1);
    return PDL_TRUE;
}

/*PDL_bool removeModule(PDL_JSParameters *parms) {
	const char* pathMod = PDL_GetJSParamString(parms, 0);
	const char* modName = PDL_GetJSParamString(parms, 1);

	std::stringstream pathBuilder;
	std::stringstream errString;

	pathBuilder << "rm -R " << "/media/internal/.sword/" << pathMod;
	int err1 = system(pathBuilder.str().c_str());

	pathBuilder.str("");
	pathBuilder << "rm " << "/media/internal/.sword/mods.d/" << modName << ".conf";
	int err2 = system(pathBuilder.str().c_str());

	//Refresh Mgr
	refreshManagers();

	const std::string& tmp = errString.str();
	const char* cstr = tmp.c_str();

    const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnRemove", params, 1);
    return PDL_TRUE;
} */

PDL_bool checkPlugin(PDL_JSParameters *parms) {
	const char *params[1];
	params[0] = "Yes";
	PDL_Err mjErr = PDL_CallJS("returnVerses", params, 1);
    return PDL_TRUE;
}

PDL_bool readConfs(PDL_JSParameters *parms) {
	/*Get information about all available modules*/
	std::stringstream mods;

	SWMgr confReader("/media/internal/.sword/install", new MarkupFilterMgr(FMT_HTMLHREF));
	ModMap::iterator it;

	mods << "[";

	for (it = confReader.Modules.begin(); it != confReader.Modules.end(); it++) {
		SWModule *module = it->second;
		if (it != confReader.Modules.begin()) {
			mods << ", ";
		}
		mods << "{\"name\": \"" << module->Name() << "\", ";
		if (module->getConfigEntry("Lang")) {
			mods << "\"lang\": \"" << module->getConfigEntry("Lang") << "\", ";
		}
		mods << "\"datapath\": \"" << module->getConfigEntry("DataPath") << "\", ";
		mods << "\"description\": \"" << module->getConfigEntry("Description") << "\"}";
	}


	/*std::string dir = std::string("/media/internal/.sword/install/mods.d/");
    std::vector<std::string> files = std::vector<std::string>();

    getdir(dir,files);

    for (unsigned int i = 2;i < files.size();i++) {
		path = dir + files[i];
		//std::cout << path << std::endl;
        infile.open(path.c_str()); // open file
		if(infile) {
			//std::cout << "OK" << std::endl;
			mods << "{";
			std::string line="";
			std::string key="";
			while(getline(infile, line, '\n')) {
				if (line.find("=") !=  std::string::npos) {
					splitstring(line, "=", key, value);
					if (key.find("Lang") !=  std::string::npos) {
						mods << ", \"" << UpToLow(key) << "\": \"" << convertString(value) << "\"";
					} else if (key.find("DataPath") !=  std::string::npos) {
						mods << ", \"" << UpToLow(key) << "\": \"" << convertString(value) << "\"";
					} else if (key.find("Description") !=  std::string::npos) {
						mods << ", \"" << UpToLow(key) << "\": \"" << convertString(value) << "\"";
					}
				} else {
					if (line.find("[") != std::string::npos && line.find("]") != std::string::npos) {
						line.erase(line.find("]"),1);
						mods << "\"name\": \"" << convertString(line.erase(0,1)) << "\"";
					}
				}
			}
			if (i+1 != files.size()) {
				mods << "}, ";
			} else {
				mods << "}";
			}

			infile.close();
		}
    } */

	mods << "]";

	const std::string& tmp = mods.str();
	const char* cstr = tmp.c_str();

	const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnReadConfs", params, 1);
    return PDL_TRUE;
}

PDL_bool unzipModule(PDL_JSParameters *parms) {
	const char* pathModule = PDL_GetJSParamString(parms, 0);
	uLong i;
    unz_global_info64 gi;
    int err;
    FILE* fout=NULL;
	uInt size_buf = WRITEBUFFERSIZE;  // byte size of buffer to store raw csv data
    void* buf;                        // the buffer
    char filename_inzip[256];         // for unzGetCurrentFileInfo
    unz_file_info file_info;          // for unzGetCurrentFileInfo
	std::string tmpPath = "";
	std::string writeFilename = "";
	std::string pathPrefix = "/media/internal/.sword/";
	std::string sout;
	std::stringstream pathBuilder;
	unzFile uf=NULL;

	uf = unzOpen(pathModule);

    err = unzGetGlobalInfo64(uf,&gi);

	if (err!=UNZ_OK)
        std::cout << "error with zipfile in unzGetGlobalInfo \n";

	//std::cout << gi.number_entry << "\n";

	for (i=0;i<gi.number_entry;i++) {
		tmpPath = "";
		writeFilename = "";
		err = unzGetCurrentFileInfo(uf,&file_info,filename_inzip,sizeof(filename_inzip),NULL,0,NULL,0);

		//std::cout << filename_inzip << std::endl;

		const std::vector<std::string> words = split(filename_inzip, "/");
		for (int j = 0; j < words.size()-1; j++) {
			tmpPath = tmpPath + words[j] + "/";
			/*if(j<words.size()-1) {
				tmpPath = tmpPath + words[j] + "/";
			} else {
				writeFilename = words[j];
			}*/
		}

		pathBuilder.str("");
		pathBuilder << "mkdir -p " << pathPrefix << tmpPath;
		const std::string& tmp = pathBuilder.str();
		const char* cstr = tmp.c_str();

		writeFilename = pathPrefix + filename_inzip;

		std::cout << writeFilename << std::endl;

		err = system(cstr);


		buf = (void*)malloc(size_buf); // setup buffer
		if (buf==NULL) {
			std::cerr << "Error allocating memory for read buffer" << std::endl;
		} // buffer ready

		err = unzOpenCurrentFile(uf); // Open the file inside the zip (password = NULL)
		if (err!=UNZ_OK) {
			std::cerr << "Error " << err << " with zipfile in unzOpenCurrentFilePassword." << std::endl;
		} // file inside the zip is open


		std::ofstream fout(writeFilename.c_str(), std::ios::binary);

		do {
			err = unzReadCurrentFile(uf,buf,size_buf);
			if (err<0) {
				std::cerr << "Error " << err << " with zipfile in unzReadCurrentFile" << std::endl;
				break;
			}
			//std::cout << err << ":" << size_buf << std::endl;
			fout.write((const char*)buf,err);
			//if (err>0) for (int i = 0; i < (int) err; i++) fout.write((char*)&buf[i],sizeof(&buf[i]);
		} while (err>0);

		fout.close();

		err = unzCloseCurrentFile (uf);  // close the zipfile
		if (err!=UNZ_OK) {
				std::cerr << "Error " << err << " with zipfile in unzCloseCurrentFile" << std::endl;
			}



        if ((i+1)<gi.number_entry) {
            err = unzGoToNextFile(uf);
            if (err!=UNZ_OK) {
                std::cout << "error with zipfile in unzGoToNextFile\n";
                break;
            }
        }
    }

	free(buf); // free up buffer memory

	//Refresh Mgr
	refreshManagers();

	const char *params[1];
	params[0] = "true";
	PDL_Err mjErr = PDL_CallJS("returnUnzip", params, 1);
    return PDL_TRUE;
}

int main () {
	//Basic settings
	system("mkdir -p /media/internal/.sword/install/mods.d/");
	system("mkdir -p /media/internal/biblez/");
	//system("chmod -R 777 /media/internal/.sword/");
	putenv("SWORD_PATH=/media/internal/.sword");

	//Initialize Mgr
	refreshManagers();

	// Initialize the SDL library
    int result = SDL_Init(SDL_INIT_VIDEO);

	if (result != 0) {
        exit(1);
    }

    PDL_Init(0);

    // register the js callback
    PDL_RegisterJSHandler("getModules", getModules);
	PDL_RegisterJSHandler("getVerses", getVerses);
	PDL_RegisterJSHandler("checkPlugin", checkPlugin);
	PDL_RegisterJSHandler("getBooknames", getBooknames);
	PDL_RegisterJSHandler("getVMax", getVMax);
	PDL_RegisterJSHandler("untarMods", untarMods);
	PDL_RegisterJSHandler("unzipModule", unzipModule);
	//PDL_RegisterJSHandler("removeModule", removeModule);
	PDL_RegisterJSHandler("readConfs", readConfs);
	PDL_RegisterJSHandler("getModuleDetails", getModuleDetails);
    PDL_RegisterJSHandler("search", search);
    //InstallMgr
    PDL_RegisterJSHandler("syncConfig", callSyncConfig);
    PDL_RegisterJSHandler("listRemoteSources", listRemoteSources);
    PDL_RegisterJSHandler("refreshRemoteSource", callRefreshRemoteSource);
    PDL_RegisterJSHandler("remoteListModules", remoteListModules);
    PDL_RegisterJSHandler("remoteInstallModule", callRemoteInstallModule);
    PDL_RegisterJSHandler("uninstallModule", uninstallModule);

	PDL_JSRegistrationComplete();

	PDL_CallJS("ready", NULL, 0);



	// Event descriptor
    SDL_Event event;

    do {
		SDL_WaitEvent(&event);

    } while (event.type != SDL_QUIT);

	// Cleanup
    PDL_Quit();
    SDL_Quit();

	return 0;
}