/**************************************************************************************************

    NAME
    	cv.wordhint/main.js
	
    DESCRIPTION
	
    AUTHOR 
    	Christian Vigh, 2014 (christian.vigh@orange.fr, https://github.com/christian-vigh).
	
    LICENSE
    	GPL V3 (see the LICENSE file).
	
     CREDITS
     	This extension has been largely inspired by the brackets-wordhint-master
	(https://github.com/bigeyex/brackets-wordhint) written by Wang Yu <bigeyex@gmail.com> 
	(http://www.mit.edu/~wangyu/)".
	
     HISTORY
     [Version : 1.0.0]	[Date : 2014-04-08]	[Author : CV]
     	Initial version.
    	
 **************************************************************************************************/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 		  */
/*global define, console, brackets, $, Mustache 						  */


define
   (
	function  ( require, exports, module ) 
	   {
    		"use strict" ;

		var	AppInit        		=  brackets. getModule ( "utils/AppInit" ),
			CodeHintManager     	=  brackets. getModule ( "editor/CodeHintManager" ),
		    	PerfUtils		=  brackets. getModule ( "utils/PerfUtils" ) ;
		var 	Verbose			=  false ;
 
		   
		/***
		 * 
		 *  Searches the cache for the first string that starts with the specified value.
		 *  (dichotomic search).
		 *
		 ***/
		function  __search ( cache, value, case_sensitive )
		   {
			if  ( ! cache. length )
				return ( -1 ) ;
			   
			var 	min 	=  0,
			    	max	=  cache. length - 1 ;
			var 	index ;
			var 	count 	=  0 ;
			var 	length	=  value. length ;
			   
			if  ( ! case_sensitive )
				value 	=  value. toLowerCase ( ) ;
			   
			do
			   {
				index 	=  Math. floor ( ( max + min ) / 2 ) ;
				count ++ ;
				   
				var 	str 	=  cache [index]. substr ( 0, length ) ;
			
				if  ( ! case_sensitive )
					str 	=  str. toLowerCase ( ) ;
				   
				if  ( value  ===  str )
					break ;
				else if  ( value  >  str )
					min 	=  index + 1 ;
				else
					max 	=  index - 1 ;
			    }  while  ( min  <=  max ) ;
			   
			if  ( min  >  max )
				index 	=  -1 ;
			   
			console. log ( "Searched : " + value + ", iterations = " + count + ", result = " + index ) ;
			return ( index ) ;
     		    }

		   
		/***
		 *
		 *  Logs a message if the Verbose variable is true.
		 *
		 ***/
		function  __log ( level, message )
		  {
			if  ( Verbose )
			   {
				var  	prefix 	=  ( level ) ?  Array ( 8 * level ). join ( " " ) : "" ;
				   
				console. log ( prefix + message ) ;
			    }
		   }
		   
		   
		/***
		 *
		 *  @constructor
		 *	Loads the settings for each currently supported language.
		 *
		 ***/
		function  WordHints ( ) 
		   {
			var 	SettingsDefinitions	=  require ( 'text!wordhint.json' ) ;
			var  	Settings 		=  JSON. parse ( SettingsDefinitions ) ;
			   
			this. WordCache 		=  {} ;		// The word hint cache, together with language-specific definitions
			this. MinWordLength 		=  Settings. minLength || 1 ;
			this. RefreshInterval 		=  Settings. refreshInterval || 1000 ;
			this. Editor 			=  undefined ;
			this. LastHit 			=  -1 ;
			this. LastMissedMatches		=  {} ;
			   
			if  ( this. MinWordLength  <  1 )
				this. MinWordLength 	=  1 ;
			   
			Verbose 	=  Settings. verbose  ||  false ;

			// Transform the settings into usable data (well, ensure that everything is properly formed).
			for  ( var  language  in  Settings. languages )
			   {
				__log ( 0, "cv.wordhint : Loading language \"" + language + "\"..." ) ;
				   
				var 	current_settings 	=  Settings. languages [ language ] ;
				var 	final_settings 		=  {} ;
				var 	base_settings 		=  {} ;
				   
				if  ( current_settings [ 'use' ]  &&  Settings. languages [ current_settings [ 'use' ] ] )
					base_settings 	=  Settings. languages [ current_settings [ 'use' ] ] ;
				   
				final_settings 			=  $. extend ( { cache : [], caseSensitive : true, keywords : [] }, 
									      		base_settings, current_settings, final_settings ) ;
				   
				// If language-specific keywords are present, sort them
				if  ( final_settings. keywords. length  !==  0 )
				   {
					if  ( final_settings. caseSensitive )
						final_settings. keywords. sort ( ) ;
					else
						final_settings. keywords. sort
						   (
							function ( a, b )
							   {
								a 	=  a. toLowerCase ( ) ;
								b	=  b. toLowerCase ( ) ;
								   
								if  ( a  ===  b )
									return ( 0 ) ;
								else if  ( a  >  b ) 
									return ( 1 ) ;
								else
									return ( -1 ) ;
							    }
						    ) ;
				    }
				   
				// ... then remove duplicate entries if any
				var 	unique_keywords  	=  [] ;
				var 	last_keyword 		=  undefined ;
				var 	duplicates 		=  0 ;
				   
				for  ( var  i = 0 ; i  <  final_settings. keywords. length ; i ++ )
				   {
					var  	current_keyword 	=  final_settings. keywords [i] ;
					   
					if  ( current_keyword  !==  last_keyword )
					   {
						unique_keywords. push ( current_keyword ) ;
						last_keyword 	=  current_keyword ;
					    }
					else
					   {
						__log ( 1, "duplicate word : " + current_keyword ) ;
						duplicates ++ ;
					    }
				    }
				   
				__log ( 1, final_settings. keywords. length + " keywords found, " + duplicates + " duplicates removed." ) ;
				   
				final_settings. keywords 	=  unique_keywords ;
				
				// ... and if no initial cache data has been provided, initialize it with the keyword list
				if  ( final_settings. cache. length  ===  0 )
					final_settings. cache 	=  final_settings. keywords ;
				   
				// Done with this language
				this. WordCache [ language ]	=  final_settings ;
			    }

			// Ensure the "all" entry is always present. This is the default fallback when a language is not
			// defined in the wordhint.json database.
			if  ( this. WordCache [ "all" ]  ===  undefined )
				this. WordCache [ "all" ] 	= 
				   {
					"language" 		:  "all",
					"regexp" 		:  "[a-zA-Z_][a-zA-Z0-9_]",
					"blockComments"		: 
					   [
						{ "begin" :  "/*", "end" :  "*/" }
					    ],
					"lineComments" 		:  [ "//" ],
					"keywords"		:  [],
					"caseSensitive"		:  true,
					"cache" 		:  []
				    } ;
		    }
    
    
		/***
		* 
		* @param {Editor} editor 
		* 	A non-null editor object for the active window.
		*
		* @param {String} implicitChar 
		* 	Either null, if the hinting request was explicit, or a single character that represents the last insertion 
		*	and that indicates an implicit hinting request.
		*
		* @return {Boolean} 
		* 	Determines whether the current provider is able to provide hints for the given editor context and, in case 
		*	implicitChar is non-null, whether it is appropriate to do so.
		*
		***/
		WordHints. prototype. hasHints 		=  function ( editor, implicitChar ) 
		   {
			__log ( 1, "HASHINTS" ) ;
			// Remember the editor context
			this. Editor 	=  editor ;
			
			// Identify the current language ; if not defined in the settings, fall back to "all"
			var 	language 		=  editor. document. language. getId ( ) ;
			var  	data 			=  ( this. WordCache [ language ] ) ?  
			    					this. WordCache [ language ] : 
								this. WordCache [ "all" ] ;
			// Get current line contents up to current cursor position
			var 	cursorPosition		=  editor. getCursorPos ( ) ;
			var 	currentLine 		=  editor. document. getRange ( { line : cursorPosition. line, ch : 0 }, cursorPosition ) ;
			
			// Now locate the current word
			var 	keyword_re 		=  data. regexp + "{" + ( this. MinWordLength - 1 ) + ",}" ;
			var 	re 			=  new RegExp ( keyword_re, 'g' ) ;
			var 	matches 		=  currentLine. match ( re ) ;
			var 	word 			=  ( matches  &&  matches. length  >  0 ) ?
			    					matches [ matches. length - 1 ] : undefined ;
			
			// Check if the current word belongs to the list of past failing matches 			
			if  ( word  &&  word. length  >  1  &&  this. LastMissedMatches. length >  0  && 
			     	( ( this. LastMissedMatches [word]  ||
			     	    this. LastMissedMatches [ word. substr ( 0, word. length - 1 ) ] ) ) ) 
			   {
				 this. LastHit 	=  -1 ;
				 return ( false ) ; 
			    }

			// Get current word set 
			var 	index 			=  ( word  &&  word. length ) ?  
			    					__search ( data. cache, word, data. caseSensitive ) : -1 ;
			
			// Remember last missed words
			if  ( index  === -1 ) 
			    {
				this. LastMissedMatches [ word ] 	=  true ;
				this. LastHit 				=  - 1 ;
			
				return ( false ) ;
			     }
			else
				return ( true ) ;
		    } ;
       
		   
		/***
		*
		* Returns a list of available identifiers for the current editor context.
		* The identifiers have two possible origins :
		* - The wordhint.json file, which lists language identifiers, such as keywords, functions,
		*   constants, classes and properties for a specific language.
		* - The document on which the hinting request as performed. A timed event handled regularly
		*   rescans the document to find new keywords (such as variable names) that the user has typed.
		* 
		* @param {Editor} implicitChar 
		* 	Either null, if the hinting request was explicit, or a single character
		* 	that represents the last insertion and that indicates an implicit hinting request.
		*
		* @return {jQuery.Deferred|{
		*              hints: Array.<string|jQueryObject>,
		*              match: string,
		*              selectInitial: boolean,
		*              handleWideResults: boolean}}
		* 	Null if the provider wishes to end the hinting session. Otherwise, a
		* 	response object that provides:
		*
		* 	1. a sorted array hints that consists of strings
		* 	2. a string match that is used by the manager to emphasize matching
		* 	   substrings when rendering the hint list
		* 	3. a boolean that indicates whether the first result, if one exists,
		* 	   should be selected by default in the hint list window.
		* 	4. handleWideResults, a boolean (or undefined) that indicates whether
		* 	   to allow result string to stretch width of display.
		***/
		WordHints.prototype.getHints = function (implicitChar) {
			
			__log ( 1, "GETHINTS" ) ;
			__log(1, "implicit char = " + implicitChar ) ;
		var cursor = this.editor.getCursorPos();
		var lineBeginning = {line:cursor.line,ch:0};
		var textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);
		var symbolBeforeCursorArray = textBeforeCursor.match(this.currentTokenDefinition);
		var hintList = [];

			
		for(var i in this.cachedWordList){
		    if(this.cachedWordList[i].indexOf(symbolBeforeCursorArray[0])==0){
			hintList.push(this.cachedWordList[i]);
		    }
		}

		return {
		    hints: hintList,
		    match: symbolBeforeCursorArray[0],
		    selectInitial: true,
		    handleWideResults: false
		};
		};
    
    /**
     * Complete the word
     * 
     * @param {String} hint 
     * The hint to be inserted into the editor context.
     * 
     * @return {Boolean} 
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    WordHints.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos();
        var lineBeginning = {line:cursor.line,ch:0};
        var textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);
        var indexOfTheSymbol = textBeforeCursor.search(this.currentTokenDefinition);
        var replaceStart = {line:cursor.line,ch:indexOfTheSymbol};
        this.editor.document.replaceRange(hint, replaceStart, cursor);
        
        
        return false;
    };
    
		   
		// Initialize along with the application
		AppInit. appReady
		   (
			function ( ) 
			   {
				var 	PerfTimer		=  PerfUtils. markStart ( "cv.wordhint" );
				var 	hints 			=  new  WordHints ( ) ;
				   
		    		//hints. insertHintOnTab 	=  true ;		// say we want the Tab key to insert currently selected hint
				CodeHintManager. registerHintProvider ( hints, [ "all" ], 10000 ) ;

				PerfUtils. addMeasurement ( PerfTimer ) ;
			    }
		    ) ;
	       }
     ) ;
