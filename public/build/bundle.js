
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const score = writable(0);
    const mode=writable("INTRODUCTION_MODE");

    /* src/components/Nav.svelte generated by Svelte v3.44.2 */
    const file$3 = "src/components/Nav.svelte";

    function create_fragment$3(ctx) {
    	let nav;
    	let a;
    	let div;
    	let t;
    	let div_class_value;
    	let nav_class_value;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a = element("a");
    			div = element("div");
    			t = text("Higher Lower");

    			attr_dev(div, "class", div_class_value = "max-w-min h-full flex items-center text-sm whitespace-nowrap tracking-widest leading-6 font-semibold border-b-2 uppercase md:font-bold md:text-lg " + (/*$mode*/ ctx[0] === "GAME_MODE"
    			? 'text-gray-200 border-gray-700'
    			: 'border-yellow-400 text-gray-900'));

    			add_location(div, file$3, 5, 4, 184);
    			attr_dev(a, "href", "/");
    			add_location(a, file$3, 4, 2, 167);

    			attr_dev(nav, "class", nav_class_value = "py-4 px-3 " + (/*$mode*/ ctx[0] === "GAME_MODE"
    			? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400'
    			: ''));

    			add_location(nav, file$3, 3, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a);
    			append_dev(a, div);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$mode*/ 1 && div_class_value !== (div_class_value = "max-w-min h-full flex items-center text-sm whitespace-nowrap tracking-widest leading-6 font-semibold border-b-2 uppercase md:font-bold md:text-lg " + (/*$mode*/ ctx[0] === "GAME_MODE"
    			? 'text-gray-200 border-gray-700'
    			: 'border-yellow-400 text-gray-900'))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*$mode*/ 1 && nav_class_value !== (nav_class_value = "py-4 px-3 " + (/*$mode*/ ctx[0] === "GAME_MODE"
    			? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400'
    			: ''))) {
    				attr_dev(nav, "class", nav_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $mode;
    	validate_store(mode, 'mode');
    	component_subscribe($$self, mode, $$value => $$invalidate(0, $mode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Nav', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ mode, $mode });
    	return [$mode];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Intro.svelte generated by Svelte v3.44.2 */
    const file$2 = "src/components/Intro.svelte";

    function create_fragment$2(ctx) {
    	let div20;
    	let div2;
    	let h10;
    	let t1;
    	let div1;
    	let div0;
    	let h11;
    	let t3;
    	let div19;
    	let h2;
    	let t5;
    	let div18;
    	let ul;
    	let li0;
    	let div7;
    	let span0;
    	let t6;
    	let div6;
    	let div3;
    	let span1;
    	let svg0;
    	let path0;
    	let t7;
    	let div5;
    	let div4;
    	let p0;
    	let t9;
    	let li1;
    	let div12;
    	let span2;
    	let t10;
    	let div11;
    	let div8;
    	let span3;
    	let svg1;
    	let path1;
    	let t11;
    	let div10;
    	let div9;
    	let p1;
    	let t13;
    	let li2;
    	let div17;
    	let div16;
    	let div13;
    	let span4;
    	let svg2;
    	let path2;
    	let t14;
    	let div15;
    	let div14;
    	let p2;
    	let t16;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div20 = element("div");
    			div2 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Let's play a game. It's called";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Higher Lower";
    			t3 = space();
    			div19 = element("div");
    			h2 = element("h2");
    			h2.textContent = "The rules are simple.";
    			t5 = space();
    			div18 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			div7 = element("div");
    			span0 = element("span");
    			t6 = space();
    			div6 = element("div");
    			div3 = element("div");
    			span1 = element("span");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t7 = space();
    			div5 = element("div");
    			div4 = element("div");
    			p0 = element("p");
    			p0.textContent = "To start with, you'll be given two statements.";
    			t9 = space();
    			li1 = element("li");
    			div12 = element("div");
    			span2 = element("span");
    			t10 = space();
    			div11 = element("div");
    			div8 = element("div");
    			span3 = element("span");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t11 = space();
    			div10 = element("div");
    			div9 = element("div");
    			p1 = element("p");
    			p1.textContent = "Select and remember a statement to begin the game.";
    			t13 = space();
    			li2 = element("li");
    			div17 = element("div");
    			div16 = element("div");
    			div13 = element("div");
    			span4 = element("span");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t14 = space();
    			div15 = element("div");
    			div14 = element("div");
    			p2 = element("p");
    			p2.textContent = "Decided if subsequent statements are higher or lower.";
    			t16 = space();
    			button = element("button");
    			button.textContent = "Let's GO!";
    			attr_dev(h10, "class", "font-medium text-gray-800 text-3xl text-center");
    			add_location(h10, file$2, 8, 4, 207);
    			attr_dev(h11, "class", "font-semibold text-gray-800 text-4xl whitespace-nowrap");
    			add_location(h11, file$2, 13, 8, 427);
    			attr_dev(div0, "class", "skew-x-12");
    			add_location(div0, file$2, 12, 6, 395);
    			attr_dev(div1, "class", "bg-white py-8 px-10 md:py-4 md:px-8 transform -skew-x-12");
    			add_location(div1, file$2, 11, 4, 318);
    			attr_dev(div2, "class", "flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10");
    			add_location(div2, file$2, 5, 2, 112);
    			attr_dev(h2, "class", "text-gray-800 text-xl font-bold mb-5");
    			add_location(h2, file$2, 20, 4, 577);
    			attr_dev(span0, "class", "absolute top-4 left-2.5 -ml-px h-full w-0.5 bg-gray-200");
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$2, 25, 12, 800);
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "d", "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z");
    			attr_dev(path0, "clip-rule", "evenodd");
    			add_location(path0, file$2, 42, 18, 1500);
    			attr_dev(svg0, "class", "h-3 w-3 text-white");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 20 20");
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "aria-hidden", "true");
    			add_location(svg0, file$2, 35, 18, 1236);
    			attr_dev(span1, "class", "h-5 w-5 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white");
    			add_location(span1, file$2, 31, 16, 1031);
    			add_location(div3, file$2, 30, 14, 1009);
    			attr_dev(p0, "class", "text-md text-gray-900");
    			add_location(p0, file$2, 48, 18, 1859);
    			add_location(div4, file$2, 47, 16, 1835);
    			attr_dev(div5, "class", "min-w-0 flex-1 pt-1.5 flex justify-between space-x-4");
    			add_location(div5, file$2, 46, 14, 1752);
    			attr_dev(div6, "class", "relative flex items-center space-x-3");
    			add_location(div6, file$2, 29, 12, 944);
    			attr_dev(div7, "class", "relative pb-8");
    			add_location(div7, file$2, 24, 10, 760);
    			add_location(li0, file$2, 23, 8, 745);
    			attr_dev(span2, "class", "absolute top-4 left-2.5 -ml-px h-full w-0.5 bg-gray-200");
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$2, 58, 12, 2140);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "d", "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z");
    			attr_dev(path1, "clip-rule", "evenodd");
    			add_location(path1, file$2, 75, 18, 2840);
    			attr_dev(svg1, "class", "h-3 w-3 text-white");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 20 20");
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "aria-hidden", "true");
    			add_location(svg1, file$2, 68, 18, 2576);
    			attr_dev(span3, "class", "h-5 w-5 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white");
    			add_location(span3, file$2, 64, 16, 2371);
    			add_location(div8, file$2, 63, 14, 2349);
    			attr_dev(p1, "class", "text-md text-gray-900");
    			add_location(p1, file$2, 81, 18, 3199);
    			add_location(div9, file$2, 80, 16, 3175);
    			attr_dev(div10, "class", "min-w-0 flex-1 pt-1.5 flex justify-between space-x-4");
    			add_location(div10, file$2, 79, 14, 3092);
    			attr_dev(div11, "class", "relative flex items-center space-x-3");
    			add_location(div11, file$2, 62, 12, 2284);
    			attr_dev(div12, "class", "relative pb-8");
    			add_location(div12, file$2, 57, 10, 2100);
    			add_location(li1, file$2, 56, 8, 2085);
    			attr_dev(path2, "fill-rule", "evenodd");
    			attr_dev(path2, "d", "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z");
    			attr_dev(path2, "clip-rule", "evenodd");
    			add_location(path2, file$2, 104, 18, 4040);
    			attr_dev(svg2, "class", "h-3 w-3 text-white");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "viewBox", "0 0 20 20");
    			attr_dev(svg2, "fill", "currentColor");
    			attr_dev(svg2, "aria-hidden", "true");
    			add_location(svg2, file$2, 97, 18, 3776);
    			attr_dev(span4, "class", "h-5 w-5 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white");
    			add_location(span4, file$2, 93, 16, 3571);
    			add_location(div13, file$2, 92, 14, 3549);
    			attr_dev(p2, "class", "text-md text-gray-900");
    			add_location(p2, file$2, 110, 18, 4399);
    			add_location(div14, file$2, 109, 16, 4375);
    			attr_dev(div15, "class", "min-w-0 flex-1 pt-1.5 flex justify-between space-x-4");
    			add_location(div15, file$2, 108, 14, 4292);
    			attr_dev(div16, "class", "relative flex items-center space-x-3");
    			add_location(div16, file$2, 91, 12, 3484);
    			attr_dev(div17, "class", "relative pb-8");
    			add_location(div17, file$2, 90, 10, 3444);
    			add_location(li2, file$2, 89, 8, 3429);
    			attr_dev(ul, "role", "list");
    			attr_dev(ul, "class", "-mb-8 text-md md:text-lg");
    			add_location(ul, file$2, 22, 6, 687);
    			attr_dev(div18, "class", "flow-root");
    			add_location(div18, file$2, 21, 4, 657);
    			add_location(div19, file$2, 19, 2, 567);
    			attr_dev(button, "class", "px-5 py-2 bg-gray-100 text-gray-900 text-lg font-semibold shadow-lg rounded-sm");
    			add_location(button, file$2, 121, 2, 4658);
    			attr_dev(div20, "class", "flex flex-col items-center gap-10 py-10");
    			add_location(div20, file$2, 4, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div2);
    			append_dev(div2, h10);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h11);
    			append_dev(div20, t3);
    			append_dev(div20, div19);
    			append_dev(div19, h2);
    			append_dev(div19, t5);
    			append_dev(div19, div18);
    			append_dev(div18, ul);
    			append_dev(ul, li0);
    			append_dev(li0, div7);
    			append_dev(div7, span0);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    			append_dev(div6, div3);
    			append_dev(div3, span1);
    			append_dev(span1, svg0);
    			append_dev(svg0, path0);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, p0);
    			append_dev(ul, t9);
    			append_dev(ul, li1);
    			append_dev(li1, div12);
    			append_dev(div12, span2);
    			append_dev(div12, t10);
    			append_dev(div12, div11);
    			append_dev(div11, div8);
    			append_dev(div8, span3);
    			append_dev(span3, svg1);
    			append_dev(svg1, path1);
    			append_dev(div11, t11);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, p1);
    			append_dev(ul, t13);
    			append_dev(ul, li2);
    			append_dev(li2, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div13);
    			append_dev(div13, span4);
    			append_dev(span4, svg2);
    			append_dev(svg2, path2);
    			append_dev(div16, t14);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, p2);
    			append_dev(div20, t16);
    			append_dev(div20, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div20);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $mode;
    	validate_store(mode, 'mode');
    	component_subscribe($$self, mode, $$value => $$invalidate(0, $mode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Intro', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Intro> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		set_store_value(mode, $mode = "GAME_MODE", $mode);
    	};

    	$$self.$capture_state = () => ({ mode, $mode });
    	return [$mode, click_handler];
    }

    class Intro extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Intro",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const statements = [
        {statement: "The number of articles", number: 3887},
        {statement: "The number of links", number: 5263},
        {statement: "The number of organizations without a website", number: 1179},
        {statement: "The number of organizations without a description", number: 1639},
        {statement: "The number of organizations without a location", number: 3455},
        {statement: "The number of articles without a summary", number: 443},
        {statement: "The number of articles without a problem definition", number: 3167},
        {statement: "The number of articles without a solution", number: 3149},
        {statement: "The number of articles without an outcome", number: 3292},
        {statement: "The number of articles without additional info", number: 3412},
        {statement: "The number of articles without an url", number: 1978},
        {statement: "The number of framework elements without a description", number: 109},
        {statement: "The number of frameworks without a description", number: 11},
    ];

    /* src/components/Game.svelte generated by Svelte v3.44.2 */
    const file$1 = "src/components/Game.svelte";

    // (105:38) 
    function create_if_block_2(ctx) {
    	let div0;
    	let t0_value = /*statement*/ ctx[2].statement + "";
    	let t0;
    	let br;
    	let t1;
    	let span;
    	let t2;
    	let t3_value = /*previousNumber*/ ctx[1].toLocaleString('en') + "";
    	let t3;
    	let t4;
    	let t5;
    	let div1;
    	let button0;
    	let svg0;
    	let path0;
    	let t6;
    	let t7;
    	let button1;
    	let svg1;
    	let path1;
    	let t8;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			br = element("br");
    			t1 = space();
    			span = element("span");
    			t2 = text("(Previous: ");
    			t3 = text(t3_value);
    			t4 = text(")");
    			t5 = space();
    			div1 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t6 = text("\n                Higher");
    			t7 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t8 = text("\n                Lower");
    			add_location(br, file$1, 108, 33, 3742);
    			attr_dev(span, "class", "text-gray-400");
    			add_location(span, file$1, 109, 12, 3759);
    			attr_dev(div0, "class", "text-yellow-700 py-2 flex items-center text-lg gap-3 font-semibold");
    			add_location(div0, file$1, 105, 8, 3603);
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "d", "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z");
    			attr_dev(path0, "clip-rule", "evenodd");
    			add_location(path0, file$1, 125, 20, 4572);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "-ml-1 mr-2 h-5 w-5");
    			attr_dev(svg0, "viewBox", "0 0 20 20");
    			attr_dev(svg0, "fill", "currentColor");
    			add_location(svg0, file$1, 119, 16, 4331);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500");
    			add_location(button0, file$1, 112, 12, 3928);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "d", "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z");
    			attr_dev(path1, "clip-rule", "evenodd");
    			add_location(path1, file$1, 147, 20, 5588);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "-ml-1 mr-2 h-5 w-5");
    			attr_dev(svg1, "viewBox", "0 0 20 20");
    			attr_dev(svg1, "fill", "currentColor");
    			add_location(svg1, file$1, 141, 16, 5347);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500");
    			add_location(button1, file$1, 134, 12, 4945);
    			attr_dev(div1, "class", "px-6 py-4 flex items-center gap-20");
    			add_location(div1, file$1, 111, 8, 3867);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, br);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(button0, t6);
    			append_dev(div1, t7);
    			append_dev(div1, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(button1, t8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*statement*/ 4 && t0_value !== (t0_value = /*statement*/ ctx[2].statement + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*previousNumber*/ 2 && t3_value !== (t3_value = /*previousNumber*/ ctx[1].toLocaleString('en') + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(105:38) ",
    		ctx
    	});

    	return block;
    }

    // (68:37) 
    function create_if_block_1$1(ctx) {
    	let h1;
    	let t1;
    	let div0;
    	let t2_value = /*firstStatement*/ ctx[3].statement + "";
    	let t2;
    	let t3;
    	let button0;
    	let t5;
    	let div1;
    	let t6_value = /*secondStatement*/ ctx[4].statement + "";
    	let t6;
    	let t7;
    	let span;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Choose a statement to start.";
    			t1 = space();
    			div0 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Highest";
    			t5 = space();
    			div1 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			span = element("span");
    			button1 = element("button");
    			button1.textContent = "Highest";
    			attr_dev(h1, "class", "text-gray-900 font-bold text-2xl mb-5");
    			add_location(h1, file$1, 68, 8, 2285);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "px-4 py-3 uppercase rounded-sm text-sm font-semibold text-gray-100 bg-yellow-600");
    			add_location(button0, file$1, 75, 12, 2579);
    			attr_dev(div0, "class", "text-yellow-700 py-2 flex items-center text-lg gap-3 font-semibold w-full justify-between");
    			add_location(div0, file$1, 71, 8, 2399);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "px-4 py-3 uppercase rounded-sm text-sm font-semibold text-gray-100 bg-yellow-600");
    			add_location(button1, file$1, 93, 12, 3201);
    			attr_dev(span, "class", "ml-3 text-2xl text-gray-800 font-bold");
    			add_location(span, file$1, 91, 12, 3123);
    			attr_dev(div1, "class", "text-yellow-700 py-2 flex items-center text-lg gap-3 font-semibold w-full justify-between");
    			add_location(div1, file$1, 87, 8, 2942);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, button0);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t6);
    			append_dev(div1, t7);
    			append_dev(div1, span);
    			append_dev(span, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*firstStatement*/ 8 && t2_value !== (t2_value = /*firstStatement*/ ctx[3].statement + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*secondStatement*/ 16 && t6_value !== (t6_value = /*secondStatement*/ ctx[4].statement + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(68:37) ",
    		ctx
    	});

    	return block;
    }

    // (54:4) {#if gameOver}
    function create_if_block$1(ctx) {
    	let h10;
    	let t0;
    	let t1;
    	let t2;
    	let h11;
    	let t3;
    	let t4;
    	let t5;
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			t0 = text("Game Over! ");
    			t1 = text(/*gameOverMessage*/ ctx[5]);
    			t2 = space();
    			h11 = element("h1");
    			t3 = text("You scored: ");
    			t4 = text(/*$score*/ ctx[7]);
    			t5 = space();
    			div = element("div");
    			button = element("button");
    			button.textContent = "Home";
    			attr_dev(h10, "class", "text-gray-900 text-xl font-semibold");
    			add_location(h10, file$1, 54, 8, 1566);
    			attr_dev(h11, "class", "text-lg font-medium text-yellow-700");
    			add_location(h11, file$1, 55, 8, 1656);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500");
    			add_location(button, file$1, 57, 12, 1799);
    			attr_dev(div, "class", "px-6 py-4 flex items-center gap-20");
    			add_location(div, file$1, 56, 8, 1738);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			append_dev(h10, t0);
    			append_dev(h10, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, h11, anchor);
    			append_dev(h11, t3);
    			append_dev(h11, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*gameOverMessage*/ 32) set_data_dev(t1, /*gameOverMessage*/ ctx[5]);
    			if (dirty & /*$score*/ 128) set_data_dev(t4, /*$score*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h11);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(54:4) {#if gameOver}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*gameOver*/ ctx[6]) return create_if_block$1;
    		if (/*gameStatus*/ ctx[0] === "START") return create_if_block_1$1;
    		if (/*gameStatus*/ ctx[0] === "ACTIVE") return create_if_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "flex flex-col justify-center items-center max-w h-full py-24 mx-auto ");
    			add_location(div, file$1, 50, 0, 1446);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $score;
    	validate_store(score, 'score');
    	component_subscribe($$self, score, $$value => $$invalidate(7, $score = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Game', slots, []);
    	let gameStatus = "START";
    	let previousNumber = 0;
    	let statement = {};
    	let firstStatement = {};
    	let secondStatement = {};
    	let gameOverMessage = "";
    	let gameOver = false;
    	let gameStaments = statements;

    	function getStatement() {
    		let i = Math.floor(Math.random() * gameStaments.length + 0);
    		const statement = gameStaments[i];

    		if (gameStaments.indexOf(gameStaments[i]) > -1) {
    			gameStaments.splice(gameStaments.indexOf(gameStaments[i]), 1);
    		}

    		return statement;
    	}

    	function checkAnswer(choice) {
    		if (gameStaments <= 0) {
    			set_store_value(score, $score += 1, $score);
    			$$invalidate(6, gameOver = true);
    			$$invalidate(5, gameOverMessage = "You Won!");
    			return;
    		}

    		if (choice === "Higher" && previousNumber < statement.number || choice === "Lower" && previousNumber > statement.number) {
    			$$invalidate(1, previousNumber = statement.number);
    			set_store_value(score, $score += 1, $score);
    			$$invalidate(2, statement = getStatement());
    			return;
    		} else {
    			$$invalidate(6, gameOver = true);
    			$$invalidate(5, gameOverMessage = "Hey, better luck next time.");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		location.reload();
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, gameStatus = "ACTIVE");
    		$$invalidate(1, previousNumber = firstStatement.number);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, gameStatus = "ACTIVE");
    		$$invalidate(1, previousNumber = secondStatement.number);
    	};

    	const click_handler_3 = () => {
    		checkAnswer("Higher");
    	};

    	const click_handler_4 = () => {
    		checkAnswer("Lower");
    	};

    	$$self.$capture_state = () => ({
    		score,
    		statements,
    		gameStatus,
    		previousNumber,
    		statement,
    		firstStatement,
    		secondStatement,
    		gameOverMessage,
    		gameOver,
    		gameStaments,
    		getStatement,
    		checkAnswer,
    		$score
    	});

    	$$self.$inject_state = $$props => {
    		if ('gameStatus' in $$props) $$invalidate(0, gameStatus = $$props.gameStatus);
    		if ('previousNumber' in $$props) $$invalidate(1, previousNumber = $$props.previousNumber);
    		if ('statement' in $$props) $$invalidate(2, statement = $$props.statement);
    		if ('firstStatement' in $$props) $$invalidate(3, firstStatement = $$props.firstStatement);
    		if ('secondStatement' in $$props) $$invalidate(4, secondStatement = $$props.secondStatement);
    		if ('gameOverMessage' in $$props) $$invalidate(5, gameOverMessage = $$props.gameOverMessage);
    		if ('gameOver' in $$props) $$invalidate(6, gameOver = $$props.gameOver);
    		if ('gameStaments' in $$props) gameStaments = $$props.gameStaments;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*gameStatus*/ 1) {
    			if (gameStatus === "START") {
    				$$invalidate(3, firstStatement = getStatement());
    				$$invalidate(4, secondStatement = getStatement());
    			} else {
    				$$invalidate(2, statement = getStatement());
    			}
    		}
    	};

    	return [
    		gameStatus,
    		previousNumber,
    		statement,
    		firstStatement,
    		secondStatement,
    		gameOverMessage,
    		gameOver,
    		$score,
    		checkAnswer,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.2 */
    const file = "src/App.svelte";

    // (17:34) 
    function create_if_block_1(ctx) {
    	let game;
    	let current;
    	game = new Game({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(17:34) ",
    		ctx
    	});

    	return block;
    }

    // (15:2) {#if $mode === "INTRODUCTION_MODE"}
    function create_if_block(ctx) {
    	let intro;
    	let current;
    	intro = new Intro({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(intro.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(intro, target, anchor);
    			current = true;
    		},
    		i: function intro$1(local) {
    			if (current) return;
    			transition_in(intro.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(intro.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(intro, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(15:2) {#if $mode === \\\"INTRODUCTION_MODE\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let nav;
    	let t;
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let main_class_value;
    	let current;
    	nav = new Nav({ $$inline: true });
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$mode*/ ctx[0] === "INTRODUCTION_MODE") return 0;
    		if (/*$mode*/ ctx[0] === "GAME_MODE") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			create_component(nav.$$.fragment);
    			t = space();
    			main = element("main");
    			if (if_block) if_block.c();

    			attr_dev(main, "class", main_class_value = "min-h-screen px-10 " + (/*$mode*/ ctx[0] === 'GAME_MODE'
    			? 'bg-gray-100'
    			: 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400'));

    			add_location(main, file, 9, 0, 205);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(nav, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if (!current || dirty & /*$mode*/ 1 && main_class_value !== (main_class_value = "min-h-screen px-10 " + (/*$mode*/ ctx[0] === 'GAME_MODE'
    			? 'bg-gray-100'
    			: 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400'))) {
    				attr_dev(main, "class", main_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(nav, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $mode;
    	validate_store(mode, 'mode');
    	component_subscribe($$self, mode, $$value => $$invalidate(0, $mode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Nav, Intro, Game, mode, $mode });
    	return [$mode];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	// props: {
    	// 	name: 'world'
    	// }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
