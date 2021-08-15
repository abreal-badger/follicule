// ==UserScript==
// @name         Follicule: Streamlined AO3 Search Filtering
// @namespace    http://tampermonkey.net/
// @version      0.5.3
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



class FolliculeStyle {
    /* Customizable display preferences so things play nice with your site skin, etc. */
    /* These preferences use standard CSS and can be modified accordingly. */

    /*****************************/
    /* BASIC STYLE CONFIGURATION */
    /*****************************/

    /* Background Highlights: */

    /* Mousing over follicule buttons highlights the associated link, same as with normal Ao3 functionality. */
    static useBackgroundHighlight = true;

    static backgroundHighlightOn = "rgba(89, 152, 214,0.5)";

    /* Borders/Underlining */

    /* Some site skins might interfere with highlighting via background modification. This is a secondary option that uses borders to underline elements in a way that doesn't interfere. */

    static useBorder = true;

    static borderWidthOn = "medium";
    static borderStyleOn = "solid";
    static borderColorOn = "rgb(238, 238, 238)";


    /********************/
    /* ADVANCED OPTIONS */
    /********************/

    /* The following aren't intended to be easily user-modifiable; they're included here as a common point of access for maintenance purposes. */

    /* Styling for the span that wraps a element and follicule */
    static wrapperSpanStyle = ""

    /* Styling for the span that wraps a follicule button pair. */
    /* The inline-block option is so you don't get a single button wrapping to the next line. */
    static buttonSpanStyle = ""
        //+"white-space: pre;"
        +"display: inline-block;"
        +"padding-left: .25em;"
        //+"margin-bottom: .2em;"
        ;


    /* Styling for follicule buttons */
    /* input elements expand to fill space, so we use line-height to fit the element to the size of the containing text */
    static buttonStyle = "width: 1.4em;line-height: inherit;vertical-align: text-top;";

}

class scriptBuilder{
    /* TODO - move these into the ao3 page class, since they're specific to pages */

    static addTag (queryID, tag)
    {
        return (`document.getElementById("` + queryID + `").value=` + `"` + tag+ `";`);
    }

    static submitClick (filterID)
    {
        return (`document.getElementById("` + filterID + `").getElementsByClassName("submit actions")[0].children[0].click();`);
    }
}

class Follicule
{
    static createWrapperSpan()
    {
        let folliculeWrapper = document.createElement('span');

        if (FolliculeStyle.useBackgroundHighlight == true || FolliculeStyle.useBorder == true)
        {


            folliculeWrapper.addEventListener("mouseover", function() {
                // TODO: This is reliant on the element being wrapped being a <a> tag with a border - are there cases where this isn't going to be the case?
                let element = folliculeWrapper.getElementsByTagName("a")[0];

                if (FolliculeStyle.useBorder)
                {
                    element.style.borderBottomWidth = FolliculeStyle.borderWidthOn;
                    element.style.borderBottomStyle = FolliculeStyle.borderStyleOn;
                    element.style.borderColor = FolliculeStyle.borderColorOn;
                }
                if (FolliculeStyle.useBackgroundHighlight)
                {


                    element.style.background = FolliculeStyle.backgroundHighlightOn;
                }

            });

            folliculeWrapper.addEventListener("mouseout", function() {
                // TODO: This is reliant on the element being wrapped being a <a> tag with a border - are there cases where this isn't going to be the case?
                let element = folliculeWrapper.getElementsByTagName("a")[0];

                if (FolliculeStyle.useBorder)
                {
                    element.style.borderBottomWidth = "";
                    element.style.borderBottomStyle = "";
                    element.style.borderColor = ""
                }
                if (FolliculeStyle.useBackgroundHighlight)
                {
                    element.style.backgroundColor = "";
                }
            });
        }
        return (folliculeWrapper);
    }

    static createButtonSpan()
    {
         //set up a secondary span for the buttons themselves to sit in next to the element
        let folliculeSpan = document.createElement('span');
        folliculeSpan.setAttribute("class","follicule buttons");

        folliculeSpan.setAttribute("style", FolliculeStyle.buttonSpanStyle);
        return (folliculeSpan);
    }

    static createButton(buttonText, buttonScript)
    {
        let follButton = document.createElement("input");
        follButton.setAttribute("type","button");
        follButton.setAttribute("value",buttonText);
        follButton.setAttribute("onclick", buttonScript)

        //TODO: set up button css in a stylesheet because this is apparently bad practice
        follButton.setAttribute("style",FolliculeStyle.buttonStyle);
        //maybe see about the alignment too?

        return (follButton);
    }

    static create(element, includeScript, excludeScript, includeButtonValue = '+', excludeButtonValue = '-')
    {

        /* For a given element, create a 'follicule': a UI component
        with functionality related to the content and context of that element.
        */

        //Wrap the element in a span that will contain both the element and the follicule
        const parentElement = element.parentNode;
        let folliculeWrapper = this.createWrapperSpan();



        // set the wrapper as child of the parent, replacing the original
        parentElement.replaceChild(folliculeWrapper, element);
        // set element as child of wrapper
        folliculeWrapper.appendChild(element);




        //set up a secondary span for the buttons themselves to sit in next to the element
        let folliculeSpan = this.createButtonSpan();

        folliculeWrapper.appendChild(folliculeSpan);




        //and start stuffing elements into that span




        //Inclusion button
        let incl = this.createButton(includeButtonValue,includeScript);
        folliculeSpan.appendChild(incl);

        //Exclusion button
        let excl = this.createButton(excludeButtonValue,excludeScript);
        folliculeSpan.appendChild(excl);

    }
}

class TagFollicule extends Follicule
{
    static create(tagElement, filterID, includeQueryID, excludeQueryID)
    {
        let tagname = tagElement.text;
        let includeScript = scriptBuilder.addTag(includeQueryID, tagname);
        let excludeScript = scriptBuilder.addTag(excludeQueryID, tagname);

        includeScript += scriptBuilder.submitClick(filterID);
        excludeScript += scriptBuilder.submitClick(filterID);

        super.create(tagElement, includeScript, excludeScript);
    }
}

class QueryFollicule extends Follicule
{
    static create(queryFilterValue, archivePage, querySearchElement)
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

        let filterID = archivePage.filterID;
        let queryID = archivePage.queryID;
        let queryValue = querySearchElement.text;

        //wrap in escaped quotes - these values can have spaces and we want to catch that.
        queryValue = `\\"` + queryValue + `\\"`;

        let QueryText = queryFilterValue + queryValue;

        //todo - dump this in a script setup for the ao3 class rather than Scriptbuilder?
        let scriptText = `document.getElementById("` + queryID + `").value= document.getElementById("` + queryID + `").value+`;

        let includeScript = scriptText + `" ` + QueryText+ `";`;

        let excludeScript = scriptText + `" ` + "-" + QueryText+ `";`;

        includeScript += scriptBuilder.submitClick(filterID);
        excludeScript += scriptBuilder.submitClick(filterID);

        super.create(querySearchElement, includeScript, excludeScript);
    }
}

//TODO: move these string literals for author and series searchterms into a single location for ease of maint.
//dump them in a static map in the QueryFollicule class?
function createSeriesFollicule(archivePage, seriesElement)
{
    /*
    as of 20210809, filtering by series.title appears to be broken on bookmark pages
    so that functionality is being snipped for now
    */
    if (archivePage.pageType != ArchivePageType.Bookmarks_Filtered)
    {
        QueryFollicule.create(`series.title:`, archivePage, seriesElement);
    }
}

function createAuthorFollicule(archivePage,authorElement)
{
    QueryFollicule.create(`creators:`, archivePage, authorElement);
}

function createWorkTagFollicule(archivePage, tagElement)
{
    let filterID = archivePage.filterID;
    let includeQueryID = archivePage.tagIncludeQueryID;
    let excludeQueryID = archivePage.tagExcludeQueryID;

    TagFollicule.create(tagElement, filterID, includeQueryID, excludeQueryID);
}

function createBookmarkTagFollicule(archivePage ,tagElement)
{
    let filterID;
    let includeQueryID;
    let excludeQueryID;

    filterID = archivePage.filterID;
    includeQueryID =  archivePage.bmarkTagIncludeQueryID;
    excludeQueryID = archivePage.bmarkTagExcludeQueryID;

    TagFollicule.create(tagElement, filterID, includeQueryID, excludeQueryID);

}

class WorkSearchQueryListing
{
    static create(archivePage)
    {
        /* Parses the query input and returns a listing of each search term.
        Adds UI elements similar to what's already in the filter sidebar to allow
        easy elimination of terms */

        const parsedCriteria = archivePage.WorkSearchQueryParsedCriteria();

        /* Check if there's any criteria before adding content */
        if (parsedCriteria != [])
        {

            let queryList = document.createElement('ul');
            let searchBox = document.getElementById(archivePage.queryID);
            let searchParent = searchBox.parentNode;

            /* push the list element in ahead of the input box */
            searchParent.replaceChild(queryList,searchBox);
            searchParent.append(searchBox);

            for (const criteriaIndex of parsedCriteria)
            {
            //for each parsed criteria:
                //create a <li> in the list with the criteria text
                let queryListItem = document.createElement('li');
                //queryListItem.setAttribute("class","");//see if the tag classer is needed here?"added tag"
                queryListItem.style.overflowWrap = "anywhere";

                queryListItem.innerText = criteriaIndex;
                queryList.appendChild(queryListItem);

                let deleteScriptString = `{let q = document.getElementById("`+archivePage.queryID+`");
                q.value = q.value.replace(\``+criteriaIndex+`\`,"");this.parentNode.hidden=true;}`

                let removeButton = Follicule.createButton("x", deleteScriptString);

                /* do some style changes to make it fit in better with the other sidebar elements*/

                /*the altered appearance also indicates altered behavior, since page doesn't refresh on click for other sidebar elements*/


                removeButton.style.borderRadius = '5em';

                removeButton.style.marginLeft = "2px";

                removeButton.style.width = "3ch";

                removeButton.style.lineHeight = "inherit";

                removeButton.title = "Remove " + criteriaIndex;

                queryListItem.appendChild(removeButton);

            }
        }


    }
}

/* Ao3 Classes and datatypes */

const ArchivePageType=
{
    Works_Filtered: "A page of works that can be filtered",
    Bookmarks_Filtered: "A page of bookmarks that can be filtered"
};

class ArchiveFilteredPage
{
    constructor(pageType, filterID, workListingName, queryID, tagIncludeQueryID, tagExcludeQueryID)
    {
        this.pageType = pageType;
        this.filterID = filterID;
        this.workListingName = workListingName;
        this.queryID = queryID;
        this.tagIncludeQueryID = tagIncludeQueryID;
        this.tagExcludeQueryID = tagExcludeQueryID;

        /* Verify via the document that we're on the right pagetype for these IDs */
        if (document.getElementById(filterID)== null)
        {
            throw "ArchiveFilteredPage: filterID value " + filterID + " could not be found in document.";
        }

        /* Look in the DOM for the list of works on the page*/
        this.workListing = document.getElementsByClassName(workListingName)[0];
    }

    WorkSearchQueryParsedCriteria()
    {
        /* Parses 'Search within results' queries according to some simple rules */

        //TODO - bookmark windows have more than one SWR input,
        //so this is going to need to be broken out a little.
        let searchboxValue = document.getElementById(this.queryID).value;

        if (searchboxValue.length != 0)
        {
            let openQuote = false;
            let spacesOutsideQuotes = new Array();

            for (let i = 0; i < searchboxValue.length; i++)
            {
                /* Spaces are the primary token seperators, but we ignore the ones
                that are wrapped/escaped by double quotes. */
                switch (searchboxValue.charAt(i))
                {
                    case "\"":
                    if (openQuote == false)
                        openQuote = true;
                    else
                        openQuote = false;
                    break;

                    case " ":
                    if (openQuote == false)
                        spacesOutsideQuotes.push(i);
                }
            }

            spacesOutsideQuotes.push(searchboxValue.length);

            let queryParsedArgs = new Array();
            let startindex = 0;
            let endindex = 0;
            for (const index of spacesOutsideQuotes)
            {
                endindex = index;
                queryParsedArgs.push(searchboxValue.substring(startindex,endindex));
                startindex = endindex;
            }

            return (queryParsedArgs);
        }
        /* nothing to parse? */
        else return ([]);
    }


}

class ArchiveFilteredWorkPage extends ArchiveFilteredPage
{
    constructor()
    {
        super(
            ArchivePageType.Works_Filtered,
            "work-filters",
            "work index group",
            "work_search_query",
            "work_search_other_tag_names_autocomplete",
            "work_search_excluded_tag_names_autocomplete"
            );
    }

}

class ArchiveFilteredBookmarkPage extends ArchiveFilteredPage
{
    constructor()
    {
        super(
            ArchivePageType.Bookmarks_Filtered,
            "bookmark-filters",
            "bookmark index group",
            "bookmark_search_bookmarkable_query",
            "bookmark_search_other_tag_names_autocomplete",
            "bookmark_search_excluded_tag_names_autocomplete");

        this.bmarkTagIncludeQueryID = "bookmark_search_other_bookmark_tag_names_autocomplete";
        this.bmarkTagExcludeQueryID = "bookmark_search_excluded_bookmark_tag_names_autocomplete";
    }
}


/* todo - these 'process' fns would work OK as filterable page methods: return a list of tags/fandoms/authors/series for this page, etc. */
function processWorkTags(archivePage)
{
    /* Follicules for tags (relationship, character, freeform) */
    for (let tags of archivePage.workListing.getElementsByClassName("tags"))
    {
        /* Work tags and bookmark tags are classed identically, but bookmark tags interact with a different filter element so they need to be handled separately. */

        if (tags.getAttribute("class") == "tags commas")
        {
            for (let tag of tags.getElementsByClassName("tag"))
            {
                createWorkTagFollicule(archivePage, tag);
            }
        }

        /* Bookmark tags are located in an alternate tag element */
        else if (tags.getAttribute("class") == "meta tags commas")
        {
            for (let tag of tags.getElementsByClassName("tag"))
            {
                createBookmarkTagFollicule(archivePage, tag);
            }
        }
    }

    /* Run a separate loop for fandom tags, which are classed under a different name */
    for (let fandoms of archivePage.workListing.getElementsByClassName("fandoms"))
    {
        for (let fandom of fandoms.getElementsByClassName("tag"))
        {
            createWorkTagFollicule(archivePage, fandom);
        }
    }

    /* Another loop for series links */
    for (let sequentials of archivePage.workListing.getElementsByClassName("series"))
    {
        for (let series of sequentials.getElementsByTagName("a"))
        {
            createSeriesFollicule(archivePage, series);
        }
    }

}

function processWorkAuthors(archivePage)
{
    //follicules for authors
    for (let workLink of archivePage.workListing.getElementsByTagName("a"))
    {
        //check links - attribute 'rel', value 'author'
        if (workLink.getAttribute("rel")=="author")
        {
            createAuthorFollicule(archivePage,workLink);
        }
    }
}

function processWorkSearchQuery(archivePage)
{
    WorkSearchQueryListing.create(archivePage);
}

function processWorkListing(archivePage)
{
    processWorkTags(archivePage);
    processWorkAuthors(archivePage);
    processWorkSearchQuery(archivePage);
}

function main()
{
    /* Check to make sure we're on a page with the UI elements we need to actually do filtering. */
    /* This also identifies whether this is a page of works or a page of bookmarks. */

    /* WIP: this depends on searching page URLs for relevant elements rather than searching for IDs in the DOM like before. See if this is sustainable? */


    let archivePage;


    if (document.URL.search('/works') != 0)
    {
        archivePage = new ArchiveFilteredWorkPage();
    }
    else if (document.URL.search('/bookmarks') != 0)
    {
        archivePage = new ArchiveFilteredBookmarkPage();
    }

    if (archivePage != undefined)
    {
        processWorkListing(archivePage);
    }

}





(function() {
    'use strict';

    main();
})();
