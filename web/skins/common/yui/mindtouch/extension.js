/*
 * ExtenstionDialog
 * -- ExtensionList
 * -- ExtensionEditor
 * ----- MultiBox (toggles between input & textarea)
 *
 */
YAHOO.namespace("YAHOO.mindtouch");
YAHOO.namespace("YAHOO.mindtouch.widget");

YAHOO.mindtouch.ExtensionDialog = function(oConfig)
{
	// create a shortcut for dom functions
	this.Dom = YAHOO.util.Dom;
	this.Event = YAHOO.util.Event;

	this.elExtensions = this.Dom.get(oConfig.extensionList);
	this.oList = new YAHOO.mindtouch.ExtensionList(oConfig.extensionList, oConfig.libraryDiv, oConfig.functionDiv);
	this.oEditor = new YAHOO.mindtouch.ExtensionEditor(oConfig.editorDiv);

	// stores the parent element of the incoming selection if it is a pre element
	this.elScriptParent = null;
	
	// Setup Dom events
	var oSelf = this;
	// register the Dom event for this the insert button
	//YAHOO.util.Event.addListener(this.elInsertButton, 'click', oSelf._onClickInsertButton, oSelf);

	// Setup Custom events
	this.oList.clickFunctionEvent.subscribe(this._onClickFunction, oSelf);
};


/**
 * Sets the dialog state when loading a function
 */
YAHOO.mindtouch.ExtensionDialog.prototype.init = function(oParams)
{
	if (YAHOO.lang.isObject(oParams))
	{
		this.oPopup = oParams.oPopup;

		this.setInsertButtonStatus(false);

		var oResult = null;

		// TODO: check if we are dealing with a pre element?
		if (
			YAHOO.lang.isObject(oParams.elParent) &&
			(oParams.elParent.tagName == 'PRE') &&
			(YAHOO.lang.isValue(oParams.elParent.getAttribute('function')))
		   )
		{
			this.elScriptParent = oParams.elParent;

			oResult = new Object();
			oResult.sFunctionName = oParams.elParent.getAttribute("function");
			oResult.aValues = new Array();
			// save the first params value
			oResult.aValues[0] = oParams.sSelection
		}
		else
		{
			oResult = this._parseDekiScript(oParams.sSelection);
		}

		// if an object is returned then the script was parsed
		if (YAHOO.lang.isObject(oResult))
		{
			var oDetails = this.getFunctionDetailsByName(oResult.sFunctionName);

			// add the parse result param values to the function details
			for (var i = 0; i < oDetails.aParams.length; i++)
			{
				var sParamName = oDetails.aParams[i][0];

				if (YAHOO.lang.isValue(oResult.aValues[sParamName]))
				{
					// set the param value
					oDetails.aParams[i][4] = oResult.aValues[sParamName];
				}
				else if ((i == 0) && YAHOO.lang.isValue(oResult.aValues[i]))
				{
					oDetails.aParams[i][4] = oResult.aValues[i];
				}
			}

			// load the library with the function
			this.oList.init(oResult.sFunctionName);
			// load the editor with the params
			this.oEditor.loadFunction(oDetails.sName, oDetails.sDescription, oDetails.aParams, oDetails.bIsProperty);
			// enable the insert button
			this.setInsertButtonStatus(true);
		}
	}
};


/**
 * Attempts to parse the incoming string as deki script. If the string cannot be parsed
 * then display a textbox including the entire selection for editing.
 *
 * @return Object oResult.sFunctionName, .aValues
 */
YAHOO.mindtouch.ExtensionDialog.prototype._parseDekiScript = function(sScript)
{
	// attempt to parse the selection as a deki script
	// only parses deki script that is generated by this dialog
	var dekiScriptRegex = /\{\{\s*([a-zA-Z\.]*)\s*\{\s*((\s*[a-zA-Z0-9]*\s*:\s*"?[^,]*"?\s*,?\s*)*)\}\s*\}\}/g;
	/*
	// here is a more readable version of the regex
	\{\{
		\s*
		[a-zA-Z\.]*
		\{
			((
				\s*
				([a-ZA-Z0-9\.]*)
				\s*:\s*
				"?([^"]*)"?
				\s*,?
				\s*
			)*)
		\}
		\s*
	\}\}
	*/
	var scriptRegex = new RegExp(dekiScriptRegex);
	if (scriptRegex.test(sScript))
	{
		var oResult = new Object();

		scriptRegex = new RegExp(dekiScriptRegex);
		// for some reason sParamSelection is not a string
		//var sScript = new String(sParamSelection);
		var aMatches = scriptRegex.exec(sScript);		

		// load the parameters for the editor
		var aParams = aMatches[2].split(/,/);
		// array to store the parameter values in
		var aValues = new Array();

		for (var i = 0; i < aParams.length; i++)
		{
			var iPos = aParams[i].indexOf(':');
			var sName = YAHOO.lang.trim(aParams[i].substr(0, iPos));
			var sValue = YAHOO.lang.trim(aParams[i].substr(iPos+1));
			
			if (sValue.charAt(0) == '"')
			{
				// need to remove the outer quotes from the value
				sValue = sValue.substr(1, sValue.length-2);
			}

			// need to strip slashes from the value as well
			sValue = String(sValue).replace(/\\\"/g, '"');
			aValues[sName] = sValue;
		}
		// set the values
		oResult.aValues = aValues;

		// get the function name
		oResult.sFunctionName = aMatches[1];

		return oResult;
	}

	return null;
};


/**
 * Enables/disables the insert button
 */
YAHOO.mindtouch.ExtensionDialog.prototype.setInsertButtonStatus = function(bEnabled)
{
	if (bEnabled)
	{
		this.oPopup.enableButton(this.oPopup.BTN_OK);
	}
	else
	{
		this.oPopup.disableButton(this.oPopup.BTN_OK);
	}
};


/*
 * Fires when a function in the library is clicked
 */
YAHOO.mindtouch.ExtensionDialog.prototype._onClickFunction = function(sType, oArgs, oSelf)
{
	// load the function details into an array then output
	var oDetails = oSelf.getFunctionDetails(oArgs[0]);
	oSelf.oEditor.loadFunction(oDetails.sName, oDetails.sDescription, oDetails.aParams, oDetails.bIsProperty);

	oSelf.setInsertButtonStatus(true);
};


// Dom event fired when the insert button is clicked
YAHOO.mindtouch.ExtensionDialog.prototype._onClickInsertButton = function(e, oSelf)
{
	oSelf.validate(false);
};

// Dom event fired when the insert pre button is clicked
YAHOO.mindtouch.ExtensionDialog.prototype._onClickInsertPreButton = function(e, oSelf)
{
	oSelf.validate(true);
};

/**
 * @param String sFunctionClass the classname of the function to load, eg, flickr_badge, digg_this
 */
YAHOO.mindtouch.ExtensionDialog.prototype.getFunctionDetailsByName = function(sFunctionName)
{
	var sClassName = sFunctionName.replace('.', '_');
	var aFunctions = this.Dom.getElementsByClassName(sClassName, 'li', this.elExtensions);

	if (YAHOO.lang.isValue(aFunctions))
	{
		return this.getFunctionDetails(aFunctions[0]);
	}

	return null;
};

/**
 * @return Object with member variables:
 *			sName
 *			sDescription
 *			aParams
 */
YAHOO.mindtouch.ExtensionDialog.prototype.getFunctionDetails = function(sFunctionId)
{
	var oResult = null;
	var elListItem = this.Dom.get(sFunctionId);
	
	if (YAHOO.lang.isObject(elListItem))
	{
		oResult = new Object();

		var elAnchor = elListItem.getElementsByTagName('a')[0];
		oResult.sName = elAnchor.getAttribute('name');
		oResult.sDescription = elAnchor.getAttribute('title');
		// is this a property?		
		oResult.bIsProperty = elAnchor.getAttribute('property') == 'true' ? true : false;

		// grab the list of params
		var elList = elListItem.getElementsByTagName('ul')[0];

		// Generate an array for the parameters
		oResult.aParams = new Array();
		var aFuncItems = this.Dom.getChildren(elList);

		for (var i = 0; i < aFuncItems.length; i++)
		{
			oResult.aParams[i] = new Array();
			
			var aSpan = aFuncItems[i].getElementsByTagName('SPAN');
			for (var j = 0; j < aSpan.length; j++)
			{
				oResult.aParams[i][j] = aSpan[j].innerHTML;
			}

			//oResult.aParams[i][0] = elSpan.getAttribute('name');
			//oResult.aParams[i][1] = elSpan.getAttribute('type');
			//oResult.aParams[i][2] = elSpan.getAttribute('hint');
			//oResult.aParams[i][3] = elSpan.getAttribute('optional');
		}
	}

	return oResult;
};


YAHOO.mindtouch.ExtensionDialog.prototype.validate = function()
{
	// make sure all required parameters are supplied
	if (!this.oEditor.isComplete())
	{
		// TODO: localize
		var aRequired = this.oEditor.getMissingParams();
		alert("Sorry but you have left the following required parameter(s) blank.\n\n" + aRequired.join("\n"));

		return false;
	}
	
	return true;
};


YAHOO.mindtouch.ExtensionDialog.prototype.submit = function(bPre)
{
	var oDekiScript = this.oEditor.getDekiScript(bPre);
	var oParams = null;

	// return the deki script
	if (YAHOO.lang.isObject(oDekiScript))
	{
		var sDekiScript;

		// a pre script was used to enter the dialog, remove it
		if (YAHOO.lang.isObject(this.elScriptParent))
		{
			var elParent = this.elScriptParent.parentNode;
			elParent.removeChild(this.elScriptParent);
		}

		if (bPre)
		{			
			// add the pre tags
			sDekiScript = '<pre class="script" function="' + oDekiScript.sFunctionName + '">' + oDekiScript.sFirstParam + '</pre>';
		}
		else
		{
			// add the dekiscript brackets
			sDekiScript = '{{ ' + oDekiScript.sScript + ' }}';
		}

		// TODO: change return parameter
		oParams = {sDekiScript: sDekiScript};
	}

	return oParams;
};


/**
 * @param ListNode/String elExtensions Points to the list containing the extension data
 * @param DivNode/String elLibraries Points to a div which will be populated with the libraries
 * @param DivNode/String elFunctions Points to a div which will be populated with the functions
 */
YAHOO.mindtouch.ExtensionList = function(elExtensions, elLibraries, elFunctions)
{
	// create a shortcut for dom functions
	this.Dom = YAHOO.util.Dom;
	this.Event = YAHOO.util.Event;
	
	this.elExtensions = this.Dom.get(elExtensions);
	this.elLibraries = this.Dom.get(elLibraries);
	this.elFunctions = this.Dom.get(elFunctions);

	// store the last library & function elements that were clicked
	// these elements are list items
	this._elLastLibrary = null;
	this._sLibraryName = null;
	this._sLibraryDescription = null;

	this._elLastFunction = null;

	// Custom Events
	this.clickFunctionEvent = new YAHOO.util.CustomEvent("onClickFunction");

	this._showLibraries();
};


/**
 * Highlights the selected library and function when the dialog is loaded
 */
YAHOO.mindtouch.ExtensionList.prototype.init = function(sFunctionName)
{
	// function name comes in like namespace.function
	var aSplit = sFunctionName.split('.');
	var sNamespace = null;

	if (aSplit.length == 1)
	{
		// no namespace for the function, can't highlight? media?
	}
	else
	{
		// function has a namespace
		var sNamespaceClass = aSplit[0];
		var sFunctionClass = sFunctionName.replace('.', '_');
		var elLibrary;
		
		elLibrary = this.Dom.getElementsByClassName(sNamespaceClass, 'li', this.elExtensions)[0];
		this._showLibrary(elLibrary.id);
		
		elLibrary = this.Dom.getElementsByClassName(sNamespaceClass, 'li', this.elLibraries)[0];
		elFunction = this.Dom.getElementsByClassName(sFunctionClass, 'li', this.elFunctions)[0];
		this._highlightLibrary(elLibrary);
		this._highlightFunction(elFunction);

		// scroll to the selected library & function
		YAHOO.util.Event.onDOMReady(function(sEvent, oSelf, oList) {
			// scroll the library animation
			var nY = oList.Dom.getY(oList._elLastLibrary);
			var oParams = {
				scroll: { to: [0, nY] }
			};
			var libraryAnim = new YAHOO.util.Scroll(oList.elLibraries, oParams, .5, YAHOO.util.Easing.easeIn);
			// setup the function animation
			libraryAnim.onComplete.subscribe(function(sEvent, oSelf, oList) {
				// scroll the function into view
				var nY = oList.Dom.getY(oList._elLastFunction);
				var oParams = {
					scroll: { to: [0, nY] }
				};
				var functionAnim = new YAHOO.util.Scroll(oList.elFunctions, oParams, .5, YAHOO.util.Easing.easeIn);
				functionAnim.animate();
			}, oList);

			// show the animation
			libraryAnim.animate();
		}, this);
	}
};

YAHOO.mindtouch.ExtensionList.prototype._highlightLibrary = function(elLibrary)
{
	if (this._elLastLibrary != elLibrary)
	{
		// remove the highlight from the previous selection
		this.Dom.removeClass(this._elLastLibrary, 'selected');
	}

	if (!this.Dom.hasClass(elLibrary, 'selected'))
	{
		this.Dom.addClass(elLibrary, 'selected');
	}
	this._elLastLibrary = elLibrary;
};

YAHOO.mindtouch.ExtensionList.prototype._highlightFunction = function(elFunction)
{
	if (this._elLastFunction != elFunction)
	{
		// remove the highlight from the previous selection
		this.Dom.removeClass(this._elLastFunction, 'selected');
	}

	if (!this.Dom.hasClass(elFunction, 'selected'))
	{
		this.Dom.addClass(elFunction, 'selected');
	}
	this._elLastFunction = elFunction;
};

/**
 * Loads the libraries into the div element
 */
YAHOO.mindtouch.ExtensionList.prototype._showLibraries = function()
{
	// Populate the list of libraries
	var oSelf = this;

	// create a new list node
	var elUl = document.createElement('ul');

	var elList = this.elExtensions.getElementsByTagName('ul')[0];
	var aItems = this.Dom.getChildren(elList);

	for (var i = 0; i < aItems.length; i++)
	{
		var sLibraryId = aItems[i].getAttribute('id'); // ListItem

		var elLibraryAnchor = aItems[i].getElementsByTagName('a')[0];
		var sLibraryName = elLibraryAnchor.getAttribute('name');
		var sLibraryTitle = elLibraryAnchor.getAttribute('title');
		var sLibraryNamespace = elLibraryAnchor.getAttribute('namespace');
		var sLibraryLogo = elLibraryAnchor.getAttribute('logo');

		var elItem = document.createElement('li');
		this.Dom.addClass(elItem, sLibraryNamespace); // used to highlight a library
		elItem.setAttribute('libraryId', sLibraryId);
		var elAnchor = document.createElement('a');
		elAnchor.setAttribute('href', '#');
		elAnchor.setAttribute('name', sLibraryName);
		elAnchor.setAttribute('title', sLibraryTitle);
		var elTextNode = document.createTextNode(sLibraryName);
		var elSpan = document.createElement('span');
		// attach the library's logo if it has one
		if (String(sLibraryLogo).length > 0)
		{
			elSpan.style.backgroundImage = 'url('+ sLibraryLogo +')';
		}

		// add the elements
		elAnchor.appendChild(elSpan);
		elAnchor.appendChild(elTextNode);
		elItem.appendChild(elAnchor);
		elUl.appendChild(elItem);

		// register the Dom event for this item
		oSelf.Event.addListener(elAnchor, 'click', oSelf._onClickLibrary, oSelf, true);
	}

	// attach the new list to the libraries node
	this.elLibraries.innerHTML = ''; // clear the old list
	this.elLibraries.appendChild(elUl);
};


/**
 * Loads a library from a dom node
 *
 * @param String sLibraryId element id corresponding to the library to load
*/
YAHOO.mindtouch.ExtensionList.prototype._showLibrary = function(sLibraryId)
{
	// grabs the data list item for this library
	var elListItem = this.Dom.get(sLibraryId);
	
	if (!YAHOO.lang.isObject(elListItem))
	{
		return false;
	}

	var elAnchor = elListItem.getElementsByTagName('a')[0];
	
	// create the header elements
	var elTextNode = null;
	var elHeader = document.createElement('span');
	
	var sLibraryName = elAnchor.getAttribute("title");
	var elH1 = document.createElement('h1');
	elTextNode = document.createTextNode(sLibraryName);
	elH1.appendChild(elTextNode);

	var sLibraryDescription = elAnchor.getAttribute("desc");
	var elH2 = document.createElement('h2');
	elTextNode = document.createTextNode(sLibraryDescription);
	elH2.appendChild(elTextNode);

	elHeader.appendChild(elH1);
	elHeader.appendChild(elH2);
	
	var sCustomDescription = elAnchor.getAttribute("customDescription");
	if (sCustomDescription)
	{
		var elH2Custom = document.createElement('h2');
		elTextNode = document.createTextNode(sCustomDescription);
		elH2Custom.appendChild(elTextNode);
		elHeader.appendChild(elH2Custom);
	}
	

	// grab the list of functions
	var elList = elListItem.getElementsByTagName('ul')[0];

	// Populate the list of functions
	var oSelf = this;
	var aItems = this.Dom.getElementsByClassName('function', 'li', elList);

	var elUl = document.createElement('ul');
	for (var i = 0; i < aItems.length; i++)
	{
		var sFunctionId = aItems[i].getAttribute('id'); // get the function's id

		var elFunctionAnchor = aItems[i].getElementsByTagName('a')[0];
		var sFunctionName = elFunctionAnchor.getAttribute('name');
		var sFunctionDescription = elFunctionAnchor.getAttribute('title');

		var elItem = document.createElement('li');
		elItem.setAttribute('functionId', sFunctionId);
		var sClassName = sFunctionName.replace('.', '_');
		this.Dom.addClass(elItem, sClassName); // used to select on load
		var elAnchor = document.createElement('a');
		elAnchor.setAttribute('href', '#');
		elAnchor.setAttribute('name', sFunctionName);
		elAnchor.setAttribute('title', sFunctionDescription);
		elAnchor.setAttribute('property', elFunctionAnchor.getAttribute('property') == 'true' ? true : false);

		var elSpan = null;
		elSpan = document.createElement('span');
		elSpan.setAttribute('class', 'name');
		elTextNode = document.createTextNode(sFunctionName);
		elSpan.appendChild(elTextNode);
		elAnchor.appendChild(elSpan);

		elSpan = document.createElement('span');
		elSpan.setAttribute('class', 'description');
		elTextNode = document.createTextNode(sFunctionDescription);
		elSpan.appendChild(elTextNode);
		elAnchor.appendChild(elSpan);

		// add the elements
		elItem.appendChild(elAnchor);
		elUl.appendChild(elItem);

		// register the Dom event for this item
		oSelf.Event.addListener(elAnchor, 'click', oSelf._onClickFunction, oSelf);
	}

	// attach the new list to the functions node
	this.elFunctions.innerHTML = ''; // clear out the old list
	// add the header
	this.elFunctions.appendChild(elHeader);
	// add the list
	this.elFunctions.appendChild(elUl);

	return true;
};

/*
 * Dom Events
 */
// Dom event fired when a library link is clicked
YAHOO.mindtouch.ExtensionList.prototype._onClickLibrary = function(e, oSelf)
{
	var elElement = oSelf.Event.getTarget(e); // a?
	if (elElement.tagName == 'SPAN')
	{
		elElement = elElement.parentNode; // a!
	}
	var elListItem = elElement.parentNode; // li

	// make sure we don't load the same library twice
	if (oSelf._elLastLibrary == elListItem)
	{
		return true;
	}
	oSelf._highlightLibrary(elListItem);

	var sLibraryId = elListItem.getAttribute('libraryId');
	oSelf._showLibrary(sLibraryId);

	YAHOO.util.Event.stopEvent(e);
};

// Dom event fired when a function link is clicked
YAHOO.mindtouch.ExtensionList.prototype._onClickFunction = function(e, oSelf)
{
	var elElement = oSelf.Event.getTarget(e); // a?
	if (elElement.tagName == 'SPAN')
	{
		elElement = elElement.parentNode; // a!
	}
	var elListItem = elElement.parentNode; // li
	
	// make sure we don't load the same function twice
	if (oSelf._elLastFunction == elListItem)
	{
		return;
	}
	oSelf._highlightFunction(elListItem);
	
	var sFunctionId = elListItem.getAttribute('functionId');
	oSelf.clickFunctionEvent.fire(sFunctionId);

	YAHOO.util.Event.stopEvent(e);
};



/**
 * Object to generate the deki script
 */
YAHOO.mindtouch.ExtensionEditor = function(elContainer)
{
	this._elContainer = YAHOO.util.Dom.get(elContainer);
	this._sFunctionName = null;
	this._bIsProperty = false;
	this._aParams = new Array();
};

// creates parameter fields for the function params
YAHOO.mindtouch.ExtensionEditor.prototype.loadFunction = function(sName, sDescription, aParams, bIsProperty)
{
	// clear the current contents
	this._elContainer.innerHTML = '';

	// add the headings
	var elSpan = document.createElement('span');
	var elHeading1 = document.createElement('h1');
	elHeading1.innerHTML = sName;
	var elHeading2 = document.createElement('h2');
	elHeading2.innerHTML = sDescription;
	elSpan.appendChild(elHeading1);
	elSpan.appendChild(elHeading2);
	this._elContainer.appendChild(elSpan);


	// clear the params array
	this._aParams = new Array();
	// set the new function name
	this._sFunctionName = sName;
	// set the property status
	this._bIsProperty = bIsProperty || false;
	var bHasRequired = false;

	for (var i = 0; i < aParams.length; i++)
	{
		var bRequired = (aParams[i][3] == 'true') ? false : true; // aParams[3] is sOptional?
		var sLabel =  (bRequired) ? aParams[i][0]+'*' : aParams[i][0];
		bHasRequired |= bRequired;

		var oMultiBox = new YAHOO.mindtouch.widget.MultiBox(aParams[i][0],	// name
															sLabel,			// label
															aParams[i][2],  // hint
															bRequired,		// required?
															false);			// dont allow multi line
		this._elContainer.appendChild(oMultiBox.elRoot);

		if (YAHOO.lang.isValue(aParams[i][4]))
		{
			oMultiBox.setValue(aParams[i][4]);
		}
		
		this._aParams.push(oMultiBox);
	}
	
	if (bHasRequired)
	{
		// attach the field required message
		var elMessage = document.createElement('div');
		elMessage.innerHTML = '<em>* Required field</em>';
		this._elContainer.appendChild(elMessage);
	}
};

YAHOO.mindtouch.ExtensionEditor.prototype.isComplete = function()
{
	for (var i = 0; i < this._aParams.length; i++)
	{
		if (!this._aParams[i].isComplete())
		{
			// a required parameter is missing
			return false;
		}
	}

	return true;
};


YAHOO.mindtouch.ExtensionEditor.prototype.getMissingParams = function()
{
	var aMissing = new Array();

	for (var i = 0; i < this._aParams.length; i++)
	{
		if (!this._aParams[i].isComplete())
		{
			// a required parameter is missing
			aMissing.push(this._aParams[i].getName());
		}
	}

	return aMissing;
};


/**
 * Generates the DekiScript
 *
 * @return Object with variables, .sScript, .sFirstParam, .sFunctionName
 */
YAHOO.mindtouch.ExtensionEditor.prototype.getDekiScript = function(bPre)
{
	if (!this._sFunctionName)
	{
		return '';
	}

	var aScript = new Array();
	var oScript = new Object();

	oScript.sFunctionName = this._sFunctionName;
	oScript.sFirstParam = '';
	oScript.sScript = '';

	// start generating the script
	aScript.push(this._sFunctionName);
	if (!this._bIsProperty)
	{
		aScript.push('{');
		
		for (var i = 0, bFirst = true; i < this._aParams.length; i++)
		{
			var sName = this._aParams[i].getName();
			var sValue = this._aParams[i].getValue();
	
			// only add the value if the param is not empty
			if (sValue != '')
			{
				if (!bFirst)
				{
					aScript.push(', ');
				}
	
				aScript.push(this._aParams[i].getName() + ': ');
				
				// check if the value is a script expression, ie, starts with =
				if (sValue.charAt(0) == '=')
				{
					// dekiscript, dont enclose in quotes
					aScript.push(YAHOO.lang.trim(sValue.substring(1)));
					if (bFirst)
					{
						oScript.sFirstParam = YAHOO.lang.trim(sValue.substring(1));
					}
				}
				else
				{
					// escape double quotes unless preing
					if (!bPre)
					{
						sValue = String(sValue).replace(/\"/g, '\\"');
					}
					// add quotes
					aScript.push('"' + sValue + '"');
					if (bFirst)
					{
						oScript.sFirstParam = sValue;
					}
				}
				
	
				if (bFirst)
				{
					bFirst = false;
				}
			}
		}
	
		aScript.push('}');
	}
	oScript.sScript = aScript.join('');
	
	return oScript;
};



/**
 * Single/Multi line text box
 *
 * @param String sName The name for the input field
 * @param optional String sLabel Text to be displayed above the field
 * @param optional String sSubCaption Text to be displayed below the field, useful for hints
 * @param optional Boolean bRequired Determines if the field is required
 * @param optional Boolean bAllowToggle Determines if the field can be toggled between single/multi line
 */
YAHOO.mindtouch.widget.MultiBox = function(sName, sLabel, sSubCaption, bRequired, bAllowToggle)
{
	this.elRoot = null;
	this._sName = sName;
	this._elHidden = null;
	this._elTextBox = null;
	this._elTextArea = null;

	this._bTextBoxVisible = false;
	this._bRequired = YAHOO.lang.isValue(bRequired) ? bRequired : false;
	this._bAllowToggle = YAHOO.lang.isValue(bAllowToggle) ? bAllowToggle : true;

	// create the multibox
	this.elRoot = document.createElement('ul');
	YAHOO.util.Dom.addClass(this._elList, 'multibox');

	if (sLabel)
	{
		this._sCaption = sLabel;

		elCaption = document.createElement('li');
		YAHOO.util.Dom.addClass(elCaption, 'label');
		elCaption.innerHTML = sLabel;
		this.elRoot.appendChild(elCaption);
	}

	elInput = document.createElement('li');
	YAHOO.util.Dom.addClass(elInput, 'input');

	this._elHidden = document.createElement('hidden');
	this._elHidden.setAttribute('name', this._sName);
	this._elHidden.value = '';

	this._elTextBox = document.createElement('input');
	this._elTextBox.setAttribute('name', this._sName + '_box');
	// create an id for the textbox to attach AC
	this._elTextBox.setAttribute('id', YAHOO.util.Dom.generateId());
	
	this._elTextArea = document.createElement('textarea');
	this._elTextArea.setAttribute('name', this._sName + '_area');

	if (this._bRequired)
	{
		// add required styles
		YAHOO.util.Dom.addClass(elInput, 'required');
		YAHOO.util.Dom.addClass(this._elTextBox, 'required');
		YAHOO.util.Dom.addClass(this._elTextArea, 'required');
	}

	elInput.appendChild(this._elTextBox);
	elInput.appendChild(this._elTextArea);

	if (this._bAllowToggle)
	{
		this._elToggler = document.createElement('span');
		YAHOO.util.Dom.addClass(this._elToggler, 'toggle');
		// add the toggler's event
		var oSelf = this;
		YAHOO.util.Event.addListener(this._elToggler, 'click', oSelf._onClickToggleField, oSelf);

		elInput.appendChild(this._elToggler);
	}

	this.elRoot.appendChild(elInput);
	
	if (sSubCaption)
	{
		elSubCaption = document.createElement('li');
		YAHOO.util.Dom.addClass(elSubCaption, 'sublabel');
		elSubCaption.innerHTML = sSubCaption ? sSubCaption : '';
		this.elRoot.appendChild(elSubCaption);
	}
	this._addAutoComplete();
	this._showTextBox();
};

// this global object shouldn't be here, fix?
var Deki = Deki || {};
Deki.ExtensionDialog = {};
Deki.ExtensionDialog._oDataSource = null;

YAHOO.mindtouch.widget.MultiBox.prototype._oAutoComplete = null;
YAHOO.mindtouch.widget.MultiBox.prototype._addAutoComplete = function()
{
	// create the datasource if it does not exist
	if (!Deki.ExtensionDialog._oDataSource)
	{
		var oDs = new YAHOO.util.XHRDataSource('/deki/gui/extensions.php');
		oDs.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
		oDs.responseSchema = {
			resultsList : 'results'
		};
		Deki.ExtensionDialog._oDataSource = oDs;
	}

	// create a div for the autocomplete
	var elAc = document.createElement('div');
	var sAcContainerId = YAHOO.util.Dom.generateId();
	elAc.id = sAcContainerId;
	this._elTextBox.parentNode.appendChild(elAc);
	
	// create the autocomplete for this field
	YAHOO.util.Event.onAvailable(this._elTextBox.id, function()
	{
		var oAc = new YAHOO.widget.AutoComplete(this._elTextBox, sAcContainerId, Deki.ExtensionDialog._oDataSource);
		// configure the autocomplete
		oAc.queryDelay = .5;
		oAc.animVert = false;
		oAc.generateRequest = function(sQuery) {
			// strip encoded =
			return '?action=ac&query=' + String(sQuery).substring(3);
		};
		// only show AC when "=" is the first char
		oAc.textboxKeyEvent.subscribe(function()
		{		
			if (String(this._elTextBox.value).charAt(0) == '=')
			{
				oAc.minQueryLength = 2;
			}
			else
			{
				oAc.minQueryLength = 100;
			}
		}, this, true);
		oAc.itemSelectEvent.subscribe(function()
		{
			this._elTextBox.value = '=' + this._elTextBox.value;
		}, this, true);

		this._oAutoComplete = oAc;
	}, this, true);
};

YAHOO.mindtouch.widget.MultiBox.prototype._showTextBox = function()
{
	if (!this._bTextBoxVisible)
	{
		// update the contents
		this._elTextBox.value = String(this._elTextArea.value).replace(/\n/g, "\\n");

		this._elTextBox.style.display = 'inline';
		this._elTextArea.style.display = 'none';
		if (this._bAllowToggle)
		{
			this._elToggler.innerHTML = '(+)';
		}
		this._bTextBoxVisible = true;
	}
};

YAHOO.mindtouch.widget.MultiBox.prototype._showTextArea = function()
{
	if (this._bTextBoxVisible)
	{
		// update the contents
		this._elTextArea.value = String(this._elTextBox.value).replace(/\\n/g, "\n");

		this._elTextBox.style.display = 'none';
		this._elTextArea.style.display = 'inline';
		if (this._bAllowToggle)
		{
			this._elToggler.innerHTML = '(-)';
		}
		this._bTextBoxVisible = false;
	}
};

/**
 * Fires when the toggle field link is clicked for a parameter
 */
YAHOO.mindtouch.widget.MultiBox.prototype._onClickToggleField = function(e, oSelf)
{
	var elAnchor = YAHOO.util.Event.getTarget(e); // span
	if (YAHOO.util.Dom.hasClass(elAnchor, 'disabled'))
	{
		return;
	}

	if (oSelf._bTextBoxVisible)
	{
		oSelf._showTextArea();
	}
	else
	{
		oSelf._showTextBox();
	}
};

YAHOO.mindtouch.widget.MultiBox.prototype.getName = function()
{
	return this._sName;
};

YAHOO.mindtouch.widget.MultiBox.prototype.setValue = function(sValue)
{
	if (this._bTextBoxVisible)
	{
		if (sValue.indexOf("\n") > 0)
		{
			this._showTextArea();
			this.setValue(sValue);
		}
		else
		{
			this._elTextBox.value = sValue;
		}
	}
	else
	{
		this._elTextArea.value = sValue;
	}
	
	this._elHidden.value = sValue;
};

YAHOO.mindtouch.widget.MultiBox.prototype.getValue = function()
{
	if (this._bTextBoxVisible)
	{
		this._elHidden.value = this._elTextBox.value;
	}
	else
	{
		this._elHidden.value = this._elTextArea.value;
	}

	return this._elHidden.value;
};

YAHOO.mindtouch.widget.MultiBox.prototype.isComplete = function()
{
	if (this._bRequired == true)
	{
		return (this.getValue() != '');	
	}
	else
	{
		return true;
	}
};
