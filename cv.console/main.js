/**************************************************************************************************

    NAME
    	cv.console/main.js
	
    DESCRIPTION
    	Overloads the log(), error(), debug() and dir() methods of the standard Console object to
	be able to log in the $('#editor-console') panel in addition to the developr's tools console
	window.
	
    PREFERENCES SETTINGS
    	The default preferences settings are stored in the settings/preferences.js file.
	They are set upon the cv.console's first invocation and managed later in the Brackets
	preferences system. These settings are the following :
		
	- console-input-width (integer) :
		An integer value giving the width, in pixels, of the console command <input> field.
		Note that this <input> field may be redimensioned by dragging its right corner from
		left to right, and that its current width is maintained in the Preferences system.
		
	- enabled (boolean) :
		A value indicating whether this extension is enabled or not.
		Well, it has not been really enforced so far...
		
	- history (object) :
		A settings structure for the history manager defined in HistoryManager.js.
		Its can contain the following properties :
		
		- autosave (boolean) :
			When true, the history will be saved every "autosave-interval" seconds.
			Note that if the "new-command-saves-history" is true, the history will be 
			systematically save when a new Javascript command is entered.
			
		- autosave-interval (integer) :
			Number of seconds between two history autosaves.
			
		- command-grouping (boolean) :
			When false, new Javascript commands are systematically added to the history.
			When true, they are only added if they are unique in the history.
			
		- enabled (boolean) :
			A boolean value indicating whether the commands typed in the console <input>
			field should be historicized or not.
			
		- history-file (string) :
			Path to the history backup file. Defaults to "data/history.json".
			
		- min-command-size (integer) :
			Javascript commands shorter than that size will not be added to the history.
			
		- max-history-size (integer) :
			Maximum size of the history. Specify 0 for unlimited size.
			
		- new-command-saves-history (boolean) :
			When true, every new command input provokes history saving.
	
	- visible (boolean) :
		A value indicating whether the console editor is visible upon startup. If true, it
		will be displayed in the bottom panel area ; if false, an icon at the bottom of the
		right vertical toolbar will be added. Clicking on the icon will display the console
		editor.
	
    AUTHOR 
    	Christian Vigh, 2014 (christian.vigh@orange.fr, https://github.com/christian-vigh).
	
    LICENSE
    	GPL V3 (see the LICENSE file).
	
     CREDITS
     	This extension has been largely inspired by the brackets-console extension written by
	Alexadru Ghiura (ghalex@gmail.com).
	
     HISTORY
     [Version : 1.0.2]	[Date : 2014-02-16]	[Author : CV]
     	Initial version.
    	
 **************************************************************************************************/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 		  */
/*global define, console, brackets, $, Mustache 						  */

// TODO : resize console input on window resize

define
   (
	function  ( require, exports, module ) 
	   {
    		"use strict" ;

		   
		// Brackets objects
		var 	AppInit       		=  brackets. getModule ( "utils/AppInit" ),
		        PanelManager 		=  brackets. getModule ( "view/PanelManager" ),
			PreferencesManager 	=  brackets. getModule ( 'preferences/PreferencesManager' ),
		    	ExtensionUtils 		=  brackets. getModule ( 'utils/ExtensionUtils' ),
		    	KeyEvents 		=  brackets. getModule ( 'utils/KeyEvent' ),
		    	Dialog 			=  brackets. getModule ( 'widgets/Dialogs' ) ;
    
		// Local objects
		var	Strings 		=  require ( 'modules/Strings' ) ;
		var 	EmbeddedConsole 	=  require ( 'modules/EmbeddedConsole' ) ;
		var 	HistoryManager 		=  require ( 'modules/HistoryManager' ) ;
		var 	History ;
                var     ResizerDivId            =  'editor-console-input-resizer' ;
		   
		// Rendering of console template
		var 	ConsoleHTML 		=  Mustache. render ( require ( 'text!html/console.html' ), Strings ) ;

		// Load console CSS
		ExtensionUtils. loadStyleSheet ( module, 'css/console.css' ) ;
			   
		// Preferences & settings 
		var 	DefaultPreferences 	=  JSON. parse ( require ( 'text!settings/preferences.json' ) ) ;
		var 	EnabledSetting,
		    	VisibleSetting,
		    	ConsoleInputWidthSetting,
		    	HistorySettings ;
		  
		PreferencesManager. definePreference ( 'enabled'		, 'boolean', DefaultPreferences. enabled ) ;
		PreferencesManager. definePreference ( 'visible'		, 'boolean', DefaultPreferences. visible ) ;
		PreferencesManager. definePreference ( 'console-input-width'	, 'number' , DefaultPreferences [ 'console-input-width' ] ) ;
		PreferencesManager. definePreference ( 'history' 		, 'object' , DefaultPreferences. history ) ;

		EnabledSetting 			=  PreferencesManager. get ( 'enabled' ) ;
		VisibleSetting 			=  PreferencesManager. get ( 'visible' ) ;
		ConsoleInputWidthSetting	=  PreferencesManager. get ( 'console-input-width' ) ;
		HistorySettings 	  	=  PreferencesManager. get ( 'history' ) ;
		   
		// Create the history manager
		History 	=  new HistoryManager. History ( HistorySettings ) ;
		
		// Internal variables
		var 	initialized 			=  false ;		// Tells "true" when we're initialized
		var 	$console_panel,						// The whole console panel, including the toolbar
                        $console_toolbar,                                       // Editor console toolbar
                        $resizer_div,                                           // A div created for keeping the resize cursor when resizing the console input
		    	$console,						// Console log output view
		    	$console_icon,						// Console icon added to the right bottom toolbar when the console is hidden
			$showhide,						// Show/hide link or button
			$clear,							// Clear link
		    	$jsinput ;						// Javascript command input object
		   
		// Initializes the console object
		if  ( EnabledSetting )
		   {
			AppInit. appReady 
			   (
				function  ( )
				   {
					// Console extension initialization
					initialized 	=  true ;

					// Create the console panel
					$console_panel 	=  PanelManager. createBottomPanel ( 'cv.console.toolbar', $(ConsoleHTML), 20 ) ;
					$console_panel. setVisible ( true ) ;

					// Réferences to console objects 
					$console 	         =  $('#editor-console') ;
                                        $console_toolbar         =  $('#editor-console-toolbar') ;
					$showhide	         =  $('#editor-console-toolbar  #editor-console-show-hide') ;
					$clear 		         =  $('#editor-console-toolbar  #editor-console-clear') ;
					$console_icon            =  $('<a href="#" title="' + Strings. CONSOLE_ICON_HELP + '" id="editor-console-icon"></a>' )
								        .appendTo ( '#main-toolbar .bottom-buttons' )
								        .addClass ( 'hidden' ) ;
					$jsinput 	         =  $('#editor-console-toolbar #editor-console-command-input') ;
                                        
					
					// Set the embedded console view panel
					EmbeddedConsole. setOutputView ( $console ) ;   
					   
					// Reflect the last shown state of the panel
					if  ( VisibleSetting  ===  false )
					   {
						$console_panel. hide ( ) ;
						$console_icon . removeClass ( 'hidden' ) ;
					    }
					   
					//  Attributes of the input box : size and border sizing, and last known width
					$jsinput. width ( ConsoleInputWidthSetting ) ;
                                        $jsinput. css ( 'box-sizing', 'border-box' ) ;
					   
					// Show/hide console link
					$showhide. click
					   (
						function  ( )
						   {
							if  ( $console_panel. isVisible ( ) )
							   {
								$console_panel. hide ( ) ;
								$console_icon . removeClass ( 'hidden' ) ;
								PreferencesManager. set ( 'visible', false ) ;
							    }
							else
							   {
								$console_panel. show ( ) ;
								$console_icon . addClass ( 'hidden' ) ;
								PreferencesManager. set ( 'visible', true ) ;
								$('#editor-console-command-input'). focus ( ) ;
							    }


						    }
					    ) ;

					// Clear console link
					$clear. click
					   (
						function  ( ) 
						   {
							EmbeddedConsole. clear ( ) ;
						    }
					    ) ;


					// Console button is shown in main-toolbar only when the console is hidden ;
					// Upon clicking it, show back the console and hide the console button
					$console_icon. click 
					   (
						function ( )
						   {
							$showhide. click ( ) ;
						    }
					    ) ;


					// Keydown event handler :
					// 	Catches keys on the console input field.
					$jsinput. keydown
					   (
						function  ( e )
						   {
							var  	code 			=  ( e. which )  ||  ( e. keycode ) ;
							var 	value 			=  $jsinput. val ( ) ;
							var 	underlying_value	=  $jsinput. data ( 'input-value' ) ;
							var 	entry ;
							var 	re_search ;
							var 	handled  		=  false ;

							switch ( code )
							   {
								// ESCAPE key :
								// 	Empty the input field.
								case 	KeyEvents. DOM_VK_ESCAPE :
									$jsinput. val ( "" ). data ( 'input-value', '' ) ;
									History. resetPointer ( ) ;
									handled 	=  true ;
									break ;
									   
								// RETURN key :
								// 	Execute the command.
								case 	KeyEvents. DOM_VK_RETURN :
									// Execute the command and log it to the history
									if  ( value  !==  "" )
									   {
										EmbeddedConsole. execute ( value ) ;
										History. add ( value ) ;
									    }

									// And get ready for the next command
									$jsinput. val ( "" ) ;
									$jsinput. focus ( ) ;
									History. resetPointer ( ) ;
									handled 	=  true ;
									break ;
									   
								// BACKSPACE key :
								//	Resets the history pointer.
								case 	KeyEvents. DOM_VK_BACK_SPACE :
									History. resetPointer ( ) ;
									break ;
									   
								// UP/DOWN keys :
								// 	Display the previous/next history entry.
								// 	When the CTRL key is pressed, the search is made using regular expressions.
								case 	KeyEvents. DOM_VK_UP :
									re_search 	=  e. altKey ;
									entry 		=  History. getPrevious ( underlying_value, re_search ) ;
									
									if  ( entry )
										$jsinput. val ( entry. command ) ;
										 

									handled 	=  true ;
									break ;
									   
								case 	KeyEvents. DOM_VK_DOWN :
									re_search 	=  e. altKey ;
									entry 		=  History. getNext ( underlying_value, re_search ) ;
									
									if  ( entry )
										$jsinput. val ( entry. command ) ;

									handled 	=  true ;
									break ;
							    }
							   
							// Cancel event propragation if we handled the key
							if  ( handled )
							   {
								e. preventDefault ( ) ;
								e. stopImmediatePropagation ( ) ;
								   
								return ( false ) ;
							    }
						    }

					) ;
					   
					   
					// Keypress event handler :
					//	Supplies auto-completion using the command history.
					$jsinput. keypress
					   (
						function  ( e )
						   {
							var  	code 	=  ( e. which )  ||  ( e. keycode ) ;
							var 	value	=  $jsinput. val ( ) + String. fromCharCode ( e. which ) ;
						
							   
							// Remember the current input value so that searching through a set of history commands 
							// starting with the same prefix will work (for example, "log('a')" and "log('b')").
							// The purpose is to allow the following operations :
							// - The user types "l"
							// - Then presses the Up arrow : "log('b')" is displayed
							// - The user presses the Up arrow again : "log('a')" is displayed
							$jsinput. data ( 'input-value', value ) ;
							History. resetPointer ( ) ;
						    }
					    ) ;
					   
					   
                                        // Input box autoresizing -
                                        // 	Well I know there is something to do with the "resize" CSS property but I could not make it work...
                                        // 	So the trick used below is to create a big <div> that covers the whole document area and add mouse
					// 	event listeners to track mouse events and preserve the resize cursor.
					// 	Hope that one day Chrome will provide the setCapture() and releaseCapture() facilities...
                                        var     $jsinput_resizing_started       =  false ;		// True when the user has clicked within the right of the console input
                                        var     $tolerance                      =  20 ;			// ... well, the box of $tolerance pixels around this console input right
                                        var     $initial_cursor                 =  undefined ;		// Initial input box cursor
					   
					// Try to keep constant coordinates to be evaluated only once ; first, the left position of the console input
                                        var     $__jsinput_left         =  $('#editor-console-command-input'). offset ( ). left ;
					// ... then the left position of the rightmost element (editor-console-clear). The constant '20' is an approximate
					// safeguard when padding/margin attributes are specified.
					var     $__max_left 		=  $('#editor-console-toolbar #editor-console-clear'). parent ( ). parent ( ). 
										offset ( ). left - 20 ;

	
					// __getsquare -
                                        // 	Get the actual, absolute rectangle of the input box
                                        function  __getsquare ( )
                                           {
                                                var     offset  =  $jsinput. offset ( ) ;
                                                var     result  =  
                                                   {
                                                        left    :  offset. left,
                                                        top     :  offset. top,
                                                        width   :  $jsinput. width ( ),
                                                        height  :  $jsinput. height ( )
                                                    } ;
                                                   
                                                return ( result ) ;
                                            }
                                           
					  
					// __within -
                                        // 	Checks if mouse cursor falls within the allowed area for resizing the input box ; the $tolerance variable
                                        // 	gives the number of pixels outside the box that are taken into account for that. Note that this square area
                                        // 	lies in the right portion of the field.
                                        function  __within ( square, x, y )
                                           {
                                                var     right   =  square. left + square. width ;
                                                   
                                                return ( x  >=  right - $tolerance  &&  x  <=  right + $tolerance  &&
                                                         y  >=  square. top  - $tolerance &&  y  < square. top + square. height + $tolerance ) ;
                                            }

                                           
                                        // mouseover event -
                                        //      Not really time to do any significant change for now, but it may be time to change the
                                        //      cursor appearance and say that we have started the resizing process.
					//	Note that Chrome's behavior is strange : you cannot see the 'e-resize' cursor if you hover
					//	from left to right of the input box ; you have to go from right to left until you reach the
					//	right edge. 
					//	The preventDefault() and stopImmediatePropagation() methods did not help either.
                                        $jsinput. mouseover 
                                           (
                                                function ( e )
                                                   {
                                                        // If we are within the selection rectangle...
                                                        if  ( __within ( __getsquare ( ), e. pageX, e. pageY ) )
                                                           {
                                                                // Save original cursor appearance.
                                                                if  ( $initial_cursor  ===  undefined )
                                                                        $initial_cursor         =  $jsinput. css ( 'cursor' ) ;
                                                                   
                                                                // Provide a resizing cursor
                                                                $jsinput. css ( 'cursor', 'e-resize' ) ;
                                                            }
                                                        // ... otherwise restore the original cursor
                                                        else
                                                                $jsinput. css ( 'cursor', $initial_cursor ) ;
                                                    }
                                            ) ;
                                           
                                        
                                        // mousedown event -
                                        //      If we're within the resizing rectangle, then it's time to let the document object
                                        //      track mouse events.
                                        $jsinput. mousedown
                                           (
                                                function ( e )
                                                   {
                                                        if  ( __within ( __getsquare ( ), e. pageX, e. pageY ) )
                                                           {
                                                                e. preventDefault ( ) ;
                                                                   
                                                                // Create the resizer <div> that will appear on top of the whole document area.
								// This <div> will catch the following events :
								// - mouseup, for stopping the resizing process and destroying the <div>
								// - mousemove, for handling the resizing of the console input
                                                                $(document.body). append ( "<div id='" + ResizerDivId + "'></div>" ) ;
                                                                
                                                                $resizer_div    =  $('#' + ResizerDivId ) ;
                                                                
								// Style the resizer div :
                                                                $resizer_div
                                                                        .css ( 'cursor', 'e-resize' ) 				// e-resize cursor
                                                                        .css ( 'background-color', 'transparent' ) 		// transparent background (would you imagine anything else ?)
                                                                        .css ( 'z-index', 0x7FFFFFFF )				// Make sure we are "topmost"
                                                                        .css ( 'top', '0px' )					// Absolute position starting at (0,0)
                                                                        .css ( 'left', '0px' )
                                                                        .css ( 'position', 'absolute' )
                                                                        .width ( $(document. body). width ( ) )			// And height/width equal to the document body
                                                                        .height ( $(document. body). height ( ) ) ;
                                                                   
								// Signal that the resizing process has been started
                                                                $jsinput_resizing_started       =  true ;
								   
								// Then listen to mousemove events until we encounter a mouseup
                                                                document. body. addEventListener ( 'mouseup'  , __mouseup   ) ;
                                                                document. body. addEventListener ( 'mousemove', __mousemove ) ;
                                                            }
                                                    }
                                            ) ;
                                           
                                        
                                        //  mouseup event handler -
                                        //      Stop the resizing process, destroy event listeners and their associated <div>.
                                        function  __mouseup ( e ) 
                                           {
                                                if  ( $jsinput_resizing_started )
                                                   {
							// Stop resizing 
                                                        $jsinput_resizing_started       =  false ;
							   
							// Restore console input initial cursor
                                                        $jsinput. css ( 'cursor', $initial_cursor ) ;
							   
							// Remember last known console input width
							PreferencesManager. set ( 'console-input-width', $jsinput. width ( ) ) ;
							   
							// Destroy the <div> that caught mouse events, along with it's mouse event listeners
                                                        document. body. removeEventListener ( 'mouseup', __mouseup ) ;
                                                        document. body. removeEventListener ( 'mousemove', __mousemove ) ;
                                                        $resizer_div. remove ( ) ;
                                                    }
                                            }
                                        
                                        
                                        // mousemove event handler -
                                        //      Adjust the size of the input box according to current mouse position.
                                        function __mousemove ( e )
                                           {
                                                var     square  =  __getsquare ( ) ;

                                                if  ( $jsinput_resizing_started )
                                                   {
                                                        if  (  e. pageX  <  $__max_left )
                                                           {
                                                                $jsinput. width ( e. pageX - $__jsinput_left ) ;
                                                                $resizer_div. css ( 'cursor', 'e-resize' ) ;
                                                            }
                                                    }
                                            }
                                        // End of input box autoresizing
				    }
			    ) ;
		     }

		// Exports
		exports. log 		=  EmbeddedConsole. log ;
		exports. info 		=  EmbeddedConsole. info ;
		exports. debug 		=  EmbeddedConsole. debug ;
		exports. error 		=  EmbeddedConsole. error ;
		exports. clear 		=  EmbeddedConsole. clear ;
		exports. dir 		=  EmbeddedConsole. dir ;
		exports. execute 	=  EmbeddedConsole. execute ;
	   }
    ) ;
