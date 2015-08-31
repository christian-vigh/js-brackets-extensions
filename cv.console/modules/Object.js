/**************************************************************************************************

    NAME
    	cv.console/modules/Object.js
	
    DESCRIPTION
	Provides extensions to Object.

    AUTHOR 
     	Christian Vigh, 2014 (christian.vigh@orange.fr, https://github.com/christian-vigh/cv.console).
	
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
		   
		
		/***
		 *
		 *  Returns the real type of an object as a lowercase string.
		 *
		 *  @param obj -
		 *	Object whose type is to be returned.
		 *
		 ***/
		var  	globalObject 	=  ( typeof ( global )  ===  "undefined" ) ?  window : global ;
		   
		Object. type = globalObject. type = function ( obj ) 
		   {
			return  ( {} ). toString. call ( obj ). match ( /\s([a-z|A-Z]+)/ ) [1]. toLowerCase ( ) ;
		    } ;
		
	    }
    ) ;