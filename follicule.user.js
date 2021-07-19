// ==UserScript==
// @name         Follicule: Streamlined AO3 Search Filtering
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds button elements to author names and tags on AO3 search results to allow easy filtering.
// @author       lyrisey
// @match        *://*.archiveofourown.org/tags*works*
// @match        *://*.archiveofourown.org/works*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==


function createFolliculeButton(buttonText, buttonScript)
{
	var follButton;

	follButton = document.createElement("input");
	follButton.setAttribute("type","button");
	follButton.setAttribute("value",buttonText);
	follButton.setAttribute("onclick", buttonScript)

	//TODO: set up button css in a stylesheet because this is apparently bad practice
	follButton.setAttribute("style","width: 2.25ch; height:1.5em;");
	//maybe see about the alignment too?

	return follButton;
}

function createFollicule(element, includeScript, excludeScript)
{
	//given a ao3 element of the appropriate type(tag/username), create a 'follicule' - a 'lil dingus after that link with interfaces streamlining filtering 'n stuff (+/-)



	// `element` is the element you want to wrap
	var parent = element.parentNode;
	var follWrapper = document.createElement('span');
	follWrapper.setAttribute("class","follicule wrapper");
	//set the wrap for each span so the element and the button set are together
	follWrapper.setAttribute("style", `white-space: pre;`);

	// set the wrapper as child (instead of the element)
	parent.replaceChild(follWrapper, element);
	// set element as child of wrapper
	follWrapper.appendChild(element);

	//set up a secondary span for the buttons themselves to sit in next to the element
	var folliculeSpan = document.createElement('span');
	folliculeSpan.setAttribute("class","follicule buttons");
	follWrapper.appendChild(folliculeSpan);


	//and start stuffing elements into that span
	//spacer
		folliculeSpan.appendChild(document.createTextNode(" "));

	//+ stuff
	var plus = createFolliculeButton("+",includeScript);
	folliculeSpan.appendChild(plus);

	//- stuff
	var minus = createFolliculeButton("-",excludeScript);
	folliculeSpan.appendChild(minus);


}

function createAuthorFollicule(authorElement)
{
	//TODO: pull scripting into proper functions rather than JS in the element

	var authorname = authorElement.text;



	//wrap in escaped quotes - authors can have spaces in their names and we want to catch that.
	authorname = `\\"` + authorname + `\\"`;

	var QueryText = `creators:`+authorname;

	var scriptText = `document.getElementById("work_search_query").value= document.getElementById("work_search_query").value+`;

	var includeScript = scriptText + `" ` + QueryText+ `";`;

	var excludeScript = scriptText + `" ` + "-" + QueryText+ `";`;

	var scriptClick ="";
	scriptClick = `document.getElementById("work-filters").getElementsByClassName("submit actions")[0].children[0].click();`

	includeScript += scriptClick;
	excludeScript += scriptClick;

	createFollicule(authorElement, includeScript, excludeScript);

}

function createTagFollicule(tagElement)
{
	//TODO: pull scripting into proper functions rather than JS in the element

	var tagname = tagElement.text;

	//wrap in escaped quotes
	tagname = `\\"` + tagname + `\\"`;

	var includeScript = `document.getElementById("work_search_other_tag_names_autocomplete").value=` + `"` + tagname+ `";`;

	var excludeScript = `document.getElementById("work_search_excluded_tag_names_autocomplete").value=` + `"` + tagname+ `";`;

	var scriptClick ="";
	scriptClick = `document.getElementById("work-filters").getElementsByClassName("submit actions")[0].children[0].click();`

	includeScript += scriptClick;
	excludeScript += scriptClick;

	createFollicule(tagElement, includeScript, excludeScript);

}



/**************************************/

function main()
{
	//check to make sure we're on a page with the UI elements we need to actually do filtering
	if (document.getElementById("work-filters")!= null)
	{

	//TODO: set up class sheets for follicule elements
	//todo: do I need to explicitly inject scripting into the page for button clicks?

	/* Start by looking in the DOM for the "work index group" class - this is the list of works on the page*/

	const workListing = document.getElementsByClassName("work index group")[0];

	//follicules for tags
	for (let tag of workListing.getElementsByClassName("tag"))
	{
		createTagFollicule(tag);
	}

	//follicules for users
	for (let workLink of workListing.getElementsByTagName("a"))
	{
		//check links - attribute 'rel', value 'author'
		if (workLink.getAttribute("rel")=="author")
        {
			createAuthorFollicule(workLink);
        }
	}
	}
}





(function() {
    'use strict';

    main();
})();