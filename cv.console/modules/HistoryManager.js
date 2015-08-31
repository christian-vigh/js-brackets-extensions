/**************************************************************************************************

    NAME
    	cv.console/modules/History.js
	
    DESCRIPTION
	Manages the command history of the console

    AUTHOR 
    	Christian Vigh, 2014 (christian.vigh@orange.fr, 
		https://github.com/christian-vigh/brackets.cv.console).
	
    LICENSE
    	GPL V3 (see the LICENSE file).
	
     HISTORY
     [Version : 1.0.0]	[Date : 2014-04-03]	[Author : CV]
     	Initial version.
    	
 **************************************************************************************************/

define 
   ( 
	function ( require, exports, module ) 
	   {
		'use strict';

		// Private modules 
		var 	ObjectHelpers		=  require ( 'modules/ObjectHelpers' ) ;

		// The History data
		var 	$history 		=  [] ;
		// $logged_commands is used only when the command-grouping option is enabled ; it stores all the unique commands that have been
		// seen so far 
		var 	$logged_commands 	=  {} ;
		// Set to true when a history search has been started
		var 	$search_started 	=  false ;
		// Current position in history, when a search has been started
		var 	$history_position	=  $history. length ;
		// Set to true when a new command has been added, and the history has not been yet saved
		var 	$is_dirty 		=  false ;
		// Default history options 
		var 	$history_options 	=  
		    {
			"enabled"			:  false,
			"autosave"			:  false,
			"autosave-interval"		:  300,
			"min-command-size"		:  4,
			"max-history-size"		:  0,
			"command-grouping"		:  false,
			"history-file" 			:  "data/history.{user}.json",
			"new-command-saves-history"	:  true
		     } ;

	
		/***
		 *
		 *  Finds in the history the previous or next string that begins with the specified one (re_search = false)
		 *  or matches the specified one using a regular expression (re_search = true).
		 *
		 *  The "increment" parameter is either -1 (search backward) or +1 (search forward).
		 *
		 ***/
		function  __increment ( position, increment )
	  	   {
			position 	+=  increment ;

			if  ( position  <  0 )
				position 	=  $history. length - 1 ;
			else if  ( position  >=  $history. length )
				position 	=  0 ;
	
			return ( position ) ;
		    }
	
		function  __find ( searched_string, re_search, increment )
		   {
			var 	position 	=  $history_position ;		// Current position in the history
			var 	re 		=  undefined ;			// RegExp for searching using regular expression
			var 	got_match 	=  false ;
	
			// Loop through the history, starting at the specified entry, until we have tried all the whole history or
			// found a match
			do
			   {
				// Perform a RegExp search if needed
				if  ( re_search )
				   {
					// Instanciate the RE at first loop run
					if  ( re  ===  undefined ) 
						re 	=  new  RegExp ( searched_string ) ;
	
					// Test the regular expression against the current history entry, but ignore exceptions if RE contains
					// unescaped characters
					try
					   {
						if  ( re. test ( $history [ position ]. command ) )
							got_match 	=  true ;
	   				    }
					catch ( e ) 
					   {
					    }
				    }
				// Otherwise, perform a string comparison
				else
				   {
					if  ( $history [ position ]. command. substr ( 0, searched_string. length )  ===  searched_string )
						got_match 	=  true ;
				    }
	
				// Move to the next history entry (either backward or forward)
				position 	=  __increment ( position, increment ) ;
			    }  while ( position  !==  $history_position  &&  ! got_match ) ;
	
			// Found a match : remember the current history position and return the appropriate history entry
			if  ( got_match )
			   {
				position 	=  __increment ( position, - increment ) ;
				return ( position ) ;
			    }
			// Otherwise fail
			else
				return ( $history_position ) ;
		    }
	
		
		/***
		 *
		 *  @constructor
		 *
		 ***/
		function  History ( options ) 
		   {
			$history_options 	=  $. extend ( $history_options, options ) ;
		     }

		   
		/***
		 *
		 *  Adds a command to the history.
		 *
		 *  @param command -
		 *	Command to be logged.
		 *
		 ***/
		History. prototype. add 		=  function ( command, multiline )
		   {
			if  ( ! $history_options. enabled )
				return ;
			 
			var 	log 	=  true ;
			
			multiline 	=  multiline || false ;
			   
			// When command-grouping is enabled, we only add commands not seen so far to the history
			if  ( $history_options [ 'command-grouping' ] )
			   {
				if  ( $logged_commands [ command ]  !==  undefined )
					log 	=  false ;
			    }
			   
			// Log the command. Note that the $logged_commands object helps remembering which unique commands have been typed,
			// and is only used to enforce command grouping.
			if  ( log )
			   {
				$history. push ( { "command" : command, "multiline" : multiline } ) ;
				$history_position 		=  $history. length ;
				$logged_commands [ command ] 	=  $history. length - 1 ;
				$is_dirty 			=  true ;
			    }
		    }

	
		/*** 
		 *
		 *  Gets the entry at the specified position.
		 *
		 *  @param index
		 *	Index of the history entry to be retrieved.
		 *
		 *  @return 
		 *	The specified history entry, or undefined if the specified index is out of range.
		 *	The return value also includes a "position" field, which gives the index of the entry.
		 *
		 ***/
		History. prototype. get 		=  function  ( index )
		   {
			if  ( index  >=  0  &&  index  <  $history. length )
			   {
				$history_position 	=  index ;
				return ( $.extend ( {}, $history [ index ], { position : index } ) ) ;
			    }
			else
				return ( undefined ) ;
		    }
	

		/***
		 *
		 *  Gets the next/previous entry.
		 *
		 *  @param searched_string
		 *	If specified, a string search is performed (ie, "get next/previous entry that matches this string").
		 *	If not specified, then the history entries are enumerated one by one.
		 *
		 *  @param re_search
		 *	When true, the search is performed using regular expressions.
		 *
		 ***/
		History. prototype. getNext 		=  function ( searched_string, re_search )
		   {
			if  ( $history_position + 1  >=  $history. length )
				$history_position 	=  0 ;
			else
				$history_position ++ ;
			
			if  ( searched_string  !==  undefined  &&  searched_string  !=  "" )
				$history_position 	=  __find ( searched_string, re_search, +1 ) ;
			
			return ( this. get ( $history_position ) ) ;
		    }
	
		History. prototype. getPrevious		=  function ( searched_string, re_search )
		   {
			if  ( $history_position  ===  0 )
				$history_position 	=  $history. length - 1 ;
			else
				$history_position  -- ;
			
			if  ( searched_string  !==  undefined  &&  searched_string  !=  "" )
				$history_position 	=  __find ( searched_string, re_search, -1 ) ;
			
			return ( this. get ( $history_position ) ) ;
		    }

		
		/***
		 *
		 *  Gets/sets the history length.
		 *
		 *  @param new_length
		 *	When specified, the history will be shrinked to that length (but never extended !). Use length(0) to reset
		 *	the history.
		 *	If unspecified, the function only returns the current history length.
		 *
		 *  @return
		 *	The current history length.
		 *
		 ***/
		History. prototype. length 		=  function ( new_length )
		   {
			if  ( new_length  !==  undefined )
			   {
				if  ( new_length  <  $history. length )
					$history. length 	=  new_length ;
			    }
			   
			return ( $history. length ) ;
		    }

		
		/***
		 *
		 *  Resets the current "virtual" history position.
		 *
		 ***/
		History. prototype. resetPointer	=  function ( )
		   {
			$history_position 	=  $history. length ;
		    }
		

		// Exports
		exports. History	=  History ;
	    }
     ) ;