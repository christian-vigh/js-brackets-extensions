/**************************************************************************************************

    NAME
    	cv.title/main.js
	
    DESCRIPTION
    	Enables the customization of the currently edited document title. 
	
    CONFIGURATION fILE
    	The configuration file, title.json, can contain the following parameters :
	
	dirtyIndicator -
		A string used to indicate that the current document has been modified, but changes
		have not been committed.
		
	titleFormat -
		A format string that contains format specifiers in the form "%{specifier_name}". Note
		that the specifier keywords are case-insensitive.
		The following specifiers can be used :
		
		%{absoluteFilename} -
			The absolute path of the currently edited file.
			
		%{applicationName} or %{appName} -
			The application name (Brackets).
			
		%{applicationVersion} or %{appVersion} -
			Application version number.
			
		%{dirtyIndicator} -
			The dirty indicator string, as specified by the "dirtyIndicator" entry.
			
		%{filename} -
			The currently edited filename, without any directory (eg. main.js).
			
		%{modificationTime[:dateFormat]} or %{mtime[:dateFormat}} -
			The last modification time of the currently edited file.
			
		%{shortFilename} -
			The short filename of the currently edited file. This filename is relative
			to the user extensions' directory (eg. user/cv.title/main.js).
			This specifier will expand to a full path if the edited file is not contained
			in the Brackets extension directory.
			
			
    AUTHOR 
    	Christian Vigh, 2014 (christian.vigh@orange.fr, https://git.
	
    LICENSE
    	GPL V3 (see the LICENSE file).
	
     HISTORY
     [Version : 1.0.0]	[Date : 2014-03-09]	[Author : CV]
     	Initial version.
    	
 **************************************************************************************************/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, maxerr: 50 */
/*global define, $, brackets, window */

define
   (
	function ( require, exports, module ) 
	   {
		"use strict" ;

		// Brackets items
		var 	DocumentManager 	=  brackets. getModule ( 'document/DocumentManager' ) ;
		var 	EditorManager 		=  brackets. getModule ( 'editor/EditorManager' ) ;
		   
		// This extension's variables
		var 	SettingsDefinitions	=  require ( 'text!windowtitle.json' ) ;
		var  	Settings 		=  JSON. parse ( SettingsDefinitions ) ;
		var 	DirtyIndicator		=  ( Settings. dirtyIndicator ) ?  Settings. dirtyIndicator : "•" ;
		var 	FormatString 		=  ( Settings. formatString   ) ?  Settings. formatString   :
							"%{dirtyIndicator} %{shortFilename} - %{applicationName} %{applicationVersion}" ;
		var     DefaultFormatString 	=  ( Settings. defaultFormatString ) ?  Settings. defaultFormatString :
							"Welcome to %{applicationName} version %{applicationVersion}" ;
		// Needed for non-native menus
		var 	lastToolbarHeight 	=  null ;
		   
		/***
		 *
		 *  Gets the title format specifiers.
		 *
		 *  @param formatString -
		 *	The format specifier.
		 */
		function  __get_specifiers ( str )
		   {
			var 	regex	 	=  /[%][{]([^:}]*)([:]([^}]*))?[}]/g ;
			var 	matches 	=  [] ;
			var 	match 		=  regex. exec ( str ) ;
			   
			   
			while  ( match )
			   {
				matches. push ( { specifier : match [1], format : match [3] } ) ;   
				match 	=  regex. exec ( str ) ;
			    }
			   
			return ( matches ) ;
		    }
		   
		/***
		 * 
		 * Handles all title change events.
		 *
		 ***/
		function  onTitleChange ( )
		   {
			var 	CurrentDocument  		=  DocumentManager. getCurrentDocument ( ),
			    	CurrentDocumentTimestamp	=  ( CurrentDocument ) ?  CurrentDocument. diskTimestamp : 0,
            			CurrentlyViewedPath 		=  EditorManager. getCurrentlyViewedPath ( ),
            			AppName				=  brackets. config. app_title,
			    	AppVersion 			=  brackets. metadata. apiVersion,
			    	AppExtensionsDir		=  brackets. app. getApplicationSupportDirectory ( ) + "/extensions" ;
			var 	matches 			=  __get_specifiers ( ( CurrentDocument ) ? FormatString : DefaultFormatString ) ;
			var 	title 				=  ( CurrentDocument ) ?  FormatString : DefaultFormatString ;
			var 	doctime				=  new Date ( CurrentDocumentTimestamp ) ;
			var 	now 				=  new Date ( ) ;


			// Loop through string matches
			for  ( var i = 0 ; i  <  matches. length ; i ++ )
			   {
				var 	specifier 	=  matches [i]. specifier ;
				var 	format 		=  matches [i]. format ;
				var 	replaceRe ;
				var 	replaceWith 	=  "" ;
				   
				// Analyze the specifier 
				switch ( specifier. toLowerCase ( ) )
				   {
					// absoluteFilename -
					//	Substitutes to the absolute filename on the OS.
					case  "absolutefilename" :
					case  "absfilename" :
						if  ( CurrentlyViewedPath )
							replaceWith 	=  CurrentlyViewedPath ;
						break ;
					
					// applicationName -
					// 	Application name ("Brackets").
					case  "applicationname" :
					case  "appname" :
						replaceWith 	=  AppName ;
						break ;
						   
					// applicationVersion -
					// 	Brackets version.
					case  "applicationversion" :
					case  "appversion" :
						replaceWith 	=  AppVersion ;
						break ;
						   
					// dirtyIndicator -
					//	String to be used to indicate that the current document is dirty.
					case  "dirtyindicator" :
						if  ( CurrentDocument  &&  CurrentDocument. isDirty )
						   	replaceWith 	=  DirtyIndicator ;
						break ;
						   
					// filename -
					//	The base filename of the current document.
					case  "filename" :
						if  ( CurrentlyViewedPath )
							replaceWith 	=  CurrentlyViewedPath. replace ( /.*[/]/, '' ) ;
						break ;
						
					// modificationTime, mtime -
					//	Last modification time of current document.
					case  "modificationtime" :
					case  "mtime" :
						var pad 	=  function ( str, length )
						   {
							str 	=  "" + str ;
							   
							while  ( str. length  <  length )
								str 	=  "0" + str ;
							   
							return ( str ) ;
						    } ;
						var nowstr 	=  "" + doctime. getFullYear ( ) + "-" + 
								   pad ( doctime. getMonth ( ) + 1, 2 ) + "-" +
								   pad ( doctime. getDay ( ), 2 ) + " " +
								   pad ( doctime. getHours ( ), 2 ) + ":" + 
								   pad ( doctime. getMinutes ( ), 2 ) + ":" +
								   pad ( doctime. getSeconds ( ), 2 ) ;

						// Allow for the datetime, time, date & auto format options
						switch ( format. toLocaleLowerCase ( ) )
						   {
							case 	'datetime' :
							case 	'date' :
								   replaceWith 	=  nowstr ;
								   break ;
								   
							case 	'time' :
								   replaceWith 	=  nowstr. substr ( 11 ) ;
								   break ;
								   
							case 	'auto' :
								   if  ( now. getDay ( )  !=  doctime. getDay ( ) )
									   replaceWith 	=  nowstr ;
								   else
									   replaceWith 	=  nowstr. substr ( 11 ) ;
								   break ;
								   
							default :
								// If phpjs is available use its date() function...
								if  ( window. phpjs  &&  window. phpjs. date )
									replaceWith 	=  window. phpjs. date ( format ) ;
								// ... otherwise ignore the date format specifiers and use a fixed format
								else
									replaceWith 	=  nowstr ;
						    }
						break ;
						   
					// shortFilename -
					// 	The current document path, relative to the user extensions directory.
					case  "shortfilename" :
						if  ( CurrentlyViewedPath )
							replaceWith 	=  CurrentlyViewedPath. substr ( AppExtensionsDir. length + 1 ) ;
						break ;
						   
					// Silently ignore unknown keywords
					default :
				    }

				// Replace this current specifier 
				replaceRe 	=  new  RegExp ( '[%][{]' + specifier + '([:][^}]*)?[}]', 'i' ) ;
				title 		=  title. replace ( replaceRe, replaceWith ) ;
			    }
			   
			// Everything has been processed : set the window title
			// Tried to handle "native menus" aspects 
			if  ( brackets. nativeMenus )
				window. document. title 	=  title ;
			else
			   {
				// This code comes from the updateTitle() method of the DocumentCommandHandlers.js source file.
				// I just arranged it to mimic what it performs in the original function but I must admit that
				// I could not test it, since I'm working on Windows.
				// Init DOM elements
				var 	$titleContainerToolbar 	= $("#titlebar") ;
				var 	$titleWrapper 		= $(".title-wrapper", $titleContainerToolbar) ;
				var 	$title 			= $(".title", $titleWrapper) ;
				var 	$dirtydot 		= $(".dirty-dot", $titleWrapper) ;
				   
				if  ( CurrentlyViewedPath ) 
				   {
					$title. text ( title ) ;
					$title. attr ( "title", CurrentlyViewedPath ) ;
					   
					if  ( CurrentDocument ) 
					   {
					    	// dirty dot is always in DOM so layout doesn't change, and visibility is toggled
					    	$dirtydot. css ( "visibility", ( CurrentDocument. isDirty ) ?  "visible" : "hidden" ) ;
					     } 
					else 
					   {
					    	// hide dirty dot if there is no document
					    	$dirtydot. css ( "visibility", "hidden" ) ;
					    }
				     } 
				 else 
				    {
					$title. text ( "" ) ;
					$title. attr ( "title", "" ) ;
					$dirtydot. css ( "visibility", "hidden" ) ;
				     }

				 // Set _$titleWrapper to a fixed width just large enough to accomodate _$title. This seems equivalent to what
				 // the browser would do automatically, but the CSS trick we use for layout requires _$titleWrapper to have a
				 // fixed width set on it (see the "#titlebar" CSS rule for details).
				 $titleWrapper. css ( "width", "" ) ;
				 $titleWrapper. css ( "width", $title. width ( ) ) ;

				 // Changing the width of the title may cause the toolbar layout to change height, which needs to resize the
				 // editor beneath it (toolbar changing height due to window resize is already caught by EditorManager).
				 var 	newToolbarHeight  	=  $titleContainerToolbar. height ( ) ;
				   
				 if  ( lastToolbarHeight  !==  newToolbarHeight ) 
				    {
					lastToolbarHeight 	=  newToolbarHeight ;
					EditorManager. resizeEditor ( ) ;
				     }
			    }
		   }

		// Register the handlers for the events that may modify the current window title
		$(DocumentManager). on ( "fileNameChange"		, onTitleChange ) ;
		$(DocumentManager). on ( "dirtyFlagChange"		, onTitleChange ) ;
		$(EditorManager  ). on ( "currentlyViewedFileChange"	, onTitleChange ) ;
	    }
    ) ;