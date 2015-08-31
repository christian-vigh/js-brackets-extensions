cv.windowtitle extension
============
The **cv.windowtitle** extension allows you to customize the way the current document window title is displayed, without having to hack on Brackets.
A small settings file located in the extension's directory, *windowtitle.json*, is used to specify the format string to be displayed. It can have the following form :

    {
		"dirtyIndicator" 		:  "•",
		"formatString"	 		:  "%{dirtyIndicator} %{shortFilename} [%{mtime:time}] - %{applicationName} %{applicationVersion}",
		"defaultFormatString"	:  "Welcome to %{applicationName} version %{applicationVersion}"
    }

Note that this settings file is read each time Brackets is started. It is not intended to be used with the current Brackets Preferences system and has to be manually edited.

windowtitle.json entries
============
Currently, the *windowtitle.json* file accepts the following entries :

- **dirtyIndicator** :
	A string to be displayed in the title bar when the current document is "dirty" (modified but not saved).
- **formatString** :
	A formatting string containing free-format text along with specifiers of the form :
		%{specifiername [: specifieroptions]}. See the next section for more information of formatString specifiers.
		Note that unrecognized specifier options are silently ignored. Also, specifier strings are case-insensitive.
- **defaultFormatString** :
	A formatting string to be used when no opened file exists in the editor. Of course, document-related specifiers such as absolute filename, last modification and so on will be replaced with an empty string.
 

formatString specifiers
=============
The **formatString** entry can contain the following format specifiers :

- **absoluteFilename** (or absFilename) :
	Substitutes with the absolute path of the currently edited file.  
	
- **applicationName** (or appName) :
	Application name (usually, "Brackets").

- **applicationVersion** (or appVersion) :
	Brackets version numbers, for those of you who like to play with multiple versions of this software.

- **dirtyIndicator** :
	A specifier that will be replaced with the *dirtyIndicator* entry from the *windowtitle.json* file. Note that if the current document is not dirty, as many spaces as there are characters present in the *dirtyIndicator* string will be inserted, just to ensure that elements on the right of the indicator will not be shifted if the document's state changes.

- **filename** :
	The basename of the current document, without any directory information.

- **modificationTime** (or mtime) :
	Document's last modification time. An optional specifier options string can be added. Normally, these options are interpreted by the *window. phpjs. date()* function if available (provided by the *cv.phpjs extension*, yet under development : [https://github.com/christian-vigh/bracket.cv.phpjs](https://github.com/christian-vigh/bracket.cv.phpjs "https://github.com/christian-vigh/bracket.cv.phpjs")). If available, all the PHPJS date() format options will be interpreted ; if not, specifier options will be ignored and the last modification time will be displayed as : *date ( "Y-m-d H:i:s" )*, unless one of the following format options is specified :

	- time :  expands to the current time, in "hh:mm:ss" format.
	- datetime or date : expands to the current time in "yyyy-mm-dd hh:mm:ss" format.
	- auto : displays time or date and time, depending if the last modification has been made during the present day or not.

- **shortFilename** :
	Substitutes with the pathname of the current document, relative to the user's extensions directory.

Notes
==============
This extension has taken some code from the updateTitle() method of the DocumentCommandHandlers.js source file to provide non-native menus support. However, since I'm working on Windows 7, I could not test find a way to test that. So the code is here, but has never been run...

Installation instructions
==============
Installing cv.windowtitle is easy ; just unzip the package to your user's extensions directory and restart Brackets or just go the official way :

- File / Extension Manager, or click the Lego brick in the toolbar
- Click the tab called "Available"
- Type "cv.windowtitle" in the top right search bar

Troubleshooting & contributing
==============
Should you have any issues or suggestions with regards to this package, please feel free to contact me : [christian.vigh@orange.fr](mailto:christian.vigh@orange.fr "christian.vigh@orange.fr").