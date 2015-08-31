/**************************************************************************************************

    NAME
    	cv.console/modules/ConsoleOutput.js
	
    DESCRIPTION
	Defines the console primitives used for loggin messages.

    AUTHOR 
    	Christian Vigh, 2014 (christian.vigh@orange.fr, https://git.
	
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
	
		
		 var 	logged_records 		=  0 ;
		   
		/**
		 * Formats a string to be written to the log.
		 *
		 * @param arguments
		 *	Array of arguments.
		 *	The first array element is a very restricted sprintf()-like format specifier, where the 
		 *	following specifiers are allowed :
		 *	%d or %i -
		 *		Integer format.
		 *	%f -
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
		function  __format ( array, message_class )
		   {
			// No parameter supplied : return an empty string
			if  ( ! array. length )
				return ( "" ) ;
			   
			// If
			if  ( typeof ( array [0] )  ===  'object'  ||  typeof ( array [0] )  ===  'function' )
				array 	=  [ "%o" ]. concat ( array ) ;
			else if  ( typeof ( array [0] )  !==  'string' )
				array 	=  [ "%s" ]. concat ( array ) ;
			   
			var 	supported_formats	=  "odisf%" ;				// Supported formats
			var 	format_string ;							// Format string - may be empty
			var 	format_length ;
			var 	result 			=  "" ;					// Resulting string, after specifier expansion
			var 	argv, argc, 
			    	current_arg ;
			   
			// Remove format string from arguments
			argv 		=  array ;
			argc 		=  argv. length ;
			format_string 	=  argv [0]  ||  "" ;
			format_length 	=  format_string. length ;
			current_arg 	=  1 ;

			// Loop through format_string characters
			for  ( i = 0 ; i < format_length ; i ++ )
			   {
				var 	ch 	=  format_string. charAt ( i ) ;
				   
				// Current character is not a format specifier prefix ('%') : just add it to the result
				// (or it is a format specifier, but also the last character in the string)
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
				   
				// We now need an argument for that specifier ; if none available, replace it with a message 
				if  ( current_arg  >=  argc )
				   {
					result 	+=  "<i>(no arg for specifier '%" + ch + "')</i>" ;
					continue ;
				    }
				   
				// Get that argument
				var 	arg 	=  argv [ current_arg ++ ]  ;
				   
				// And convert it
				switch ( ch. toLowerCase ( ) )
				   {
					// '%%' specifier -
					//	Substituted with '%'
					case 	'%' :
						result 	+=  '%' ;
						break ;
						   
					// '%s' specifier :
					//	A string.
					case 	's' :
						 result +=  arg ;
						 break ;
						   
					// '%d' or '%i' specifiers :
					//	Integer.
					case  	'd' :
					case 	'i' :
						 var 	value 	=  parseInt ( arg ) ;
						   
						 if  ( isNaN ( value ) )
							 result += "<i>NaN</i>" ;
						 else
							 result += value ;
						 break ;
						   
					// '%f' specifier :
					// 	Float.
					case 	'f' :
						 var 	value 	=  parseFloat ( arg ) ;
						   
						 if  ( isNaN ( value ) )
							 result += "<i>NaN</i>" ;
						 else
							 result += value ;
						 break ;
						 
					// '%o' specifier :
					//	A browsable object.
					case 	 'o' :
						 result 	+= "<a class='console-log-object'><div class='before'></div>" +
							 		Object. prototype. toString. call ( arg ) + "<div class='after'></div></a>" ;
						 break ;
				    }
		 	    }
			   
			// Wrap the message to log into a container class
			var 	text 		=  ( result ) ?  result. replace ( /\n\r?/g, "<br/>" ) : result ;
			var 	text_class	=  ( logged_records % 2 ) ?  "odd" : "even" ;
			   
			
			message_class	=  message_class  ||  "log" ;
			text 		=  "<div class='log-message " + message_class + " " + text_class + "'>" + text + "</div><br/>" ;
			logged_records ++ ;
			   
			return ( text ) ;
		     }
		  

		/**
		 * Returns a formatted HTML string to be output to the console.
		 *
		 * @param args
		 *	Arguments to be output.
		 *
		 * @param class
		 *	CSS class to be used for the output text.
		 */
		function __output ( args, textclass )
		   {
			var 	text 		=  __format ( args, textclass ) ;

			$console. append ( text ) ;
			$console. animate ( { scrollTop: $console [0]. scrollHeight }, 10 ) ;
		    }
		   
		function  output  ( str, textclass )
		   {
		    }
		   
		   
		/**
		 * Logs a message to the console.
		 *
		 * @param message
		 *	Message to be logged.
		 */
		window. log 		=  function ( ) 			// Keep track of the original version ; a shortcut, also
		   {
			__console_log. apply ( console, arguments ) ;
		    }

		var 	__console_log 	=  console. log ;

		console. log 	=  function  ( )
		   {
			output ( Array. prototype. slice. call ( arguments ), "log" ) ;
			__console_log. apply ( console, arguments ) ;
			return ( console ) ;
		    }

		/**
		 * Logs an error message to the console.
		 *
		 * @param message
		 *	Message to be logged.
		 */
		var 	__console_error 	=  console. error ;

		console. error 	=  function  ( )
		   {
			output ( message, "error" ) ;
			__console_error. apply ( console, arguments ) ;
			return ( console ) ;
		    }


		/**
		 * Logs a debug message to the console.
		 *
		 * @param message
		 *	Message to be logged.
		 */
		var 	__console_debug 	=  console. debug ;

		console. debug 	=  function  ( )
		   {
			var 	message 	=  __format ( Array. prototype. slice. call ( arguments ) ) ;

			__console_output ( message, "debug" ) ;
			__console_debug. apply ( console, arguments ) ;
			return ( console ) ;
		    }


		/**
		 * Logs an informational message to the console.
		 *
		 * @param message
		 *	Message to be logged.
		 */
		var 	__console_info	 	=  console. info ;

		console. info 	=  function  ( )
		   {
			var 	message 	=  __format ( Array. prototype. slice. call ( arguments ) ) ;

			__console_output ( message, "info" ) ;
			__console_info. apply ( console, arguments ) ;
			return ( console ) ;
		    }


		/**
		 * Clears the console.
		 *
		 */
		var  	__console_clear 	=  console. clear ;

		function  clear ( )
		   {
			$console. html ( "" ) ;
			logged_records	=  0 ;

			__console_clear. apply ( console, arguments ) ;
			return ( console ) ;
		    }
		   
		// Exports
		exports. log 		=  console. log ;
		exports. info 		=  console. info ;
		exports. debug 		=  console. debug ;
		exports. error 		=  console. error ;
		exports. clear 		=  console. clear ;
		exports. output 	=  console. output ;
	    } 
    ) ;