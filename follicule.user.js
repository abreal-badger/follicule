// ==UserScript==
// @name         Follicule: Streamlined AO3 Search Filtering
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds button elements to author names and tags on AO3 search results to allow easy filtering.
// @author       lyrisey
// @match        *://*.archiveofourown.org/tags/**/works*
// @match        *://*.archiveofourown.org/works*
// @match        *://*.archiveofourown.org/users/**/works*
// @match        *://*.archiveofourown.org/collections/**/works*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==


function createFolliculeButton(buttonText, buttonScript)
{
	let follButton = document.createElement("input");
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
    /* For a given element, create a 'follicule': a UI component
    with functionality related to the content and context of that element.
    */

    //Wrap the element in a span that will contain both the element and the follicule
	const parentElement = element.parentNode;
	let folliculeWrapper = document.createElement('span');
	folliculeWrapper.setAttribute("class","follicule wrapper");
	//set the wrap for each span so the element and the button set are together
	folliculeWrapper.setAttribute("style", `white-space: pre;`);

	// set the wrapper as child (instead of the element)
	parentElement.replaceChild(folliculeWrapper, element);
	// set element as child of wrapper
	folliculeWrapper.appendChild(element);

	//set up a secondary span for the buttons themselves to sit in next to the element
	let folliculeSpan = document.createElement('span');
	folliculeSpan.setAttribute("class","follicule buttons");
	folliculeWrapper.appendChild(folliculeSpan);


	//and start stuffing elements into that span
	//spacer
	folliculeSpan.appendChild(document.createTextNode(" "));

	//+ stuff
	let plus = createFolliculeButton("+",includeScript);
	folliculeSpan.appendChild(plus);

	//- stuff
	let minus = createFolliculeButton("-",excludeScript);
	folliculeSpan.appendChild(minus);


}

function createAuthorFollicule(authorElement)
{
	let authorname = authorElement.text;

	//wrap in escaped quotes - authors can have spaces in their names and we want to catch that.
	authorname = `\\"` + authorname + `\\"`;

	let QueryText = `creators:`+authorname;

	let scriptText = `document.getElementById("work_search_query").value= document.getElementById("work_search_query").value+`;

	let includeScript = scriptText + `" ` + QueryText+ `";`;

	let excludeScript = scriptText + `" ` + "-" + QueryText+ `";`;

	let scriptClick = `document.getElementById("work-filters").getElementsByClassName("submit actions")[0].children[0].click();`

	includeScript += scriptClick;
	excludeScript += scriptClick;

	createFollicule(authorElement, includeScript, excludeScript);

}

function createTagFollicule(tagElement)
{

	let tagname = tagElement.text;

	let includeScript = `document.getElementById("work_search_other_tag_names_autocomplete").value=` + `"` + tagname+ `";`;

	let excludeScript = `document.getElementById("work_search_excluded_tag_names_autocomplete").value=` + `"` + tagname+ `";`;

	let scriptClick ="";
	scriptClick = `document.getElementById("work-filters").getElementsByClassName("submit actions")[0].children[0].click();`

	includeScript += scriptClick;
	excludeScript += scriptClick;

	createFollicule(tagElement, includeScript, excludeScript);

}

function processWorkTags(workListing)
{
    /* Follicules for tags (fandom, relationship, character, freeform) */
    for (let tag of workListing.getElementsByClassName("tag"))
    {
        createTagFollicule(tag);
    }
}

function processWorkAuthors(workListing)
{
    //follicules for authors
    for (let workLink of workListing.getElementsByTagName("a"))
    {
        //check links - attribute 'rel', value 'author'
        if (workLink.getAttribute("rel")=="author")
        {
            createAuthorFollicule(workLink);
        }
    }
}

function main()
{
	/* Check to make sure we're on a page with the UI elements we need to actually do filtering. */
	if (document.getElementById("work-filters")!= null)
	{
        /* Start by looking in the DOM for the "work index group" class - this is the list of works on the page*/
        let workListing = document.getElementsByClassName("work index group")[0];

        processWorkTags(workListing);
        processWorkAuthors(workListing);
	}
}





(function() {
    'use strict';

    main();
})();
