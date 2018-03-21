# RefluxRouter

RefluxRouter is designed to make exceedingly easy routing for single page apps (history API or hashes) when mixed with RefluxJS usage.

> Note: this currently requires features only found in the ES6 capable versions of Reflux (i.e. any non-zero major version number).

## Content

- [Getting It](#getting-it)
- [Overview / The Basics](#overview)
- [RefluxRouter.defineRoute](#refluxrouterdefineroute)
- [RefluxRouter.defineRouteState](#refluxrouterdefineroutestate)
- [RefluxRouter.navigateTo](#refluxrouternavigateto)
- [RefluxRouter.initializeRouting](#refluxrouterinitializerouting)
- [String vs. Regular Expression Routes](#string-vs-regular-expression-routes)
- [Ensuring RefluxRouter has access to Reflux](#ensuring-refluxrouter-has-access-to-reflux)
- [Handling the server side](#handling-the-server-side)

## Getting It

You import this into your project via npm:

`npm install --save reflux-router`

and then use it with CommonJS:

`var RefluxRouter = require('reflux-router');`

For usage in CommonJS note [this section](#ensuring-refluxrouter-has-access-to-reflux) for making sure it can access Reflux.

Or you can import via CDN at: `https://cdn.jsdelivr.net/npm/reflux-router@1.3.0/dist/reflux-router.min.js`

**Or** you can simply grab the `reflux-router.js` or `reflux-router.min.js` file from the `dist` folder in the [GitHub Repo](https://github.com/BryanGrezeszak/reflux-router) and script tag it into your project, where a global `RefluxRouter` variable will be available.

## Overview

##### Basic Route Defining

RefluxRouter mainly operates on the basic premise of keeping your app in sync with the URL via Reflux actions. Any time the URL changes a corresponding action is called (as defined by you) letting your app know what it should be showing. Then, in the normal interaction of your program when your program changes pages it does so via a RefluxRouter defined function to set the URL bar in order to do so.

Here's a basic example:

```javascript
RefluxRouter.defineRoute('/red/', Actions.changeColor, ['#ff0000'], 'Is Red!');
RefluxRouter.defineRoute('/blue/', Actions.changeColor, ['#0000ff'], 'Is Blue!');
```

That sets up the routing to handle two basic views. These functions will be gone over in more detail later in the docs, but the basic idea is that the first argument tells it what URL we're defining it for, the second is the action to call, the third are an array of arguments to pass to that action, and the fourth is the title bar text for that page.

##### Basic Initializing

But it's not quite done. It needs this as well:

```javascript
RefluxRouter.initializeRouting('/red/', 'mysite.com');
```

This initializes the router. The first argument tells the router that the "home" page (i.e. there's no extra fragment at all) should act the same as if it were on `mysite.com/red`

The second one is you telling the router at what point in the URL you want it to start recognizing things as fragments. It's an exact match string that the router will look for in the URL and only work with what comes *after* that. This allows you to use the router even as part of sub-folders. For example:

```javascript
RefluxRouter.initializeRouting('/red/', 'mysite.com/sub');
```

Now with the above it would be expecting URLs of `mysite.com/sub/red` and `mysite.come/sub/blue` instead of just `mysite.com/red` and `mysite.come/blue`

It also allows you to use hashes instead of the history API. Simply go:

```javascript
RefluxRouter.initializeRouting('/red/', '#');
```

Now it'll be expecting `mysite.com#red` and `mysite.come#blue`

##### Basic Navigation

Now ever time your URL changes outside of your program the program will automatically have actions called to keep it up.

But what about when it's your app doing the changing? Simple: you change the URL now. Since the URL can be changed outside the app's control the simplest possible way to achieve routing is to make that the only way these particular types of navigations take place is by changing the URL. So RefluxRouter gives you a method for this:

```javascript
RefluxRouter.navigateTo('/blue/');
```

That would navigate the URL to `mysite.com/blue`, automatically calling the actions you defined in the process.

##### More than the basics

There's also more advanced usage including setting a full or partial global state for a certain route, setting many strings for URLs at once, and using regular expressions for URL fragment matching. These are covered in the function by function documentation below.

--------------------------

### RefluxRouter.defineRoute

Is used to define a route and the things that go along with it. It looks something like this:

```javascript
RefluxRouter.defineRoute('/red/', Actions.changeColor, ['#ff0000'], 'Is Red!');

// or if you don't want to pass arguments to the action

RefluxRouter.defineRoute('/red/', Actions.changeColorRed, 'Is Red!');

// or if you don't want a title for this "page"

RefluxRouter.defineRoute('/red/', Actions.changeColorRed);
```

The first argument is the route fragment being defined. It can be a string, a regular expression, or an array of strings and/or regular expressions. Please note that strings and regular expressions aren't just different ways of matching, they actually indicate slightly different operation. See  the [String vs. Regular Expression Routes](#string-vs-regular-expression-routes) section for more.

The second argument is the action to call in order to navigate to this routed section within your program. In this case it will call `Actions.changeColor`, which is assumed to be a RefluxJS action. Any time the URL changes to match the defined route (defined via the first argument) this will be called.

The third argument is optional and can be two different things. If you want to pass arguments to the action (the second argument) then you can make this an Array of arguments to pass. Otherwise give it a string representing the title of the page (i.e. the title that shows in the browser window top bar). This is explained further in the next paragraph.

The fourth argument (or third if you don't pass arguments) is optional and is the title that the browser bar will show for this route. This is just a simple string. If you omit any title then the router will not change the title, it will remain whatever it was before this routing change. When using regular expressions for routes there is also the ability to merge multiple titles into one so that different route parts can contribute seperately to a part of the title. This is covered in the [String vs. Regular Expression Routes](#string-vs-regular-expression-routes) section.

--------------------------

### RefluxRouter.defineRouteState

*Note: this requires you are using the [Reflux ES6 API](https://www.npmjs.com/package/reflux-edge#react-es6-usage) patterns for both stores and components within your project in order to have a Reflux global state.*

This operates under similar principal to [RefluxRouter.defineRoute](#refluxrouterdefineroute) directly above. Therefore only the differences will be noted here.

Functionally the major difference is that this method is about setting partial or full Reflux global state on a routing change instead of calling an action.

This means that the second argument is not an action, but a full or partial state object that is intended to be set to the global state via `Reflux.setGlobalState`.

Since action arguments are no longer relevant, that means the third argument here (still optional) is only for the title.

```javascript
RefluxRouter.defineRouteState('/red/', {mystoreid:{color:'#ff0000'}}, 'Is Red!');

// or without a title:

RefluxRouter.defineRouteState('/red/', {mystoreid:{color:'#ff0000'}});
```

------------------------

### RefluxRouter.onUnknownRoute

You define routes via strings and/or regular expressions, but what happens when the URL fragment doesn't match any of them?

That's what `RefluxRouter.onUnknownRoute` is for. Simply override this function with your own function that expects the unknown route as an argument and it will get called every time an unknown route exists.

```javascript
RefluxRouter.onUnknownRoute = function(route)
{
	console.log(route) // <- /unknownroute/
	doSomethingWith(route);
}
```

------------------------

### RefluxRouter.initializeRouting

This method should be called after all your route definitions are declared in order to start the routing itself.

The basic concept for each argument of this:

1) The router needs to be told what defined route should be used as the home (i.e. what to call when no fragments are present).

2) The router needs to know what part of your URL it should consider as route fragments. For example if you're on the URL `mysite.com/blog/greek/` are you intending the entire `/blog/greek/` to be your route fragment, or is this app stored in the `blog` folder and you really just intend `/greek/` to be the route? To solve this we let you give an exact match string here, and after that string is *first* matched in your URL *after* that match it considers the URL to be the fragments intended for routing. Also note: if you want to forego the history API and use hashes then you can simply supply `'#'` here and it'll do so.

3) (optional) In the case of isomorphic usage (the JS being run server side to render the markup there and serve it prerendered) there's obviously no browser URL for the library to read to know what fragment you intend to serve. This argument allows you to manually tell RefluxRouter a URL to use so that even your isomorphic code serves the right stuff right from the start.

Here's an example:

```javascript
// red is equal to home, and anything after '.com' is considered  part of the fragment
RefluxRouter.initializeRouting('/red/', '.com');

// or

// to make it act as if a sub-folder is the home of the routing
RefluxRouter.initializeRouting('/red/', '.com/blog');

// or

// if on the server side we can do this to let it know we want to serve the blue page
RefluxRouter.initializeRouting('/red/', '.com', 'http://mysite.com/blue/');
```

---------------------

### RefluxRouter.navigateTo

The router needs to know when your page changes between routed parts in order to keep the URL in sync.

However...if you think about it making an API to do that doesn't make a lot of sense. The router is already tracking the URL and letting your program know what to do...so why does it need to track your program to tell the URL what to do? The program just needs to change the URL itself and then the router will handle pushing that back to the program, and then they both inherently stay in sync.

So when navigating between routed parts of your program don't call the action or set the global state. Simply call `RefluxRouter.navigateTo('/my/page/here');` and let the router do the calling of those things as defined by your route definitions.

---------------------

### RefluxRouter.trailingSlash

All routes whether `/blah/` `blah` `/blah` or `blah/` need to be treated same. We can either treat all as `/blah/` (true) or `/blah` (false), which is determined here (default = true).

---------------------

### String vs. Regular Expression Routes

1) If route has a matching string defined will it take that action or set that state.
2) If no string match, only then will it apply the actions/states of *all* regexes that match in the order that they were defined.

This allows dynamic rules to be applied with regex, but still specific routes with ONLY exact actions/states to be defined as needed as well.

**Notes:**

##### Titles

Any definition (string or regex) will only apply a title if a truthy value (i.e. a non-empty string) is given for that definition's title. In the case of regexes the **last** defined matching regex with a title will have its title be used. **However**, as matches happen any current regex title can incorporate the previous title matches by including "{title}" in it's string. In this way multiple regex matches can work together to form a final page title by incorporating the title from previous regex matches as they go. Example: the first match can have a title "one". The second match can have a title "{title} > two", and the third match can have a title "{title} > three". The final title would be "one > two > three".
 
##### Regex Routes

Regular expression route need to match the leading and trailing slash version of any route they want to match. Internally the routing treats the URL `foo/bar`, `foo/bar/` and `/foo/bar` **all** as `/foo/bar/`. With string routes the library will autocorrect your supplied routes for you as needed. But that is not so easily accomplished when you supply a regex.

---------------------

#### Ensuring RefluxRouter has access to Reflux

Sometimes Reflux might not be globally available or RefluxRouter needs to be loaded in before Reflux is available, or whatever. In that case you can simply use `RefluxRouter.defineReflux` to manually point RefluxRouter to Reflux.

Example in Node:

```javascript
var Reflux = require('reflux-edge');
var RefluxRouter = require('reflux-router');

RefluxRouter.defineReflux(Reflux);
// now it all works!
```

--------------------

#### Handling the server side

One important thing to note is that you still need to make your server serve your single page app for any possible URL it may use. For example, if you start at `mysite.com/app/` and navigate within your app to a URL `mysite.com/app/contact/` then all will be handled on the front end via the JS history API. However, if a user then copy/pastes that URL into another tab the server has to know to serve your app like normal instead of look for that actual URL. This library does not (and cannot) handle this for you. Whether you accomplish this with a `.htaccess` file or by manually determining routing in your ExpressJS app doesn't matter. Just keep it in mind so that you serve the app for all possible URLs your app may use.

Of course, if you wish to avoid this altogether then in your `RefluxRouter.initializeRouting` call you can just use `'#'` or `#!` as your route fragment beginning and it will use a hash/hashbang based method for routes which will mean your server doesn't have to worry about it, the true URL for it to serve stays the same for it.