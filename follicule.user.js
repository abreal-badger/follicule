// ==UserScript==
// @name         Follicule: Streamlined AO3 Search Filtering
// @namespace    http://tampermonkey.net/
// @version      0.5.3.6
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
    /* input elements expand to fill space, so we use line-height
    to fit the element to the size of the containing text */
    static buttonStyle = ""
    +"width: 1.4em;"
    +"line-height: inherit;"
    //+"vertical-align: text-top;"
    ;

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
                //a wrapper's first child should always be the original page element it's wrapping
                let element = folliculeWrapper.children[0];

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
                //a wrapper's first child should always be the original page element it's wrapping
                let element = folliculeWrapper.children[0];

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

    

    static create(element, folliculeButtonArray)
    {
        /* For a given element, create a 'follicule': a UI component
        with functionality related to the content and context of that element.
        */

        //Wrap the element in a span that will contain both the element and the follicule
        const parentElement = element.parentNode;
        let folliculeWrapper = this.createWrapperSpan();

        // set the wrapper as child of the parent, replacing the original
        parentElement.replaceChild(folliculeWrapper, element);
        // set the original element as child of wrapper
        folliculeWrapper.appendChild(element);

        //set up a secondary span for the buttons themselves to sit in next to the element
        let folliculeSpan = this.createButtonSpan();

        folliculeWrapper.appendChild(folliculeSpan);

        //and start stuffing buttons into that span
        for (const follButton of folliculeButtonArray)
        {
            folliculeSpan.appendChild(follButton);
        }

    }
}

class FolliculeButton
{
    static create(buttonText, buttonScript)
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
}

class QueryFolliculeButton extends FolliculeButton
{
    static create(archivePage, buttonText, queryDataFilterOperator,queryDataField,queryDataComparator,queryDataValue, wrapValueQuotes)
    {
         /* Author and series (and potentially other) kinds of identifiers
        have to be entered as freeform queries with special operators
        to indicate what's being queried on. */

        /* These currently take the form of [classifier:][value] pairs:
            creators:[authorname] to require an author
            -creators:[authorname] to exclude them
            params for this fn thus mirror this:
            [queryfiltervalue][querysearchelement.text]

            ...although that isn't quite true: it's not a pair, it's a triad
            of [classifier][operator][value] terms:

            creators:[authorname] is 'creator field EQUALS authorname'
            -creators:[authorname] is '(not)creator field EQUALS authorname'

            words:1000 is 'words field EQUALS 1000'
            words>1000 is 'words field MORE THAN 1000'

        */

        /*
        what do we need here?
        -the script needs to know where the final query string is to be inserted.
        -the script needs to know the final query string.

        the query string is composed of subcomponents
        - the field that is being searched (creator, words, series)
        - a valid value in that field (author name, wordcount value)
        - the comparator that's used to match field values in the DB against the specified value(:,<,>)
        - the operator that says 'if this matches/is true, include/exclude' (- operator)
        */

        let filterID = archivePage.filterID;
        let queryID = archivePage.queryID;

        //wrap in escaped quotes - these values can have spaces and we want to catch that.
        if (wrapValueQuotes)
        {
            queryDataValue = `\\"` + queryDataValue + `\\"`;
        }
        
        let QueryText = queryDataFilterOperator + queryDataField + queryDataComparator + queryDataValue;

        //todo - dump this in a script setup for the ao3 class rather than Scriptbuilder?
        let scriptText = `document.getElementById("` + queryID + `").value= document.getElementById("` + queryID + `").value+`;

        let buttonScript = scriptText + `" ` + QueryText+ `";`;

        /* TODO: refactor the submitClick so it's all called from a consistent level  */
        buttonScript += scriptBuilder.submitClick(filterID);

        let follButton = super.create(buttonText, buttonScript);


        return (follButton);
    }
}


class QueryFollicule extends Follicule
{
    static create (tagElement, buttonArray)
    {
        super.create(tagElement, buttonArray);
    }
}


class BinaryFilterFollicule extends Follicule
{
    /* This follicule is oriented around the presence or absence of a specific data element:
    e.g. the string of an authorname or a tag. It has two buttons to include or
    exclude that specific element in the active filter. */
    static create (tagElement, includeButton, excludeButton)
    {
        let buttonArray = new Array();
        
        buttonArray.push(includeButton);
        buttonArray.push(excludeButton);

        super.create(tagElement, buttonArray);
    }
}

class UnaryFilterFollicule extends Follicule
{
    /* This follicule is oriented around a data element that only shows up in one specific context:
    e.g. the 'language' dropdown option, which only allows picking a single data option to include,
    and does not allow multi-element complexity or the ability to exclude */

    static create (tagElement, includeButton)
    {
        let buttonArray = new Array();

        buttonArray.push(includeButton);

        super.create(tagElement, buttonArray);
    }
}

class RangeFilterFollicule extends Follicule
{
    /* This follicule is oriented around numeric data elements that allow for filtering on range-based
    criteria: less-than, greater-than, equal-to comparisons. */
    static create (rangeElement, lessThanButton, equalToButton, greaterThanButton)
    {
        let buttonArray = new Array();
        
        buttonArray.push(lessThanButton);
        buttonArray.push(equalToButton);
        buttonArray.push(greaterThanButton);

        super.create(rangeElement, buttonArray);
    }
}


class TagFollicule extends BinaryFilterFollicule
{
    static create(tagElement, filterID, includeQueryID, excludeQueryID)
    {
        let tagname = tagElement.text;
        let includeScript = scriptBuilder.addTag(includeQueryID, tagname);
        let excludeScript = scriptBuilder.addTag(excludeQueryID, tagname);

        includeScript += scriptBuilder.submitClick(filterID);
        excludeScript += scriptBuilder.submitClick(filterID);

        let includeButton = FolliculeButton.create("+",includeScript);
        let excludeButton = FolliculeButton.create("-",excludeScript);

        super.create(tagElement, includeButton, excludeButton)
    }
}


class LanguageFollicule extends UnaryFilterFollicule
{
    static create(langElement, filterID, langSelectID, langOptionPosition)
    {
        // NB: apparently this gets a lot simpler upfront with jquery
        let scriptText = `document.getElementById("` + langSelectID + `")[`+langOptionPosition+`].selected = true;`

        scriptText += scriptBuilder.submitClick(filterID);

        let includeButton = FolliculeButton.create("+",scriptText);
        super.create (langElement, includeButton);
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

        let seriesname = seriesElement.text;

        let includeButton = QueryFolliculeButton.create(archivePage,"+","",`series.title`,":",seriesname);
        let excludeButton = QueryFolliculeButton.create(archivePage,"-","-",`series.title`,":",seriesname);

        BinaryFilterFollicule.create(seriesElement, includeButton, excludeButton);

    }
}

function createAuthorFollicule(archivePage,authorElement)
{
    let authorname = authorElement.text;

    let includeButton = QueryFolliculeButton.create(archivePage,"+","",`creators`,":",authorname);
    let excludeButton = QueryFolliculeButton.create(archivePage,"-","-",`creators`,":",authorname);

    BinaryFilterFollicule.create(authorElement, includeButton, excludeButton);
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

function createLanguageFollicule(archivePage, languageElement)
{
    let filterID;
    let langSelectID;

    filterID = archivePage.filterID;
    langSelectID = archivePage.languageSelectorID;

    let languageName = languageElement.innerText;

    //lookup the position of the option value for this language name
    let selector = document.getElementById(langSelectID);

    let optionIndex = 0;
    for (let langOptionElement of selector)
    {
        if (langOptionElement.innerText == languageName)
        {
            break;
        }
        optionIndex++;
    }

    LanguageFollicule.create(languageElement, filterID, langSelectID, optionIndex)
}

function createNumericRangeFollicule(archivePage, ddElement)
{
    /* TODO: using QueryFolliculeButtons for these results in weird behavior:
        filtering on these arguments means they don't show up in the 'search within results' box, 
        meaning that applying this filter is undone the next time the page arguments are reset from the filter UI.

        For something like wordcount, there's existing UI (the from/to fields) that can serve as
        targets for follicule scripts... but for kudos,hits, etc, there's not a good solution?
        */

    let rangeElement = ddElement;
    
    /* trim commas so we have single-number values */
    let elementValue = rangeElement.innerText.replaceAll(',', '');
    

    let lessThanButton = QueryFolliculeButton.create(archivePage,"<","",rangeElement.className,"<",elementValue,false);
    let equalToButton = QueryFolliculeButton.create(archivePage,"=","",rangeElement.className,":",elementValue,false);
    let greaterThanButton = QueryFolliculeButton.create(archivePage,">","",rangeElement.className,">",elementValue,false);

    RangeFilterFollicule.create(rangeElement, lessThanButton, equalToButton, greaterThanButton);
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

                let removeButton = FolliculeButton.create("x", deleteScriptString);

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
    constructor(pageType, filterID, workListingName, queryID, tagIncludeQueryID, tagExcludeQueryID,languageSelectorID)
    {
        this.pageType = pageType;
        this.filterID = filterID;
        this.workListingName = workListingName;
        this.queryID = queryID;
        this.tagIncludeQueryID = tagIncludeQueryID;
        this.tagExcludeQueryID = tagExcludeQueryID;
        this.languageSelectorID = languageSelectorID;

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
            "work_search_excluded_tag_names_autocomplete",
            "work_search_language_id"
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
            "bookmark_search_excluded_tag_names_autocomplete",
            "bookmark_search_language_id"
            );

        this.bmarkTagIncludeQueryID = "bookmark_search_other_bookmark_tag_names_autocomplete";
        this.bmarkTagExcludeQueryID = "bookmark_search_excluded_bookmark_tag_names_autocomplete";
    }
}


/* TODO - these 'process' fns would work OK as filterable page methods: 
    return a list of tags/fandoms/authors/series for this page, etc. 
    
    this might also be useful as a root basis for parsing/scraping a page and internalizing everything as structured data objects?

    
    */
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


function processWorkStats(archivePage)
{
    for (let workStatusBlock of archivePage.workListing.getElementsByClassName("stats"))
    {
        for (let ddElement of workStatusBlock.getElementsByTagName("dd"))
        {
            if (ddElement.className == "language")
            {
                // unary follicules for language selection
                //theoretically, <select> elements allow for multiple selection, but 
                //filter logic here doesn't afford that in this case.
                createLanguageFollicule(archivePage, ddElement);
            }
            else if (
                      (ddElement.className == "words")
                    ||(ddElement.className == "hits")
                    ||(ddElement.className == "kudos")
                    ||(ddElement.className == "bookmarks")
                    ||(ddElement.className == "comments")
                )
            {
                createNumericRangeFollicule(archivePage, ddElement);
            }
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

    processWorkStats(archivePage);


    processWorkSearchQuery(archivePage);

}

function main()
{
    /* Check to make sure we're on a page with the UI elements we need to actually do filtering. */
    /* This also identifies whether this is a page of works or a page of bookmarks. */

    /* WIP: this depends on searching page URLs for relevant elements rather than searching for IDs in the DOM like before. See if this is sustainable? */

    let archivePage;


    if (document.URL.search('/works') != -1)
    {
        archivePage = new ArchiveFilteredWorkPage();
    }
    else if (document.URL.search('/bookmarks') != -1)
    {
        archivePage = new ArchiveFilteredBookmarkPage();
    }

    if (archivePage != undefined)
    {
		console.log(archivePage.queryID);
        processWorkListing(archivePage);
    }

}





(function() {
    'use strict';

    main();
})();
