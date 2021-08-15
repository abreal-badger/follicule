# follicule

![Screencap of an Ao3 work demonstrating UI elements](https://user-images.githubusercontent.com/87678348/129494605-b0a75830-a77a-418f-abc3-bc944b62645e.png)

## What's Follicule?

Follicule is a Tampermonkey script for Archive of Our Own that streamlines the task of filtering Ao3 works and bookmarks. 

When you're browsing works by tag (fandom, relationship, character, etc) or author, it adds UI elements that let you filter on tags and authors with a single click.

Follicule also attempts to parse the contents of the 'Search within results' searchbox and generate a UI similar to the tag searchboxes above it, letting you get an easy view of the search terms in there and letting you remove parts with a single click.

## How Do I Use Follicule?

### Installing

Follicule is written for usage with Tampermonkey, a plugin for your browser. Get that installed, and then import `follicule.user.js` into the plugin - see the Tampermonkey documentation for more details.

(Follicule is a work in progress - I'm looking at integration into Greasyfork a little later once things are stable)

### Using

Follicule loads UI elements on pages that have _filterable lists of works._ - this means that the page must have both a listing of works and the Ao3 filter sidebar.

Most importantly, Follicule **does not work on dashboards** - you have to go to a listing of works with the Ao3 filter sidebar.

Follicule UIs will appear when you are doing the following:
* Browsing works by tag.
* Browsing works in a collection.
* Browsing a user's works or bookmarks.

When you are on one of these pages, the following UI elements will appear:

#### Tag and Author Filter Buttons
Follicule adds (+/-) buttons after every tag and author name:
![Screencap of a generic Ao3 work, showing buttons on tags](https://user-images.githubusercontent.com/87678348/129494605-b0a75830-a77a-418f-abc3-bc944b62645e.png)

Clicking the + button requires that tag or user in your search criteria.
Clicking the - button excludes them from your search criteria. 

In both cases, using the button _automatically_ refreshes the page with the changed criteria.

Mousing over the buttons highlights the tag they're associated with for easy identification; the aesthetics of this are configurable in the script.

#### 'Search within results' Filtering
If there is text in the 'Search within results' searchbox, Follicule will attempt to parse that text and display the query elements as though they were tags:

![Screencap of the Ao3 filter sidebar, showing the 'Search within results' box and parsed contents.](https://user-images.githubusercontent.com/87678348/129494692-dfce8a7e-56cf-44b4-9824-cbac883a2072.png)

This operates the same way as the interfaces for 'Other tags to include/exclude': clicking the button after a search term removes it from the search box.

Note that this does not automatically reload the page - use the 'Sort and Filter' buttons on the sidebar, like you would if you were changing tags.

### Technical Notes and Disclaiming Liability

This script doesn't do anything fancy - it takes the tag name and automates putting it in the filter sidebar UI, saving you some copy-pasting and scrolling. It does not save information about the content you're browsing.

You should be aware that this is my first foray into Javascript and working with web development. I have tried to use best practices as I became aware of them, but I'm also aware that mistakes have likely been made. I've tested this on my copy of Firefox, but larger-scale testing for browser compatibility and overall accessibility issues hasn't happened, and might not for a while. Use at your own risk.
