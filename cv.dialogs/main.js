/**************************************************************************************************

    NAME
    	cv.dialogs/main.js
	
    DESCRIPTION
    	Provides stylable alternatives to the native Javascript alert(), confirm() and input()
	functions. Also provides an alert()-like function called error().
	These functions are also made available in the global brackets object.
	
    AUTHOR 
    	Christian Vigh, 2014 (christian.vigh@orange.fr, https://github.com/christian-vigh).
	
    LICENSE
    	GPL V3 (see the LICENSE file).
	
     NOTES 
     	There is a Microsoft-like msgbox (MessageBox) function in this source file. Some kind of
	nostalgy maybe ?
	
     HISTORY
     [Version : 1.0.0]	[Date : 2014-03-22]	[Author : CV]
     	Initial version.
    	
 **************************************************************************************************/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 		  */
/*global define, console, brackets, $, Mustache 						  */

define
   (
	function  ( require, exports, module ) 
	   {
    		"use strict" ;

		   
		// Brackets objects
		var 	ExtensionUtils 			=  brackets. getModule ( 'utils/ExtensionUtils' ),
		    	Dialogs 			=  brackets. getModule ( 'widgets/Dialogs' ) ;
    
		// Local objects
		var	Strings 			=  require ( 'modules/Strings' ) ;
		var 	DialogTemplate 			=  undefined ;
		var 	DialogId 			=  1 ;
		   
		// Positioning of modal dialogs
		   
		// Dialog box constants
		var	DialogConstants 		=
		    {
			// Dialog box return values
			IDABORT 			:  3,
			IDCANCEL 			:  2,
			IDCONTINUE 			:  11,
			IDIGNORE 			:  5,
			IDNO				:  7,
			IDOK 				:  1,
			IDRETRY				:  4,
			IDTRYAGAIN	 		:  10,
			IDYES 				:  6,   
			IDCUSTOM			:  1000,		// Not Microsoft but a good value to start at for specifying your custom button ids

			// Dialog box display options 
			MB_ABORTRETRYIGNORE		:  0x00000002,		// Message box button group types
			MB_CANCELTRYCONTINUE		:  0x00000006,
			MB_HELP				:  0x00004000,
			MB_OK				:  0x00000000,
			MB_OKCANCEL			:  0x00000001,
			MB_RETRYCANCEL			:  0x00000005,
			MB_YESNO			:  0x00000004,
			MB_CUSTOM 			:  0x0000000A,		// This one's not from Microsoft...
			MB_YESNOCANCEL			:  0x00000003,
			MB_BUTTON_GROUP_MASK		:  0x0000000F,
			MB_ICONEXCLAMATION		:  0x00000030,		// Message box icons
			MB_ICONWARNING			:  0x00000030,
			MB_ICONINFORMATION		:  0x00000040,
			MB_ICONASTERISK			:  0x00000040,
			MB_ICONQUESTION			:  0x00000020,
			MB_ICONSTOP			:  0x00000010,
			MB_ICONERROR			:  0x00000010,
			MB_ICONHAND			:  0x00000010,
			MB_ICON_MASK 			:  0x000000F0,
			MB_DEFBUTTON1			:  0x00000000,		// Default button
			MB_DEFBUTTON2			:  0x00000100,
			MB_DEFBUTTON3			:  0x00000200,
			MB_DEFBUTTON4			:  0x00000300,
			MB_DEFBUTTON_MASK 		:  0x00000700,
			    
			// Dialog classes. They are all placed as the same level as the "javascript-dialog"
			MB_MSGBOX_DIALOG_CLASS 		:  "msgbox",
			MB_ALERT_DIALOG_CLASS 		:  "alert",
			MB_ERROR_DIALOG_CLASS 		:  "error",
			MB_CONFIRM_DIALOG_CLASS		:  "confirm",
			MB_INPUT_DIALOG_CLASS		:  "input"
		    } ; 
		   
		// Load CSS
		ExtensionUtils. loadStyleSheet ( module, 'css/dialogs.css' ) ;
			   
	   
		/***
		 *
		 *  A Windows-like msgbox function.
		 *
		 *  @param message 
		 *	Message to be displayed.
		 *
		 *  @param title
		 *	Window title. This parameter is optional.
		 *
		 *  @param style
		 *	Windows-style options, using the MB_xxx constants.
		 *
		 *  @param callback
		 *	Function to be called when the user clicks the Ok button.
		 *
		 *  @param options
		 *	Dialog options specified through the following members :
		 *
		 *	- buttons :
		 *		An array of button definitions that have the following members :
		 *		- className :
		 *			An optional class name that will be added to the button html definition.
		 *		- id :
		 *			Button id.
		 *		- text :
		 *			Button text.
		 *
		 *		Note that the "style" parameter by itself determines which button (ok, cancel, etc.)
		 *		will appear in the dialog box. The "buttons" entry of the "options" parameter can be
		 *		used to override such default definitions.
		 *
		 *	- callback :
		 *		A function that will be called once the user has clicked on a button. The callback 
		 *		has the following signature :
		 *
		 *			function ( button_id ) { ... }
		 *
		 *		where "button_id" is the id of the clicked button.
		 *
		 *	- dialogClass :
		 *		The name of the class that will be added to the <div> that wraps the modal-header,
		 *		modal-body and modal-footer <div> components.
		 *
		 *	- dialogId :
		 *		Id of the dialog box. If none specified, a unique identifier will be automatically
		 *		generated.
		 *
		 *	- message :
		 *		Message to be displayed.
		 *
		 *	- title :
		 *		Message box title. The default title is determined by the message box type.
		 *
		 *  @notes
		 *	- The title, style, callback & options parameters can be specified in any order.
		 *	  Be aware that the first string encountered will be considered as the message to
		 *	  display, the second as the title. Due to their respective types, the style,
		 *	  callback and options parameters can be specified in any order.
		 *
		 ***/
		function  __msgbox ( message, title, style, callback, options )
		   {
			// The final options, resulting from the merging of the supplied parameters
			var 	final_options 		=
			    {
				 buttons 	:  [],
				 callback 	:  undefined,
				 dialogClass	:  "",
				 dialogId 	:  "message-box-" + DialogId ++,
				 message 	:  message,
				 style 		:  DialogConstants. MB_OK | DialogConstants. MB_DEFBUTTON1,
				 title 		:  Strings. MSGBOX_ALERT_TITLE,
			     } ;
			   
			 // A temporary options structure only meant to hold the list of default buttons...
			 var 	default_buttons_displayed 	=  
			     {
				 buttons 	:  []
			      } ;
			 // The supplied options, or an empty object if this parameter was not specified
			 var 	supplied_options 	=  {} ;
				
			// Loop through function arguments and dispatch their values to the correct object
			var 	found_message 		=  false ;
			   
			for  ( var  i = 0 ; i  <  arguments. length ; i ++ )
			   {
				var 	arg 		=  arguments [i] ;
				var 	argtype 	=  typeof ( arg ) ;
				   
				// String argument :
				//	This can be the dialog message (first time) or the dialog title (second time).
				if  ( argtype  ===  "string" ) 
				   {
					if (  found_message )
						final_options. title 	=  arg ;
					else
					   {
						final_options. message 	=  arg ;
						found_message 		=  true ;
					    }
				    }
				// Number argument :
				//	The style of the message box (one of the MB_xxxx button group types)
				else if  ( argtype   ===  "function" )
					final_options. callback 	=  arg ;
				// Function argument :
				//	This is the callback function to be called when the user has clicked a button.
				else if  ( argtype  ===  "number" )
					final_options. style 		=  arg ;
				// Object argument :
				//	We can imagine that it is a conformant message box options specifier.
				else if  ( argtype  ===  "object" ) 
					supplied_options 	=  arg ;
			    }

			// Determine which buttons need to be displayed
			switch  ( final_options. style  &  DialogConstants. MB_BUTTON_GROUP_MASK )
			   {
				case  DialogConstants. MB_ABORTRETRYIGNORE :
					default_buttons_displayed. buttons 	=  
					   [
						{ id : DialogConstants. IDABORT		, text : Strings. MSGBOX_ABORT_BUTTON	, className : "right" 	},
						{ id : DialogConstants. IDRETRY		, text : Strings. MSGBOX_RETRY_BUTTON	, className : "right" 	},
						{ id : DialogConstants. IDIGNORE	, text : Strings. MSGBOX_IGNORE_BUTTON	, className : "right" 	}
					    ] ;
					break ;
					   
				case  DialogConstants. MB_CANCELTRYCONTINUE :
					default_buttons_displayed. buttons 	=  
					   [
						{ id : DialogConstants. IDCANCEL	, text : Strings. MSGBOX_CANCEL_BUTTON	, className : "right" 	},
						{ id : DialogConstants. IDTRY		, text : Strings. MSGBOX_TRY_BUTTON	, className : "right"	},
						{ id : DialogConstants. IDCONTINUE	, text : Strings. MSGBOX_CONTINUE_BUTTON, className : "right"	}
					    ] ;
					break ;
					   
				case  DialogConstants. MB_OKCANCEL :
					default_buttons_displayed. buttons 	=  
					   [
						{ id : DialogConstants. IDOK		, text : Strings. MSGBOX_OK_BUTTON	, className : "right" 	},
						{ id : DialogConstants. IDCANCEL	, text : Strings. MSGBOX_CANCEL_BUTTON	, className : "right" 	}
					    ] ; 
					break ;
					   
				case  DialogConstants. MB_RETRYCANCEL :
					default_buttons_displayed. buttons 	=  
					   [
						{ id : DialogConstants. IDRETRY		, text : Strings. MSGBOX_RETRY_BUTTON	, className : "right"	},
						{ id : DialogConstants. IDCANCEL	, text : Strings. MSGBOX_CANCEL_BUTTON	, className : "right" 	}
					    ] ;
					break ;
					   
				case  DialogConstants. MB_YESNO :
					default_buttons_displayed. buttons 	=  
					   [
						{ id : DialogConstants. IDYES		, text : Strings. MSGBOX_YES_BUTTON	, className : "right"	},
						{ id : DialogConstants. IDNO		, text : Strings. MSGBOX_NO_BUTTON	, className : "right" 	}
					    ] ;
					break ;
					   
				case  DialogConstants. MB_YESNOCANCEL :
					default_buttons_displayed. buttons 	=  
					   [
						{ id : DialogConstants. IDYES		, text : Strings. MSGBOX_YES_BUTTON	, className : "right"	},
						{ id : DialogConstants. IDNO		, text : Strings. MSGBOX_NO_BUTTON	, className : "right" 	},
						{ id : DialogConstants. IDCANCEL	, text : Strings. MSGBOX_CANCEL_BUTTON	, className : "right" 	}
					    ] ;
					break ;
					   
				case  DialogConstants. MB_CUSTOM :	// The caller must supply its own definitions
					default_buttons_displayed. buttons. push ( {} ) ;
					break ;
					   
				case  DialogConstants. MB_OK :
				default :
					default_buttons_displayed. buttons 	=  
					   [
						{ id : DialogConstants. IDOK		, text : Strings. MSGBOX_OK_BUTTON	, className : "center" 	}
					    ] ;
			    }
			   
			// Join the supplied options with the ones we have determined...
			var  	final_options 	=  $. extend ( final_options, options, default_buttons_displayed ) ;
			   
			// Paranoia : the caller has specified MB_CUSTOM but no button definition was supplied.
			if  ( final_options. length  ===  0 )
			   {
				default_buttons_displayed. buttons 	=  
				   [
					{ id : DialogConstants. IDOK		, text : Strings. MSGBOX_OK_BUTTON	, className : "center" 	}
				    ] ;
			    }
			   
			// Now determine which button has the primary class
			if  ( ( final_options. style  &  DialogConstants. MB_DEFBUTTON1 )  ===  DialogConstants. MB_DEFBUTTON1  &&  
			     		final_options. buttons. length  >  0 )
				final_options. buttons [0]. className 	+=  " primary" ;

			if  ( ( final_options. style  &  DialogConstants. MB_DEFBUTTON2 )  ===  DialogConstants. MB_DEFBUTTON2  &&  
			     		final_options. buttons. length  >  1 )
				final_options. buttons [1]. className 	+=  " primary" ;

			if  ( ( final_options. style  &  DialogConstants. MB_DEFBUTTON3 )  ===  DialogConstants. MB_DEFBUTTON3  &&  
			     		final_options. buttons. length  >  2 )
				final_options. buttons [2]. className 	+=  " primary" ;
			   
			if  ( ( final_options. style  &  DialogConstants. MB_DEFBUTTON4 )  ===  DialogConstants. MB_DEFBUTTON4  &&  
			     		final_options. buttons. length  >  3 )
				final_options. buttons [3]. className 	+=  " primary" ;
			   
			// Then, check if we should provide a Help button
			if  ( final_options. style  &  DialogConstants. MB_HELP )
			   {
				var 	help_button_found 	=  false ;
				   
				for  ( var  button  in  final_buttons. buttons )
				   {
					if  ( button. id  ===  DialogConstants. IDHELP )
					   {
						help_button_found 	=  true ;
						break ;
					    }
				    }
				   
				if  (  ! help_button_found )
				   {
					final_options. buttons. push
					   (
						{ id : DialogConstants. IDHELP		, text : Strings. MSGBOX_HELP_BUTTON	, className : "left primary" 	}
					    ) ;
				    }
			    }
			
			// Check if we already loaded the corresponding dialog template  
			if  ( DialogTemplate  ===  undefined )
				DialogTemplate 	=  require ( 'text!html/msgbox.html' ) ;
			   
			// Build the substitution variables
			var 	variables 	=
			    {
				buttons 		:  final_options. buttons,
				dialogClass 		:  final_options. dialogClass,
				dialogId 		:  final_options. dialogId,
				message 		:  final_options. message,
				title 			:  final_options. title,
				cancelButton 		:  DialogConstants. IDCANCEL 
			     } ;
			   
			   
			// Render the template
			var 	template 	=  Mustache. render ( DialogTemplate, variables ) ;
			   
			// Display the dialog, calling the supplied callback if present
			var 	MessageBox 	=  Dialogs. showModalDialogUsingTemplate ( template, true )
			var  	$MessageBox 	=  MessageBox. getElement ( ) ;
			   
			MessageBox. done
			   (
				function  ( button_id )
				   {
					if  ( final_options. callback )
					   {
						// Replace any builtin Brackets Dialog id strings with their IDxxx equivalent
						if  ( button_id  ===  "cancel" )
							button_id 	=  DialogConstants. IDCANCEL ;

						final_options. callback ( button_id ) ;
					    }
				    }
			     ) ;
			  
			   
			/*** 
				Handle mouse moves and mouse up events from within the $moving_div object.
			 ***/
			var 	__last_mousemove_position ;	// Last seen mouse position ; initialized by the mousedown event handler
			var 	dragging 		=  false ;
			var 	moving_div_id 		=  "moving-" + final_options. dialogId ;
			var 	$moving_div 		=  undefined ;
			   
			   
			//  __mouseup -
			//	This event is received by the $moving_div <div> which is created when a dialog box header receives a mousedown event.
			// 	It removes the mouseup and mousemove events that were set up by the mousedown event handler, along with the $moving_div
			//	<div>.
			function  __mouseup ( e ) 
			   {
				dragging 	=  false ;

				// Destroy the <div> that caught mouse events, along with it's mouse event listeners
				document. body. removeEventListener ( 'mouseup', __mouseup ) ;
				document. body. removeEventListener ( 'mousemove', __mousemove ) ;
				$moving_div. remove ( ) ;
			     }
			 
			   
			// __mousemove -
			//	Repositions the dialog box according to the mouse position. 
			//	Note that the jQuery offset() function will not handle correctly the absolute position given by the Event object.
			//	In fact there are x- and y- deltas that come from I don't known where...
			//	Due to that, we have to compute the new offset() of the dialog box using the deltas between the current
			//	mouse position given by the Event object and its previous position.
			//	Of course, the initial "previous position" has been initialized by the dialog box mousedown event handler.
			function  __mousemove ( e ) 
			   {
				/// Don't do anything if dragging has not yet started
				if  ( ! dragging )
					return ;
				   
				// Compute the new offset of the dialog box by using the delta between the previous position of the mouse
				// and the current one
				var 	current_offset 	=  $MessageBox. offset ( ) ;
				var  	hdelta 		=  e. pageX - __last_mousemove_position. left ;
				var 	vdelta		=  e. pageY - __last_mousemove_position. top ;
				   
				__last_mousemove_position	=  { left : e. pageX, top : e. pageY } ;
			   	$MessageBox. offset ({ left : current_offset. left + hdelta, top : current_offset. top + vdelta }) ;
				   $moving_div. css ( 'cursor', 'default' ) ;
			    }
			   
			   
			
			$('.modal-header', $MessageBox)
				.mousedown 
				   (
					function ( event )
					   {
						// If the event target is the Close button, simply do like the __dismissDialog function
						// in the Brackets' Dialogs.js source file. I have found no way to reference the button
						// class (tried : $('.modal-header :not(.close), $MessageBox) but it did not work).
						// The following code provides a workaround to that.
						var 	target 		=  $(event. toElement) ;
						   
						if  ( target. hasClass ( 'close' ) )
						   {
							$MessageBox. data ( "buttonId", DialogConstants. MB_CANCEL ) ;
							$MessageBox. modal ( "hide" ) ;
							return ;
						    }

						// Create the $moving_div div, whose sole purpose is to receive mousemove and mouseup events
						// (not all mousemove events could be catched by the dialog box header bar, since there is no
						// setCapture() API function, and mouseup handles the end of mouse moves).
						dragging 	=  true ;
						$(document.body). append ( "<div id='" + moving_div_id + "'></div>" ) ;
                                                $moving_div    =  $('#' + moving_div_id ) ;				
						   
						$moving_div
							.css ( 'cursor', 'default' )
							.css ( 'background-color', 'transparent' ) 		// transparent background (would you imagine anything else ?)
							.css ( 'z-index', 0x7FFFFFFF )				// Make sure we are "topmost"
							.css ( 'top', '0px' )					// Absolute position starting at (0,0)
							.css ( 'left', '0px' )
							.css ( 'position', 'absolute' )
							.width ( $(document. body). width ( ) )			// And height/width equal to the document body
							.height ( $(document. body). height ( ) ) ;
						   
						// First mouse position has to be remembered
						__last_mousemove_position 	=  { left : event. pageX, top : event. pageY } ;
						   
						// Then listen to mousemove events until we encounter a mouseup
						document. body. addEventListener ( 'mouseup'  , __mouseup ) ;
						document. body. addEventListener ( 'mousemove', __mousemove ) ;
					    }
				    ) ;
			   
		    }

		   
		// And now, the message box functions...
		function  msgbox ( message, title, style, callback )
		   {
			__msgbox ( message, title, style, callback, { dialogClass : "msgbox" } ) ;
		    }
		   
		function  alert ( message, title, callback )
		   {
			__msgbox ( message, ( title ||  Strings. MSGBOX_ALERT_TITLE ), callback, 
				  	DialogConstants. MB_OK | DialogConstants. MB_DEFBUTTON1, { dialogClass : "message" } ) ;
		    }

		function  warning ( message, title, callback )
		   {
			__msgbox ( message, ( title ||  Strings. MSGBOX_WARNING_TITLE ), callback, 
				  	DialogConstants. MB_OK | DialogConstants. MB_DEFBUTTON1, { dialogClass : "warning" } ) ;
		    }

		function  error ( message, title, callback )
		   {
			__msgbox ( message, ( title  ||  Strings. MSGBOX_ERROR_TITLE ), callback, 
				  	DialogConstants. MB_OK | DialogConstants. MB_DEFBUTTON1, { dialogClass : "error" } ) ;
		    }
		   
		function  confirm ( message, title, callback )
		   {
			__msgbox ( message, title, callback, DialogConstants. MB_YESNO | DialogConstants. MB_DEFBUTTON1, { dialogClass : "confirm" } ) ;
		    }

		   
		// We will plug our methods and constants to the global object
		var  	global 			=  ( typeof ( global )  ===  "undefined" ) ?  window : global ;

		global. dialogs 	=  {} ;
		 
		// Exports - Dialog constants
		for  ( var  constant  in  DialogConstants )
		   {
			exports [ constant ]		=  DialogConstants [ constant ] ;
			global. dialogs [ constant ]	=  DialogConstants [ constant ] ;
		     }
			   
		// Exports - Methods
		exports. msgbox 		=  msgbox ;
		exports. alert 			=  alert ;
		exports. confirm 		=  confirm ;
		exports. error 			=  error ;
		exports. warning 		=  warning ;
		//exports. input 		=  input ;
		   
		// Also exports to the global object
		global. dialogs. msgbox 	=  msgbox ;
		global. dialogs. alert 		=  alert ;
		global. dialogs. confirm 	=  confirm ;
		global. dialogs. error 		=  error ;
		global. dialogs. warning 	=  warning ;
		//global. dialogs. input 		=  input ;
	   }
    ) ;
