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
#include <filemgr.h>
#include <markupfiltmgr.h>
#include <listkey.h>
#include <versekey.h>

#define WRITEBUFFERSIZE (20971520) // 20Mb buffer

using namespace sword;

SWMgr *displayLibrary = 0;
SWMgr *searchLibrary = 0;

std::string searchModule = "";
std::string searchTerm = "";
std::string searchScope = "";
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

std::string escapeJsonString(const std::string& input) {
    std::ostringstream ss;
    //for (auto iter = input.cbegin(); iter != input.cend(); iter++) {
    //C++98/03:
    for (std::string::const_iterator iter = input.begin(); iter != input.end(); iter++) {
        switch (*iter) {
            case '\\': ss << "\\\\"; break;
            case '"': ss << "\\\""; break;
            case '/': ss << "\\/"; break;
            case '\b': ss << "\\b"; break;
            case '\f': ss << "\\f"; break;
            case '\n': ss << "\\n"; break;
            case '\r': ss << "\\r"; break;
            case '\t': ss << "\\t"; break;
            default: ss << *iter; break;
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
    displayLibrary->setGlobalOption("Footnotes","Off");
	displayLibrary->setGlobalOption("Headings", "Off");
}

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
				modules << "\"dataPath\":\"" << module->getConfigEntry("DataPath") << "\", ";
				modules << "\"descr\": \"" << escapeJsonString(module->Description()) << "\"}";
			}
		} else {
			if (it != displayLibrary->Modules.begin()) {
				modules << ", ";
			}
			modules << "{\"name\": \"" << module->Name() << "\", ";
			modules << "\"modType\":\"" << module->Type() << "\", ";
			modules << "\"dataPath\":\"" << module->getConfigEntry("DataPath") << "\", ";
			modules << "\"descr\": \"" << escapeJsonString(module->Description()) << "\"}";
		}
	}

	modules << "]";

	modStr = modules.str();
	const char *params[1];
	params[0] = modStr.c_str();
	PDL_Err mjErr = PDL_CallJS("returnModules", params, 1);
    return PDL_TRUE;
}

PDL_bool getModuleDetails (PDL_JSParameters *parms) {
	/*Get information about a module*/
	const char* moduleName = PDL_GetJSParamString(parms, 0);
	std::stringstream mod;
	SWMgr confReader("/media/internal/.sword/install", new MarkupFilterMgr(FMT_HTMLHREF));

	SWModule *module = confReader.getModule(moduleName);
	if (!module) {
		PDL_JSException(parms, "getModuleDetails: Couldn't find Module");
		return PDL_FALSE;
	}

	mod << "{";

	mod << "\"name\": \"" << module->Name() << "\"";
	mod << ", \"datapath\": \"" << module->getConfigEntry("DataPath") << "\"";
	mod << ", \"description\": \"" << escapeJsonString(module->getConfigEntry("Description")) << "\"";
	if (module->getConfigEntry("Lang")) mod << ", \"lang\": \"" << module->getConfigEntry("Lang") << "\"";
	if (module->getConfigEntry("Versification")) mod << ", \"versification\": \"" << module->getConfigEntry("Versification") << "\"";
	if (module->getConfigEntry("About")) mod << ", \"about\": \"" << escapeJsonString(module->getConfigEntry("About")) << "\"";
	if (module->getConfigEntry("Version")) mod << ", \"version\": \"" << module->getConfigEntry("Version") << "\"";
	if (module->getConfigEntry("InstallSize")) mod << ", \"installSize\": \"" << module->getConfigEntry("InstallSize") << "\"";
	if (module->getConfigEntry("Copyright")) mod << ", \"copyright\": \"" << escapeJsonString(module->getConfigEntry("Copyright")) << "\"";
	if (module->getConfigEntry("DistributionLicense")) mod << ", \"distributionLicense\": \"" << module->getConfigEntry("DistributionLicense") << "\"";
	if (module->getConfigEntry("Category")) mod << ", \"category\": \"" << module->getConfigEntry("Category") << "\"";

	mod << "}";

	const std::string& tmp = mod.str();
	const char* cstr = tmp.c_str();

	const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnGetDetails", params, 1);
    return PDL_TRUE;
}

PDL_bool getVerses(PDL_JSParameters *parms) {
	/*Get verses from a specific module (e.g. "ESV"). Set your biblepassage in key e.g. "James 1:19" */
	const char* moduleName = PDL_GetJSParamString(parms, 0);
	const char* key = PDL_GetJSParamString(parms, 1);
	std::string verseText;
	std::stringstream out;

	SWModule *module = displayLibrary->getModule(moduleName);
	ListKey verses = VerseKey().ParseVerseList(key, "", true);

	//library.setGlobalOption("Footnotes","On");
	//library.setGlobalOption("Headings", "On");

	out << "[";

	for (verses = TOP; !verses.Error(); verses++) {
		module->setKey(verses);
		if (strcmp(module->RenderText(), "") != 0) {
			out << "{\"content\": \"" << escapeJsonString(module->RenderText()) << "\", ";
			out << "\"vnumber\": \"" << VerseKey(module->getKeyText()).Verse() << "\", ";
			out << "\"cnumber\": \"" << VerseKey(module->getKeyText()).Chapter() << "\"}";
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

	const std::string& tmp = out.str();
	const char* cstr = tmp.c_str();

	const char *params[2];
	params[0] = cstr;
	params[1] = key;
	PDL_Err mjErr = PDL_CallJS("returnVerses", params, 2);
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
			bnames << "{\"name\": \"" << escapeJsonString(vk.getBookName()) << "\", ";
			bnames << "\"abbrev\": \"" << escapeJsonString(vk.getBookAbbrev()) << "\", ";
			bnames << "\"cmax\": \"" << vk.getChapterMax() << "\"}";
			if (i+1 == vk.BMAX[b] && b == 1) {
				bnames << "]";
			} else {
				bnames << ", ";
			}
		}
	}

	const std::string& tmp = bnames.str();
	const char* cstr = tmp.c_str();

	const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnBooknames", params, 1);
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

	const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnSearch", params, 1);
}

PDL_bool search(PDL_JSParameters *parms) {
    const char* moduleName = PDL_GetJSParamString(parms, 0);
    const char* searchStr = PDL_GetJSParamString(parms, 1);
    const char* scopeVerses = PDL_GetJSParamString(parms, 2);
    int type = PDL_GetJSParamInt(parms, 3);
	pthread_t thread1;
	int  iret1;

	char *foobar;
	searchModule = moduleName;
	searchTerm = searchStr;
	searchScope = scopeVerses;
    searchType = type;

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
	const char* cstr = tmp.c_str();

	const char *params[1];
	params[0] = cstr;
	PDL_Err mjErr = PDL_CallJS("returnVMax", params, 1);
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

PDL_bool removeModule(PDL_JSParameters *parms) {
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
}

PDL_bool checkPlugin(PDL_JSParameters *parms) {
	const char *params[1];
	params[0] = "Yes";
	PDL_Err mjErr = PDL_CallJS("returnVerses", params, 1);
    return PDL_TRUE;
}

PDL_bool readConfs(PDL_JSParameters *parms) {
	/*Get information about all available modules*/
	std::stringstream mods;
	//std::ifstream infile;
	//std::string key;
	//std::string value;
	//std::string path;

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
			mods << "\"description\": \"" << escapeJsonString(module->getConfigEntry("Description")) << "\"}";
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
						mods << ", \"" << UpToLow(key) << "\": \"" << escapeJsonString(value) << "\"";
					} else if (key.find("DataPath") !=  std::string::npos) {
						mods << ", \"" << UpToLow(key) << "\": \"" << escapeJsonString(value) << "\"";
					} else if (key.find("Description") !=  std::string::npos) {
						mods << ", \"" << UpToLow(key) << "\": \"" << escapeJsonString(value) << "\"";
					}
				} else {
					if (line.find("[") != std::string::npos && line.find("]") != std::string::npos) {
						line.erase(line.find("]"),1);
						mods << "\"name\": \"" << escapeJsonString(line.erase(0,1)) << "\"";
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
	PDL_RegisterJSHandler("removeModule", removeModule);
	PDL_RegisterJSHandler("readConfs", readConfs);
	PDL_RegisterJSHandler("getModuleDetails", getModuleDetails);
    PDL_RegisterJSHandler("search", search);
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