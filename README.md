# follicule

![Screencap of an Ao3 work demonstrating UI elements](https://cdn.discordapp.com/attachments/815182420407615509/866837631409324102/unknown.png)

Follicule is a Tampermonkey script for Archive of Our Own that adds (+/-) buttons after every tag and author name on pages that let you filter works.

Clicking the + button requires that tag or user in your search criteria.
Clicking the - button excludes them from your search criteria. 

Mousing over the buttons highlights the tag they're associated with for easy identification; the aesthetics of this are configurable in the script.

This script doesn't do anything fancy - it takes the tag name and automates putting it in the filter sidebar UI, saving you some copy-pasting and scrolling. It does not save information about the content you're browsing.

You should be aware that this is my first foray into Javascript and working with web development. I have tried to use best practices as I became aware of them, but I'm also aware that mistakes have likely been made. I've tested this on my copy of Firefox, but larger-scale testing for browser compatibility and overall accessibility issues hasn't happened, and might not for a while.
