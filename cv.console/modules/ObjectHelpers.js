/**************************************************************************************************

    NAME
    	cv.console/modules/ObjectHelpers.js
	
    DESCRIPTION
	Provides extensions to the Object class.

    AUTHOR 
     	Christian Vigh, 2014 (christian.vigh@orange.fr, 
		https://github.com/christian-vigh/brackets.cv.console).
		
    LICENSE
    	GPL V3 (see the LICENSE file).
	
     HISTORY
     [Version : 1.0.0]	[Date : 2014-03-12]	[Author : CV]
     	Initial version.
    	
 **************************************************************************************************/

define 
   ( 
	function ( require, exports, module ) 
	   {
		'use strict' ;

		// An independent way to reference the global object
		var  	global_string 	=  ( typeof ( global )  ===  "undefined" ) ?  "window" : "global" ;
		var  	global 		=  ( typeof ( global )  ===  "undefined" ) ?  window : global ;
		

		// Trims the stack so that it does not have the call to this module, and all the calls to require.js 
		// to load the extension that triggered the error. excerpt from Brackets DeprecationWarning.js _trimStack() function.
		function  __formatStack ( stack ) 
		   {
			var	requirejs_index ;

			// Remove everything in the stack up to the end of the line that shows this module file path
			stack = stack. substr ( stack. indexOf ( ")\n" ) + 2 ) ;

			// Find the very first line of require.js in the stack if the call is from an extension.
			// Remove all those lines from the call stack.
			requirejs_index 	=  stack. indexOf ( "requirejs/require.js" ) ;
			   
			if  ( requirejs_index  !==  -1 ) 
			   {
		    		requirejs_index 	=  stack. lastIndexOf ( ")", requirejs_index ) + 1 ;
		    		stack 			=  stack. substr ( 0, requirejs_index ) ;
			    }

			return ( stack ) ;
		    }

		   
		/***
		 *
		 *  Returns the real type of an object as a lowercase string.
		 *
		 *  @param obj -
		 *	Object whose type is to be returned.
		 *
		 ***/
		var 	__type, __class ;
		   
		Object. type = global. type = __type = function ( obj ) 
		   {
			return  ( {} ). toString. call ( obj ). match ( /\s([a-z|A-Z]+)/ ) [1]. toLowerCase ( ) ;
		    } ;
		   
		// Same version, without lowercasing
		Object. classof = global. classof = __class = function ( obj ) 
		   {
			return  ( {} ). toString. call ( obj ). match ( /\s([a-z|A-Z]+)/ ) [1] ;
		    } ;
		   
		   
		/***
		 *
		 *  Defines an Error class of the specified name, in the global namespace.
		 *
		 *  @param  classname 
		 *	Error class name. Should end with the string "Error".
		 * 
		 ***/
		function  defineErrorClass ( className )
		   {
			var 	__logged_errors 	=  [] ;
			   
			global [ className ]	=  function ( message )
			   {
				Error. apply ( this, arguments ) ;
				this. message 	=  message  ||  className ;
				
				if  ( __logged_errors [ this. message ]  ===  undefined )
				   {
					__logged_errors [ this. message ] 	=  true ;
					this. message 	+= "\n" + __formatStack ( new Error ( ). stack ) ;
				    }
			    }
			
			global [ className ]. prototype 		=  new Error ( ) ;
			global [ className ]. prototype. name 		=  className ;
		    }

		// Exports
		exports. type 			=  __type ;
		exports. classof		=  __class ;
		exports. global 		=  global ;
		exports. defineErrorClass	=  defineErrorClass ;
	    }
    ) ;