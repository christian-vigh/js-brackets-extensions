/**************************************************************************************************

    NAME
    	cv.console/modules/EmbeddedConsole.js
	
    DESCRIPTION
	Defines the console primitives used for loggin messages.

    AUTHOR 
    	Christian Vigh, 2014 (christian.vigh@orange.fr, 
		https://github.com/christian-vigh/brackets.cv.console).	
	
    LICENSE
    	GPL V3 (see the LICENSE file).
	
     HISTORY
     [Version : 1.0.0]	[Date : 2014-02-25]	[Author : CV]
     	Initial version.
    	
 **************************************************************************************************/

define 
   ( 
	function ( require, exports, module ) 
	   {
		'use strict';
		   

		// Brackets modules 
		var 	Dialogs                		=  brackets. getModule ( "widgets/Dialogs" ) ;
		   
		// Console modules & other stuff
		var	Strings 			=  require ( 'modules/Strings' ) ;
		var 	ObjectHelpers			=  require ( "modules/ObjectHelpers" ) ;
		var 	ObjectBrowserDialogTemplate 	=  require ( "text!html/object-browser-dialog.html" ) ;
	
		// Private variables 
		var 	$logged_records 		=  0 ;			// Number of records logged so far
		var 	$logged_commands 		=  0 ;			// And number of commands
		var  	$logged_objects 		=  [] ; 		// Logged objects
		var  	$console_output			=  undefined ;		// Reference to the embedded console output <div>
		   
		   
		/******************************************************************************************************
		
			Private methods.
			
		 ******************************************************************************************************/

		/***
		 *
		 *  Wraps the specified string representation into a <div> having the specified class.
		 *
		 *  @param value
		 *	Value to be wrapped.
		 *
		 *  @param classname
		 *	CSS class name(s) for that entry. Can be either a list of class names.
		 *
		 ***/
		function  wrapme ( value, classname )
		   {
			var 	arg_representation	=  "" ;

			if  ( typeof ( value )  ===  'object'   &&  ObjectHelpers. classof ( value )  !==  'Object' )
			   {
				$logged_objects. push ( value ) ;
				arg_representation 	=  '<div class="object-tostring">"' + value. toString ( ) + '"</div>' ;
				value 			=  "<a class='console-log-object' data-object-id='" + ( $logged_objects. length - 1 ) + "'>" +
								"<div class='before'></div>" +
								ObjectHelpers. classof ( value ) + 
								" " + arg_representation +
								"<div class='after'></div></a>"			    
			    }
			else if  ( typeof ( value )  ===  'string' ) 
			   {
				value 	=  value. replace ( /\r?\n/g, "<br/>" ) ;
			    }
			   
			var 	text 	=  "<div class='value " + classname + "'>" + value + "</div>" ;
			   
			return ( text ) ;
		    }
		   
		   
		/***
		 * Formats a string to be written to the log.
		 *
		 * @param arguments
		 *	Array of arguments.
		 *	The first array element is a very restricted sprintf()-like format specifier, where the 
		 *	following specifiers are allowed :
		 *	%d or %i -
		 *		Integer format.
		 *	%f or %n -
		 *		Float format.
		 *	%s -
		 *		String format.
		 *	%o -
		 *		A browsable object.
		 *	%% -
		 *		The '%' character.
		 *
		 *	Remaining elements are format specifiers' substitutions.
		 *
		 * @param  message_class 
		 *	Class for the message contents.
		 */
		function  __format ( array, message_class, line_number )
		   {
			// If unique argument is an object or a function, make as if the "%o" specifier had been specified
			if  ( typeof ( array [0] )  ===  'object'  ||  typeof ( array [0] )  ===  'function' )
				array 	=  [ "%o" ]. concat ( array ) ;
			// Same with "%s" for non-objects 
			else if  ( typeof ( array [0] )  !==  'string' )
				array 	=  [ "%s" ]. concat ( array ) ;
			   
			var 	supported_formats	=  "odnisf%" ;				// Supported formats
			var 	format_string  ;						// Format string - may be empty
			var 	format_length ;
			var 	result 			=  "" ;					// Resulting string, after specifier expansion
			var 	argv, argc, current_arg ;
			   
			// Remove format string from arguments
			argv 		=  array ;
			argc 		=  argv. length ;
			format_string 	=  argv [0]
						.replace ( /\r?\n/g, '<br/>' )
						.replace ( / /, '&nbsp;' ) ;
			format_length 	=  format_string. length ;
			current_arg 	=  1 ;

			// Loop through format_string characters
			for  ( i = 0 ; i < format_length ; i ++ )
			   {
				var 	ch 	=  format_string. charAt ( i ) ;
				   
				// Current character is not a format specifier prefix ('%') : just add it to the result
				// (it can also be a format specifier, but the last character in the string)
				if  ( ch  !==  '%'  ||  i + 1  >=  format_length )
				   {
					result 	+=  ch ;
					continue ;
				    }

				// Get the character after the format specifier prefix
				ch 	=  format_string. charAt ( ++i ) ;
				
				// If this character is not a valid format specifier, leave it untouched
				if  ( supported_formats. search ( ch )  ===  -1 )
				   {
					result 	+=  '%' + ch ;
					continue ;
				    }

				// Skip the '%%' construct 
				if  ( ch  ===  '%' )
				   {
					result 	+=  '%' ;
					continue ;
				    }
				   
				// Newlines are replaced by <br>'s
				if  ( ch  ===  "\n" )
				   {
					result  +=  "<br/>" ;
					continue ;
				    }
				   
				// Carriage returns are replaced by... nothing
				
				// Get that argument
				var 	arg 			=  ( current_arg  <  argc ) ?  argv [ current_arg ++ ] : undefined ;
				   
				// And convert it
				switch ( ch. toLowerCase ( ) )
				   {
					// '%s' specifier :
					//	A string.
					case 	's' :
						if  ( typeof ( arg )  !=  'object' )
							result 	+=  "" + wrapme ( arg, "string " + ObjectHelpers. classof ( arg ) ) ;
						else
							 result += wrapme ( arg, "object" ) ;
						break ;
						   
					// '%n' / '%f' specifier :
					//	A number, either float or integer.
					// 	We follow here the results of the built-in console.log() function, which
					//	returns NaN even for undefined or null values.
					case  	'n' :
					case 	'f' :
						if  ( arg  ===  undefined )
							result 	+=  '%' + ch ;
						else if  ( isNaN ( parseFloat ( arg ) ) )
							result 	+=  wrapme ( "NaN", "number float nan" ) ;
						else
							result  +=  wrapme ( "" + arg, "number float" ) ;
						break ;
						   
					// '%d' / '%i' specifier :
					//	An integral number. Same comments as for '%f'.
					case 	'd' :
					case 	'i' :
						if  ( arg  ===  undefined )
							result 	+=  '%' + ch ;
						else if  ( isNaN ( parseInt ( arg ) ) )
							result 	+=  wrapme ( "NaN", "number integer nan" ) ;
						else
							result  +=  wrapme ( "" + arg, "number integer" ) ;
						break ;
						
					// "%o" specifier :
					//	An object.
					case 	 'o' :
						 result 	+= wrapme ( arg, "object" ) ;
						 break ;
				   }
				   
				// Process remaining, unused arguments
				for  ( var  i = current_arg + 1 ; i  <  argc ; i ++ )
				   {
				      	// TODO: process unused args
				    }
		 	    }
			   
			// Message class 
			message_class		=  message_class  ||  "log" ;
			   
			// Odd/even class html code
			line_number 		=  ( line_number ) ?  
							"<div class='log-linenumber'>[" + line_number + "]</div>" : 
							"<div class='log-linenumber log-nolinenumber'></div>" ;
			   
			// Final html code 
			var text 		=  "<div class='log-line'>" +
							line_number +
							"<div class='log-message " + message_class +  "'>" + result + "</div>" + 
						   "</div><br/>" ;

			$logged_records ++ ;
			   
			return ( text ) ;
		     }
		   
		   
		/**
		 *
		 *  Performs the job of outputting a message to both the embedded and native consoles.
		 *
		 *  @param array 
		 *	The 'arguments' object of the caller function.
		 *
		 *  @param textclass 
		 *	Class to be used for the message. It can be, but not restricted to, one of the followig :
		 *	"log" 		- A log() message
		 *	"debug" 	- A debug() message
		 *	"info" 		- An info() message
		 *	"error" 	- An error() message
		 *	"command"	- The text of the Javascript command passed to the execute() method.
		 *	"result" 	- The result of a Javascript command execution.
		 *	
		 *  @param line_number
		 *	Console log line number.
		 *
		 *  @param secondary_textclass
		 *	Name of a secondary text class (mainly used for result outputs, whose style may differ from 
		 *	return values' types.
		 *
		 **/
		function  __do_output ( func, args, textclass, line_number )
		   {
			var 	result 		=  "" ;
			   
			// Add the message to the embedded console output view, if one is defined
			if  ( $console_output  !==  undefined )
			   {
				var 	text 		=  __format ( Array. prototype. slice. call ( args ), textclass, line_number ) ;
				   				
				$console_output. append ( text ) ;
				$console_output. animate ( { scrollTop: $console_output [0]. scrollHeight }, 40 ) ;
			    }
			   
			// Call the native Console function
			if  ( func )
				result = func. apply ( console, args ) ;
			   
			return ( result ) ;
		    }
		   
		   
		/******************************************************************************************************
		
			Public general methods.
			
		 ******************************************************************************************************/
		   
		/**
		 * Sets the output view panel (ie, a <div> where all console messages are displayed).
		 *
		 * @params reference -
		 *	A jQuery object.
		 **/
		function  setOutputView ( reference )
		   { $console_output  =  reference ; }
		
		/**
		 * Returns the output view.
		 *
		 **/
		function  getOutputView ( )
		   { return ( $console_output ) ; } 
		   
		   
		/******************************************************************************************************
		
			Public console methods.
			
			The log, info, debug & error methods can take two forms :
			
				log ( string_or_object ) ;
				log ( format, ... ) ;
			
			In the second form, the "format" parameter is a string containing format specifiers similar to
			those accepted by the native console.xxx() method ; these can be :
			
			%% -
				The % sign.
				
			%s -
				A string.
				
			%d or %i -
				An integer number.
				
			%f -
				A float.
				
			%o -
				An object, that can be browsed.
				
			As for the console.xxx() methods, no additional width or precision specifiers are recognized.
			There must be as much parameters specified after the "format" parameter than there are format
			specifiers in the format string (except, of course, for the '%%' specifier).
			
		 ******************************************************************************************************/
		
		/**
		 * Logs a message to the console.
		 */
		var 	$console_log 		=  console. log ;

		console. log 	=  function  ( )
		   {
			__do_output ( $console_log, arguments, "log", undefined ) ;
		    }
		   
		window. log 		=  function ( ) 			// Keep track of the original version ; a shortcut, also
		   {
			$console_log. apply ( console, arguments ) ;
		    }

		/**
		 * Logs a debug message to the console.
		 */
		var 	$console_debug 		=  console. debug ;

		console. debug 	=  function  ( )
		   {
			__do_output ( $console_debug, arguments, "debug", undefined, "debug" ) ;
		    }
		   
		/**
		 * Logs an informational message to the console.
		 */
		var 	$console_info 		=  console. info ;

		console. info 	=  function  ( )
		   {
			__do_output ( $console_info, arguments, "info", undefined, "info" ) ;
		    }
		   
		/**
		 * Logs a warning message to the console.
		 */
		var 	$console_warn 		=  console. warn ;

		console. warn 		=  function  ( )
		   {
			__do_output ( $console_warn, arguments, "warn", undefined, "warn" ) ;
			return ( console ) ;
		    }
		   
		/** 
		 * Outputs a browsable object.
		 */
		var  	$console_dir 		=  console. dir ;
		   
		console. dir 	=  function  ( some_object )
		   {
			__do_output ( $console_dir, arguments, "dir", undefined, "dir" ) ;
		    }
		
		/**
		 * Logs an error message to the console.
		 */
		var 	$console_error 		=  console. error ;

		console. error 	=  function  ( )
		   {
			__do_output ( $console_error, arguments, "error", undefined, "error" ) ;
		    }
		   
		/**
		 * Clears the console.
		 */
		var 	$console_clear 		=  console. clear ;

		console. clear 	=  function  ( )
		   {
			$console_output. html ( "" ) ;
			$logged_records	=  0 ;

			$console_clear. apply ( console, arguments ) ;
		    }
		   
		
		/**
		 * Logs a command to be executed, executes it, then logs the result.
		 */
		console. execute 		=  function ( command )
		   {
			// Log the command
			var  text 		=  "<div class='log-line'>" +
							"<div class='log-linenumber'>" + ++ $logged_commands + "</div>" +
							"<div class='log-message execute'>" + command + "</div>" + 
						   "</div><br/>" ;

			$console_output. append ( text ) ;
			$logged_records ++ ;
			
			// Execute it and catch any exception
			var 	exec_result 	=  undefined ;
			var 	got_exception	=  false ;

			try
			   {
				// We need to use the top-level object's eval() function (either window or global) if the evaluated code
				// contains definitions of variables.
				// In that way, variables who should be local to this function will have a global scope.
				exec_result 	=  ObjectHelpers. global. eval ( command ) ;
			    }
			catch  ( exception )
			   {
				exec_result	=  exception ;
				got_exception 	=  true ;
			    }
			
			// Log the result 
			var   	extra_class 	=  ( got_exception ) ?  "exception" : "" ;
			var  	result_text   	=  __format ( [ exec_result ], "result " + extra_class, undefined ) ;

			$console_output. append ( result_text ) ;
		    }
		
		// Add a live click event listener on every logged object so that we can display the Browse Object dialog box
		$(document). on
		   (
			'click', 
			'#editor-console .console-log-object',
			function ( )
			   {
				var 	id 		=  $(this). data ( 'object-id' ) ;
				var 	object 		=  $logged_objects [id] ;
				var 	variables	= 
				    {
					 "Strings" 		:  Strings, 
					 "object" 		:  ObjectHelpers. classof ( object ),
					 "object-tostring"	:  '"' + object. toString ( ) + '"'
				     } ;
				var 	dialog ;
				   
      				dialog 	=  Dialogs. showModalDialogUsingTemplate ( Mustache. render ( ObjectBrowserDialogTemplate, variables ) ) ;
			    }
		    ) ;
		   
		// Events for handling input box resizing
		
		   
		// Exports
		exports. log 			=  console. log ;
		exports. info 			=  console. info ;
		exports. debug 			=  console. debug ;
		exports. error 			=  console. error ;
		exports. warn 			=  console. warn ;
		exports. dir 			=  console. dir ;
		exports. clear 			=  console. clear ;
		exports. execute 		=  console. execute ;
		exports. getOutputView 		=  getOutputView ;
		exports. setOutputView		=  setOutputView ;
	    } 
    ) ;