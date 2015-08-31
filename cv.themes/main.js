/**************************************************************************************************

    NAME
    	cv.themes/main.js
	
    DESCRIPTION
    	Themes manager.
	
    AUTHOR 
    	Christian Vigh, 2014 (christian.vigh@orange.fr, https://github.com/christian-vigh).
	
    LICENSE
    	GPL V3 (see the LICENSE file).
		
     HISTORY
     [Version : 1.0.0]	[Date : 2014-04-11]	[Author : CV]
     	Initial version.
    	
 **************************************************************************************************/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 		  */
/*global define, console, brackets, $, Mustache 						  */

define 
   (
	function ( require, exports, module )
	   {
		"use strict" ;
		   
		// Brackets modules 
    		var	AppInit 		=  brackets. getModule ( "utils/AppInit" ),
			CommandManager      	=  brackets. getModule ( "command/CommandManager" ),
  			Commands            	=  brackets. getModule ( "command/Commands" ),      		
		    	Menus               	=  brackets. getModule ( "command/Menus" ),
        		PreferencesManager  	=  brackets. getModule ( "preferences/PreferencesManager" ),
        		ExtensionUtils      	=  brackets. getModule ( "utils/ExtensionUtils" ),
        		FileSystem          	=  brackets. getModule ( "filesystem/FileSystem" ),
		    	FileUtils 		=  brackets. getModule ( "file/FileUtils" ),
		    	Async 			=  brackets. getModule ( "utils/Async" ),
		    	CodeMirror		=  brackets. getModule ( "thirdparty/CodeMirror2/lib/codemirror" ) ;

		// Localization
		var 	Strings 		=  require ( 'modules/Strings' ) ; 
		   
		// Extensions and modules path
		var 	ModulesDir		=  FileUtils. getNativeBracketsDirectoryPath ( ) + "/themes",
		    	ExtensionsDir		=  brackets. app. getApplicationSupportDirectory ( ) + "/extensions/themes/",
		    	ThemesDir 		=  brackets. app. getApplicationSupportDirectory ( ) + "/themes/",
		    	ThisExtensionDir 	=  ExtensionsDir + "extensions/user/cv.themes/" ;
		   
		// Settings 
		var 	CurrentTheme,					// Current theme name, without the .css extension
		    	CurrentThemeLocation ;				// Can be "extensions" (meaning that the theme is located in the user extensions directory),
		   							// "this" (this extension's directory) or "brackets" (Brackets module directory). Available
		   							// themes are searched under the "themes/" subdirectory. It can also be "user", to point to
		   							// the parent extensions directory.
		var 	ThemesMenu ;					// The Themes menu
		var 	CustomThemeClassPrefix 	=  "brackets-theme-" ;	// The class name for custom themes
		   
		PreferencesManager. definePreference ( 'theme'		, 'string', "thrak" ) ;
		PreferencesManager. definePreference ( 'location'	, 'string', "this"  ) ;
		   
		CurrentTheme		=  PreferencesManager. get ( "theme" ) ;
		CurrentThemeLocation	=  PreferencesManager. get ( "location" ) ;
		   
		   
		// Themes lists
		var	Themes 		=  [] ;
		   
		// Directories where to look for themes. Themes with same names can exist in several directories ; in this case,
		// the "location" member will do the difference
		var 	SearchIn 	=  				// Search all themes in these directories
		    [
			{ path  :  brackets. app. getApplicationSupportDirectory ( ) + "/extensions/user/cv.themes/themes"	, location : "this" 		},
			{ path  :  brackets. app. getApplicationSupportDirectory ( ) + "/custom themes"				, location : "custom"	 	},
			{ path  :  brackets. app. getApplicationSupportDirectory ( ) + "/extensions/user/themes"		, location : "user" 		},
			{ path  :  brackets. app. getApplicationSupportDirectory ( ) + "/extensions/themes"			, location : "extensions" 	},
			{ path 	:  FileUtils. getNativeBracketsDirectoryPath ( ) + "/themes"					, location : "brackets" 	}
		     ] ;
		   
		/***
		 *
		 *  Gets the available themes by looking into each directory defined in the SearchIn[] array.
		 *
		 ***/
		function  __get_themes ( )
		   {
			var 	deferred	=  new $. Deferred ( ) ;

			// A recursive way to cycle through an array... Needed because FileSystem.getContents() is asynchronous.
			// The caller has to handle the done() event of the returned value, which is a Promise.
			function  __get ( i )
			   {
				// If all elements in the array have been processed, then resolve the promise
				if  ( i  >=  SearchIn. length )
				   {
					deferred. resolve ( ) ;
					return ;
				    }
				   
				// Get current directory to look in
				var  	dir 	=  SearchIn [i] ;
				   
				// Then get directory contents
				FileSystem. getDirectoryForPath ( dir. path ). getContents
				   (
					function ( err, contents ) 
					   {
						if  ( ! err ) 
						   {
							// Loop through directory contents, retaining only the .css files
							for  ( var  j  =  0 ; j  <  contents. length ; j ++ )
							   {
								var 	file 	=  contents [j] ;
								   
								if  ( file. isFile  &&  /\.css/. test ( file. name ) )
								   {
									// Build the theme name
									var  	name 		=  file. name. replace ( /\.css/, '' ) ;
									var 	pretty_name  	=  name. substr ( 0, 1 ). toUpperCase ( ) + name. substr ( 1 ) ;
									   
									var 	entry 	=  $. extend ( {}, dir, { file : file, name : pretty_name, className : name } ) ;
									Themes. push ( entry ) ;
								    }
							    }
						    }
						   
						__get ( i + 1 ) ;
					    }
				    ) ;
			    }

			// Loop through thr directories where to take the themes from
			__get ( 0 ) ;
 			return ( deferred. promise ( ) ) ;
		    } ;
		   
		   
		/***
		 *
		 *  Returns the menu command associated to a theme and its location.
		 ***/
		function  __get_theme_command ( name, location )
		   {
			return ( "cv-theme-" + name + "-" + location ) ;
		    }
		   
		   
		/***
		 * 
		 *  Loads the theme from the specified location.
		 *
		 ***/
		function  __load ( name, location ) 
		   {
			// The default theme is...  "default" !
			if  ( name  ===  undefined )
			   {
				name 		=  "default" ;
				location 	=  "this" ;
			    }
			   
			// Locate the requested theme in the theme list
			for  ( var  i = 0 ; i  <  Themes. length ; i ++ )
			   {
				var 	theme 	=  Themes [i] ;
				   
				if  ( theme. name. toLowerCase ( )  ===  name. toLowerCase ( )  &&  theme. location  ===  location )
				   {
					// Remove any previous theme reference
					$('#editor-holder .CodeMirror'). removeClass ( 'cm-s-' + CurrentTheme ) ;

					// Uncheck the previous theme in the Themes menu and check this new one
					var 	old_theme 	=  CommandManager. get ( __get_theme_command ( CurrentTheme, CurrentThemeLocation ) ) ;
				        var 	old_theme_name 	=  CurrentTheme ;
					var 	file		=  theme. file. parentPath + theme. file. name ;
					var  	theme_command	=  __get_theme_command ( theme. className, theme. location ) ;

					old_theme  &&  old_theme. setChecked ( false ) ;
					CommandManager. get ( theme_command ). setChecked ( true ) ;

					// Remember newly selected theme
					CurrentTheme		=  theme. className ;
					CurrentThemeLocation	=  theme. location ;

					PreferencesManager. set ( "theme", theme. className ) ;
					PreferencesManager. set ( "location", theme. location ) ;

					// Add this new theme reference to the CodeMirror editor
					CodeMirror. defaults. theme 	=  theme. className ;
					$(document. body)
						.removeClass ( CustomThemeClassPrefix + old_theme_name )
						.addClass    ( CustomThemeClassPrefix + theme. className ) ;

					// Load the new theme
					ExtensionUtils. loadStyleSheet ( module, "themes.css" ) ;
					$("body"). append ( '<link id="currentTheme" rel="stylesheet"/>' ) ;
					$('#currentTheme'). attr ( 'href', file ) ;
				    }
			    }
		    }

		   
		/***
		 *
		 * Registers a menu command ; this function is called by the __addthemesmenu function.
		 * This level of indirection is needed because late binding seems to pollute.
		 * Keeping this code into the __addmenu() function will allways make the theme.name variable equal to the last
		 * element of the Themes[] array.
		 *
		 ***/
		function  __register ( name, location, command )
		   {
			CommandManager. register 
			   ( 
				name, 
				command, 
				function  ( )
				   {
					__load ( name, location ) ;
				    }
			     ) ;
		    } ;
		   
		   
		/***
		 *
		 *  Adds the Themes menus.
		 *
		 ***/
		function  __addthemesmenu ( )
		   {
			// Add the Themes menu to the main menu bar
			ThemesMenu 	=  Menus. addMenu ( Strings. THEMES_MENU, "cv-themes-mainmenu", Menus. BEFORE, Menus. AppMenuBar. HELP_MENU ) ;

			// Then add the menu items, using the classic Menu.js API
			for  ( var  i = 0 ; i  <  Themes. length ; i ++ )
			   {
				var     theme 		=  Themes [i] ;
				var 	command 	=  __get_theme_command ( theme. className, theme. location ) ;

				__register ( theme. name, theme. location, command ) ;
				ThemesMenu. addMenuItem ( command ) ;
			    }
			   
			__load ( CurrentTheme, CurrentThemeLocation ) ;
		    }
		   
		   
		// Wait for all possible themes (*.css) to get enumerated 
		AppInit. appReady
		   (
			function ( )
			   {
				var 	promise 	=  __get_themes ( ) ;

				promise. done 
				   (
					function ( )
					   {
						// Sort the themes by name
						Themes. sort 
						   (
							function ( a, b )
							   {
								if ( a. name  >  b. name ) 
									return ( 1 ) ;
								else if  ( a. name  <  b. name )
									return ( -1 ) ;
								else
									return ( 0 ) ;
							    }
						    ) ;

						// Create the Themes menu and load the current theme
						__addthemesmenu ( ) ;
					    } 
				     ) ;
			       }
		    ) ;
	    }
   ) ;
