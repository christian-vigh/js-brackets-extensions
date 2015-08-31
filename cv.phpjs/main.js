/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, maxerr: 50 */
/*global define, $, brackets, window */

define
   (
	function ( require, exports, module ) 
	   {
		"use strict" ;

		// The name of the protoype member
		var 		prototype_member 	=  ( window. __proto__ ) ?  window. __proto__ : window. prototype ;
		   
		// Load the phpjs.json file, containing all the phpjs function definitions, including their location
		var 		phpjs_text		=  require ( "text!phpjs.json" ) ;
		   
		// Parse JSON definitions of the phpjs functions 
		var 		phpjs_raw_definitions 	=  JSON. parse ( phpjs_text ) ;
		var 		phpjs_definitions 	=  __normalize ( phpjs_raw_definitions ) ;
		   
		// Create the phpjs object that will hold all phpjs functions
		window. phpjs 	=  {} ;
		   
		   
		/**
		 *  Normalizes a phpjs function definition so that it has the following members :
		 *  - "function" :
		 *	Function name.
		 *  - "path" :
		 *	Path to the script holding the function definition.
		 *  - "enabled" :
		 *	A boolean indicating whether this function is enabled or not.
		 *
		 *  @param json_data
		 *	json data that can take one of the following forms :
		 *	"name" : "path" :
		 *		Name of the function, with the path to its source file.
		 *	"key" :
		 *	   {
		 *		"name" 		: function name
		 *		"path"		: path to the source file
		 *		"enabled" 	: boolean
		 *	    } :
		 *		Defines more precise attributes for the specified function.
		 *		The "key" value will be taken as the function name, if no "name" entry is specified 
		 *		in the structure.
		 *		The "enabled" flag specified whether the function is currently supported or not.
		 **/
		function  	__normalize ( rawdefs )
		   {
			// Normalized definitions
			var 	defs	=  { root : rawdefs. root, functions : {} } ;
			   
			   
			// Loop through input definitions, which may be either strings or objects, and produce a real object
			for  ( var  function_name  in  rawdefs. functions )
			   {
				// Either a path string or an object
				var 	raw_function_attributes 	=  rawdefs. functions [ name ] ;
				// Normalized function attributes are always an object
				var 	function_attributes		=   
				   { 
					"name" 		:  function_name, 
					"path" 		:  "", 
					"enabled" 	:  true, 
					"loaded" 	:  false 
				    } ;
				// Stub function : may be the actual loader function or an error function indicating that there was an error when trying to
				// load the source code (this happens only when the phpjs function is called)	
				var 	stub_function ;
				   
				  
				// Function definition is a string : the value is a path to the source code
				if  ( typeof  ( raw_function_attributes )  ===  'string' )
				   {
					function_attributes. path 	=  raw_function_attributes ;
					stub_function 			=  function ( ) 
					   {
						return ( __loader ( function_name ) ) ;
					    }
				    }
				// Function definition is an object : get its member values
				else if  ( typeof ( raw_function_attributes )  ===  'object' )
				   {
					// ... but take care that there is the required members
					if  ( raw_function_attributes. path )
					   {
						function_attributes 	=  $. extend ( function_attributes, raw_function_attributes ) ;
						stub_function		=  function ( )
						   {
							return ( __loader ( function_attributes. function_name ) ) ;
						    }
					    }
					// ... otherwise, invoking the function will lead to an error messahe
					else
						stub_function 	=  function ( )
						   {
							return ( __stub_error ( 'The "' + function_name + '" function definition does not contain a "path" member.' ) ) ;
						    } ;
					      
				    }
				// Function definition is neither a string nor an object : invoking the function will lead to an error message
				else
					stub_function 	=  function ( )
					   {
						return ( __stub_error ( 'The "' + function_name + '" function definition should be either a path string to the  ' +
								      'function source or a structure defining the mandatory "path" member, along with optional "name" ' +
								      'and "enabled" members. An object of type "' + 
								       typeof ( raw_function_attributes ) + ' was found.' ) ) ;
					    }
			    }
		    }
		   
		   
		function  __loader ( funcname ) 
		   {
		    }
		   
		function  __stub_error ( message ) 
		   {
		    }
	   }
    ) ;
