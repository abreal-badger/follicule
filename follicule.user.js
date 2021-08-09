// ==UserScript==
// @name         Follicule: Streamlined AO3 Search Filtering
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Adds button elements to author names and tags on AO3 search results to allow easy filtering.
// @author       lyrisey
// @match        *://*.archiveofourown.org/tags/**/works*
// @match        *://*.archiveofourown.org/works*
// @match        *://*.archiveofourown.org/users/**/works*
// @match        *://*.archiveofourown.org/users/**/bookmarks*
// @match        *://*.archiveofourown.org/bookmarks*
// @match        *://*.archiveofourown.org/collections/**/works*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==



class follSpanStyle {
    static useButtonTitleTooltips = false;

    static useBackgroundHighlight = true;
    static useBorder = true;

    static backgroundHighlightOn = "background: rgba(89, 152, 214, 0.5);";
    static backgroundHighlightOff = "background: rgba(89, 152, 214, 0.0);";

    static borderOn = " border-style: dashed; border-width: 0px 0px thick 0px;";
    static borderOff = " border-style: hidden; border-width: 0px 0px thick 0px;";

    static generateStyle(isEntering)
    {
        let styleOutput = "";
        if (isEntering == true)
        {
            if (this.useBackgroundHighlight == true)
            {
                styleOutput += this.backgroundHighlightOn;
            }
            if (this.useBorder == true)
            {
                styleOutput += this.borderOn;
            }
        }
        else
        {
            if (this.useBackgroundHighlight == true)
            {
                styleOutput += this.backgroundHighlightOff;
            }
            if (this.useBorder == true)
            {
                styleOutput += this.borderOff;
            }
        }
        return (styleOutput)
    }
}

class workPage {
    static filterID = "work-filters";
    static workListingName = "work index group"
    static queryID = "work_search_query";
    static tagIncludeQueryID = "work_search_other_tag_names_autocomplete";
    static tagExcludeQueryID = "work_search_excluded_tag_names_autocomplete";
}

class bookmarkPage {
    static filterID = "bookmark-filters";
    static workListingName = "bookmark index group";
    static queryID = "bookmark_search_bookmarkable_query";
    static tagIncludeQueryID = "bookmark_search_other_tag_names_autocomplete";
    static tagExcludeQueryID = "bookmark_search_excluded_tag_names_autocomplete"

    static bmarkTagIncludeQueryID = "bookmark_search_other_bookmark_tag_names_autocomplete";
    static bmarkTagExcludeQueryID = "bookmark_search_excluded_bookmark_tag_names_autocomplete";
}

class scriptBuilder{

    static addTag (queryID, tag)
    {
        return (`document.getElementById("` + queryID + `").value=` + `"` + tag+ `";`);
    }

    static addAuthor (queryID, authorname, isExclude)
    {
        let QueryText = `creators:`+authorname;
        let scriptText = `document.getElementById("` + queryID + `").value= document.getElementById("` + queryID + `").value+`;

        if (isExclude == false)
        {
            scriptText += `" ` + QueryText+ `";`;
        }
        else
        {
            scriptText += + `" ` + "-" + QueryText+ `";`;
        }
        return (scriptText);
    }

    static submitClick (filterID)
    {
        return (`document.getElementById("` + filterID + `").getElementsByClassName("submit actions")[0].children[0].click();`);
    }
}

function createFolliculeButton(buttonText, buttonScript)
{
    let follButton = document.createElement("input");
    follButton.setAttribute("type","button");
    follButton.setAttribute("value",buttonText);
    follButton.setAttribute("onclick", buttonScript)

    //TODO: set up button css in a stylesheet because this is apparently bad practice
    follButton.setAttribute("style","display: inline-block;position: relative; width: 2.25ch;");
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


    /* Tags can wrap onto multiple lines, so mousing over the wrapper/buttons adds a highlight to identify what's going to be filtered */
    if (follSpanStyle.useBackgroundHighlight == true || follSpanStyle.useBorder == true)
    {
        //set default for element so style doesn't 'jump' on mouseover
        folliculeWrapper.setAttribute("style",follSpanStyle.generateStyle(false));

        folliculeWrapper.addEventListener("mouseover", function() {
            folliculeWrapper.setAttribute("style", follSpanStyle.generateStyle(true));
        });

        folliculeWrapper.addEventListener("mouseout", function() {
            folliculeWrapper.setAttribute("style", follSpanStyle.generateStyle(false));
        });
    }

    // set the wrapper as child of the parent, replacing the original
    parentElement.replaceChild(folliculeWrapper, element);
    // set element as child of wrapper
    folliculeWrapper.appendChild(element);


    //set up a secondary span for the buttons themselves to sit in next to the element
    let folliculeSpan = document.createElement('span');
    folliculeSpan.setAttribute("class","follicule buttons");

    //set the wrap for the span so the buttons are together
    //margin_top is used here to provide spacing for underline highlights on the line above
    //TODO make this dynamic as part of static highlighting flags up top
    folliculeSpan.setAttribute("style", `white-space: pre; display: inline-block; margin-top: 2px;`);

    folliculeWrapper.appendChild(folliculeSpan);


    //and start stuffing elements into that span
    //spacer
    folliculeSpan.appendChild(document.createTextNode(" "));

    //+ button
    let plus = createFolliculeButton("+",includeScript);
    folliculeSpan.appendChild(plus);

    //- button
    let minus = createFolliculeButton("-",excludeScript);
    folliculeSpan.appendChild(minus);
}

function createQueryFollicule(queryFilterValue, querySearchElement, isBookmarkPage)
{
    /* Author and series (and potentially other) kinds of identifiers
    have to be entered as freeform queries with special operators
    to indicate what's being queried on. */

    /* These currently take the form of [classifier:][value] pairs:
        creators:[authorname] to require an author
        -creators:[authorname] to exclude them

        params for this fn thus mirror this:
        [queryfiltervalue][querysearchelement.text]
    */

    let filterID;
    let queryID;

    if (isBookmarkPage == true)
    {
        filterID = bookmarkPage.filterID;
        queryID = bookmarkPage.queryID;
    }

    else if (isBookmarkPage == false)
    {
        filterID = workPage.filterID;
        queryID = workPage.queryID;
    }

    let queryValue = querySearchElement.text;

    //wrap in escaped quotes - these values can have spaces and we want to catch that.
    queryValue = `\\"` + queryValue + `\\"`;

    let QueryText = queryFilterValue + queryValue;

    let scriptText = `document.getElementById("` + queryID + `").value= document.getElementById("` + queryID + `").value+`;

    let includeScript = scriptText + `" ` + QueryText+ `";`;

    let excludeScript = scriptText + `" ` + "-" + QueryText+ `";`;

    includeScript += scriptBuilder.submitClick(filterID);
    excludeScript += scriptBuilder.submitClick(filterID);

    createFollicule(querySearchElement, includeScript, excludeScript);
}

//TODO: move these strings into a single location for ease of maint.
function createSeriesFollicule(seriesElement, isBookmarkPage)
{
    createQueryFollicule(`series.title:`, seriesElement, isBookmarkPage);
}

function createAuthorFollicule(authorElement, isBookmarkPage)
{
    createQueryFollicule(`creators:`, authorElement, isBookmarkPage);
}

//TODO - createWorkTagFollicule and createBookmarkTagFollicule have a lot of shared code. Refactor?
function createWorkTagFollicule(tagElement, isBookmarkPage)
{
    let filterID;
    let includeQueryID;
    let excludeQueryID;

    if (isBookmarkPage == true)
    {
        filterID = bookmarkPage.filterID;
        includeQueryID =  bookmarkPage.tagIncludeQueryID;
        excludeQueryID = bookmarkPage.tagExcludeQueryID;
    }

    else if (isBookmarkPage == false)
    {
        filterID = workPage.filterID;
        includeQueryID =  workPage.tagIncludeQueryID;
        excludeQueryID = workPage.tagExcludeQueryID;
    }

    let tagname = tagElement.text;


    let includeScript = scriptBuilder.addTag(includeQueryID, tagname);
    let excludeScript = scriptBuilder.addTag(excludeQueryID, tagname);

    includeScript += scriptBuilder.submitClick(filterID);
    excludeScript += scriptBuilder.submitClick(filterID);

    createFollicule(tagElement, includeScript, excludeScript);

}

function createBookmarkTagFollicule(tagElement, isBookmarkPage)
{
    let filterID;
    let includeQueryID;
    let excludeQueryID;

    filterID = bookmarkPage.filterID;
    includeQueryID =  bookmarkPage.bmarkTagIncludeQueryID;
    excludeQueryID = bookmarkPage.bmarkTagExcludeQueryID;

    let tagname = tagElement.text;

    let includeScript = scriptBuilder.addTag(includeQueryID, tagname);
    let excludeScript = scriptBuilder.addTag(excludeQueryID, tagname);

    includeScript += scriptBuilder.submitClick(filterID);
    excludeScript += scriptBuilder.submitClick(filterID);

    createFollicule(tagElement, includeScript, excludeScript);

}

function processWorkTags(workListing, isBookmarkPage)
{
    /* Follicules for tags (relationship, character, freeform) */
    for (let tags of workListing.getElementsByClassName("tags"))
    {
        /* Work tags and bookmark tags are classed identically, but bookmark tags interact with a different filter element so they need to be handled separately. */

        if (tags.getAttribute("class") == "tags commas")
        {
            for (let tag of tags.getElementsByClassName("tag"))
            {
                createWorkTagFollicule(tag, isBookmarkPage);
            }
        }

        /* Bookmark tags are located in an alternate tag element */
        else if (tags.getAttribute("class") == "meta tags commas")
        {
            for (let tag of tags.getElementsByClassName("tag"))
            {
                createBookmarkTagFollicule(tag);
            }
        }
    }

    /* Run a separate loop for fandom tags, which are classed under a different name */
    for (let fandoms of workListing.getElementsByClassName("fandoms"))
    {
        for (let fandom of fandoms.getElementsByClassName("tag"))
        {
            createWorkTagFollicule(fandom, isBookmarkPage);
        }
    }

    /* Another loop for series links */
    for (let sequentials of workListing.getElementsByClassName("series"))
    {
        for (let series of sequentials.getElementsByTagName("a"))
        {
            createSeriesFollicule(series, isBookmarkPage);
        }
    }

}

function processWorkAuthors(workListing, isBookmarkPage)
{
    //follicules for authors
    for (let workLink of workListing.getElementsByTagName("a"))
    {
        //check links - attribute 'rel', value 'author'
        if (workLink.getAttribute("rel")=="author")
        {
            createAuthorFollicule(workLink, isBookmarkPage);
        }
    }
}

function processWorkListing(workListingName,isBookmarkPage)
{
    /* Start by looking in the DOM for the list of works on the page*/
    let workListing = document.getElementsByClassName(workListingName)[0];
    processWorkTags(workListing, isBookmarkPage);
    processWorkAuthors(workListing, isBookmarkPage);
}

function main()
{
    /* Check to make sure we're on a page with the UI elements we need to actually do filtering. */
    /* This also identifies whether this is a page of works or a page of bookmarks. */
    if (document.getElementById(workPage.filterID)!= null)
    {
        processWorkListing(workPage.workListingName, false);
    }
    if (document.getElementById(bookmarkPage.filterID)!= null)
    {
        processWorkListing(bookmarkPage.workListingName, true);
    }
}





(function() {
    'use strict';

    main();
})();
