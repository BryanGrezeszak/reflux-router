// v 1.0.0
// By Bryan Grezeszak 2016
// MIT License

(function (root, factory) {
	if (typeof define === "function" && define.amd)
		define(factory);
	if (typeof module === "object" && module.exports)
		module.exports = factory();
	if (typeof root === "object" && typeof Reflux !== 'undefined')
		root.RefluxRouter = factory();
}(this, function(){
	"use strict";
	
	var RefluxRouter = {};
	var _reflux = typeof Reflux !== 'undefined' ? Reflux : null;

	// if set to true then it will use hashes instead of HTML5 history, is set in initialize
	var useHash = false;
	var hashMarker = null;

	// for isomorphism (running on server and browser) we need to know
	// if the window and document are available or not right now
	var hasWin = typeof window === 'object';
	var hasDoc = typeof document === 'object';

	// private static vars that store our route definitions
	RefluxRouter._definedRoutes = {};
	RefluxRouter._regexRoutes = [];

	// fragments like "/page/" and "/page" should be treated as the same route,
	// so internally this treats them all as having leading AND trailing
	// slashes, and this private function adds them if need be
	function slashify(route)
	{
		if (!route)
			return '/';
		
		return route.replace(/^([^\/])|([^\/])$/g, '$2/$1');
	}

	// this handles the actual push state event from the browser that happens
	// when the pages are changed, that's why there's the 2nd argument passed
	// to the `navigateTo` method, that prevents it from adding the navigation
	// to the history, since this is happening ON a history event
	function onPushState(evt)
	{
		if (evt && evt.state && evt.state.reflux_route)
			RefluxRouter.navigateTo(evt.state.reflux_route, true);
		else
			RefluxRouter.navigateTo(RefluxRouter._defaultRoute, true);
	}

	// if you used a routingMarker starting with # in your initialization then it uses hashes,
	// and this is the function called on hash change
	function onHashChange(evt)
	{
		var route = location.hash.substr(hashMarker.length);
		RefluxRouter.navigateTo(route, true);
	}
	
	// RefluxRouter.defineReflux(rflx)
	// 
	// Needs to be called to define Reflux in environments or situations where it may not be global.
	RefluxRouter.defineReflux = function(rflx)
	{
		_reflux = rflx;
	}

	// RefluxRouter.initializeRouting(defaultRoute, routingMarker)
	// RefluxRouter.initializeRouting(defaultRoute, routingMarker, manualRoute)
	//
	// needs to be called at the beginning of the program with the defaultRoute
	// (i.e. the homepage equivalent route that the program should use when the URL
	// is clean, the routingMarker which is a fragment of the URL that the program
	// can know AFTER which is what is considered the routing part of the URL (done
	// this way so that the app can run in different locations only needing to recognize
	// part of the URL to run) and optionally the manualRoute which is more for server-
	// side needs, telling the routing what the URL is that you want to use as current.
	// returns the initial title for the route used. In the browser that is set automatically,
	// but for other environments you will need that data to set it yourself.
	RefluxRouter.initializeRouting = function(defaultRoute, routingMarker, manualRoute)
	{
		RefluxRouter._defaultRoute = slashify(defaultRoute);
		var href = manualRoute || (hasWin ? window.location.href : '');
		
		// routingMarker and href should not have trailing slashes, since fragments will have leading ones
		href = href.replace(/\/$/, '');
		routingMarker = routingMarker.replace(/\/$/, '');
		
		var fragment, i = href.indexOf(routingMarker);
		
		useHash = routingMarker.charAt(0) === '#';
		hashMarker = useHash ? routingMarker : null;
		
		if (useHash && hasWin)
			window.addEventListener('hashchange', onHashChange);
		else if (hasWin)
			window.addEventListener('popstate', onPushState);
		
		if (useHash && i === -1)
			fragment = '/';
		else if (i === -1)
			throw new Error('Routing marker not found in current URL.');
		
		fragment = fragment || slashify( href.substr(i+routingMarker.length) );
		
		return RefluxRouter.navigateTo(fragment, true);
	}

	// RefluxRouter.defineRoute(route, action)
	// RefluxRouter.defineRoute(route, action, title)
	// RefluxRouter.defineRoute(route, action, argmnts)
	// RefluxRouter.defineRoute(route, action, argmnts, title)
	//
	// Allows you to define a route (as a string or regex, or an Array of them) with a
	// resulting action, optional arguments for that action (in the form of an Array),
	// and optional browser title to display for that route as well. Any time navigation
	// moves to that route the action will be called with arguments if they are
	// supplied, and the title will be changed to the title if one is given,
	// otherwise it will be left as whatever it was last.
	//
	// note the section at the end for an explanation of the operational differences
	// between a string based route and a regex based route
	RefluxRouter.defineRoute = function(route, action, titleORargmnts, title)
	{
		if (Array.isArray(titleORargmnts)) {
			var argmnts = titleORargmnts;
		} else {
			title = titleORargmnts;
			var argmnts = undefined;
		}
		
		if (Array.isArray(route)) {
			for (var i=0, ii=route.length; i<ii; i++)
				RefluxRouter.defineRoute(route[i], action, argmnts, title);
			return;
		}
		
		if (typeof route === 'string') {
			route = slashify(route);
			RefluxRouter._definedRoutes[route] = {action:action, argmnts:argmnts, title:title};
		} else { // assumes it's a regex, the only other valid option if not a string
			RefluxRouter._regexRoutes.push({regex:route, action:action, argmnts:argmnts, title:title});
		}		
	}

	// RefluxRouter.defineRouteState(route, state)
	// RefluxRouter.defineRouteState(route, state, title)
	//
	// Allows you to define a route (as a string or regex, or an Array of them) with
	// a resulting global state (partial or full) for the app to use as that route, and
	// optional browser title to display for that route as well. Any time navigation
	// moves to that route the the global state will be applied to the app,
	// and the title will be changed to the title if one is given, otherwise
	// it will be left as whatever it was last.
	//
	// note the section at the end for an explanation of the operational differences
	// between a string based route and a regex based route
	RefluxRouter.defineRouteState = function(route, state, title)
	{
		if (Array.isArray(route)) {
			for (var i=0, ii=route.length; i<ii; i++)
				RefluxRouter.defineRouteState(route[i], state, title);
			return;
		}
		if (typeof route === 'string') {
			route = slashify(route);
			RefluxRouter._definedRoutes[route] = {state:state, title:title};
		} else { // assumes it's a regex
			RefluxRouter._regexRoutes.push({regex:route, state:state, title:title});
		}
	}

	// RefluxRouter.navigateTo(route)
	// RefluxRouter.navigateTo(route, noHistory)
	//
	// This is the main function to be used within the app for navigating, and is
	// also used internally when the route changes independent of the app (e.g. the
	// back button is used). You simply call `RefluxRouter.navigateTo('/my/route')` to
	// change to the intended route. The second (optional) argument is mostly for
	// internal use and, if `true`, means that it will not add this route change
	// to the browser's history. It returns the resulting page title for that route
	// (or null if there isn't one) in order to allow non-browser implementations to utilize it.
	RefluxRouter.navigateTo = function(route, noHistory)
	{
		route = slashify(route);
		if (route === '/' || !route)
			route = RefluxRouter._defaultRoute
		
		var def = RefluxRouter._definedRoutes[route];
		var regexTitle = '', regexDef;
		
		// if no def try the regexes instead
		if (!def)
		{
			for (var i=0,ii=RefluxRouter._regexRoutes.length; i<ii; i++)
			{
				regexDef = RefluxRouter._regexRoutes[i];
				if ( route.match(regexDef.regex) )
				{
					if (regexDef.action) {
						regexDef.action.apply(null, regexDef.argmnts);
					} else if (regexDef.state) {
						_reflux.setGlobalState(regexDef.state);
					}
					
					if (regexDef.title) {
						regexTitle = regexDef.title.replace(/\{title\}/, regexTitle);
					}
				}
			}
		}
		
		// push the new state into the history if it's not flagged noHistory
		if (hasWin && !noHistory)
			window.history.pushState({reflux_route:route}, (def ? def.title : regexTitle) || null, route);
		
		// if there was a def, set the state or do the actions and change tht title
		if (def)
		{
			if (def.action)
				def.action.apply(null, def.argmnts);
			else if (def.state)
				_reflux.setGlobalState(def.state);
		}
		
		// if was a def title OR if a regex had a title defined, set that title, since most browsers do not do this just from the pushState
		var newTitle = (def && def.title) || regexTitle;
		if (hasDoc && newTitle)
			document.title = newTitle;
		
		// since title setting only works in browser, return the new title (if it exists, otherwise null)
		// so that whatever non-browser entity can work with it
		return newTitle || null;
	}

	/*

	EXPLANATION OF STRING VS. REGEX DEFINED ROUTES:

	1) if route has a matching string defined will it take that action or set that state
	2) if no string match, only then will then apply the actions/states of ALL regexes that match in the order they were defined

	This allows dynamic rules to be applied with regex, but still specific routes with ONLY exact actions/states to be defined as needed as well.

	Notes:

	  - Titles -
	  Any definition (string or regex) will only apply a title if a truthy value (i.e. a non-empty string) is given for that definition's title.
	  In the case of regexes the LAST defined matching regex with a title will have its title be used. HOWEVER, as matches happen any current regex title
	  can incorporate the previous title matches by including "{title}" in it's string. In this way multiple regex matches can work together to form
	  a final page title by incorporating the title from previous regex matches as they go. Example: the first match can have a title "one". The second
	  match can have a title "{title} > two", and the third match can have a title "{title} > three". The final title would be "one > two > three".
	 
	  - Regex Routes -
	  Regular expression route need to match the leading and trailing slash version of any route they want to match.
	  Internally the routing treats the URL "foo/bar", "foo/bar/" and "/foo/bar" ALL as "/foo/bar/". With string routes the library will autocorrect your
	  supplied routes for you as needed. But that is not so easily accomplished when you supply a regex.

	*/
	
	return RefluxRouter;
}));