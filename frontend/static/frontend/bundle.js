
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached if target is not <head>
        let children = target.childNodes;
        // If target is <head>, there may be children without claim_order
        if (target.nodeName === 'HEAD') {
            const myChildren = [];
            for (let i = 0; i < children.length; i++) {
                const node = children[i];
                if (node.claim_order !== undefined) {
                    myChildren.push(node);
                }
            }
            children = myChildren;
        }
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            // with fast path for when we are on the current longest subsequence
            const seqLen = ((longest > 0 && children[m[longest]].claim_order <= current) ? longest + 1 : upper_bound(1, longest, idx => children[m[idx]].claim_order, current)) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function append_hydration(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            // Skip nodes of undefined ordering
            while ((target.actual_end_child !== null) && (target.actual_end_child.claim_order === undefined)) {
                target.actual_end_child = target.actual_end_child.nextSibling;
            }
            if (node !== target.actual_end_child) {
                // We only insert if the ordering of this node should be modified or the parent node is not target
                if (node.claim_order !== undefined || node.parentNode !== target) {
                    target.insertBefore(node, target.actual_end_child);
                }
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target || node.nextSibling !== null) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function insert_hydration(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append_hydration(target, node);
        }
        else if (node.parentNode !== target || node.nextSibling != anchor) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function init_claim_info(nodes) {
        if (nodes.claim_info === undefined) {
            nodes.claim_info = { last_index: 0, total_claimed: 0 };
        }
    }
    function claim_node(nodes, predicate, processNode, createNode, dontUpdateLastIndex = false) {
        // Try to find nodes in an order such that we lengthen the longest increasing subsequence
        init_claim_info(nodes);
        const resultNode = (() => {
            // We first try to find an element after the previous one
            for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
                const node = nodes[i];
                if (predicate(node)) {
                    const replacement = processNode(node);
                    if (replacement === undefined) {
                        nodes.splice(i, 1);
                    }
                    else {
                        nodes[i] = replacement;
                    }
                    if (!dontUpdateLastIndex) {
                        nodes.claim_info.last_index = i;
                    }
                    return node;
                }
            }
            // Otherwise, we try to find one before
            // We iterate in reverse so that we don't go too far back
            for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
                const node = nodes[i];
                if (predicate(node)) {
                    const replacement = processNode(node);
                    if (replacement === undefined) {
                        nodes.splice(i, 1);
                    }
                    else {
                        nodes[i] = replacement;
                    }
                    if (!dontUpdateLastIndex) {
                        nodes.claim_info.last_index = i;
                    }
                    else if (replacement === undefined) {
                        // Since we spliced before the last_index, we decrease it
                        nodes.claim_info.last_index--;
                    }
                    return node;
                }
            }
            // If we can't find any matching node, we create a new one
            return createNode();
        })();
        resultNode.claim_order = nodes.claim_info.total_claimed;
        nodes.claim_info.total_claimed += 1;
        return resultNode;
    }
    function claim_element_base(nodes, name, attributes, create_element) {
        return claim_node(nodes, (node) => node.nodeName === name, (node) => {
            const remove = [];
            for (let j = 0; j < node.attributes.length; j++) {
                const attribute = node.attributes[j];
                if (!attributes[attribute.name]) {
                    remove.push(attribute.name);
                }
            }
            remove.forEach(v => node.removeAttribute(v));
            return undefined;
        }, () => create_element(name));
    }
    function claim_element(nodes, name, attributes) {
        return claim_element_base(nodes, name, attributes, element);
    }
    function claim_text(nodes, data) {
        return claim_node(nodes, (node) => node.nodeType === 3, (node) => {
            const dataStr = '' + data;
            if (node.data.startsWith(dataStr)) {
                if (node.data.length !== dataStr.length) {
                    return node.splitText(dataStr.length);
                }
            }
            else {
                node.data = dataStr;
            }
        }, () => text(data), true // Text nodes should not update last index since it is likely not worth it to eliminate an increasing subsequence of actual elements
        );
    }
    function claim_space(nodes) {
        return claim_text(nodes, ' ');
    }
    function find_comment(nodes, text, start) {
        for (let i = start; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeType === 8 /* comment node */ && node.textContent.trim() === text) {
                return i;
            }
        }
        return nodes.length;
    }
    function claim_html_tag(nodes) {
        // find html opening tag
        const start_index = find_comment(nodes, 'HTML_TAG_START', 0);
        const end_index = find_comment(nodes, 'HTML_TAG_END', start_index);
        if (start_index === end_index) {
            return new HtmlTagHydration();
        }
        init_claim_info(nodes);
        const html_tag_nodes = nodes.splice(start_index, end_index + 1);
        detach(html_tag_nodes[0]);
        detach(html_tag_nodes[html_tag_nodes.length - 1]);
        const claimed_nodes = html_tag_nodes.slice(1, html_tag_nodes.length - 1);
        for (const n of claimed_nodes) {
            n.claim_order = nodes.claim_info.total_claimed;
            nodes.claim_info.total_claimed += 1;
        }
        return new HtmlTagHydration(claimed_nodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }
    class HtmlTag {
        constructor() {
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }
    class HtmlTagHydration extends HtmlTag {
        constructor(claimed_nodes) {
            super();
            this.e = this.n = null;
            this.l = claimed_nodes;
        }
        c(html) {
            if (this.l) {
                this.n = this.l;
            }
            else {
                super.c(html);
            }
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert_hydration(this.t, this.n[i], anchor);
            }
        }
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function claim_component(block, parent_nodes) {
        block && block.l(parent_nodes);
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
                start_hydrating();
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
            end_hydrating();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.1' }, detail), true));
    }
    function append_hydration_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append_hydration(target, node);
    }
    function insert_hydration_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert_hydration(target, node, anchor);
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/components/IntroBox.svelte generated by Svelte v3.43.1 */
    const file$7 = "src/components/IntroBox.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (54:4) {#each tabs as tab}
    function create_each_block_1(ctx) {
    	let button;
    	let t_value = /*tab*/ ctx[7].title + "";
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*tab*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*tab*/ ctx[7].id === /*activeTab*/ ctx[1]
    			? 'tab active'
    			: 'tab') + " svelte-1azoh89"));

    			add_location(button, file$7, 54, 4, 2462);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*tabs*/ 1 && t_value !== (t_value = /*tab*/ ctx[7].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*tabs, activeTab*/ 3 && button_class_value !== (button_class_value = "" + (null_to_empty(/*tab*/ ctx[7].id === /*activeTab*/ ctx[1]
    			? 'tab active'
    			: 'tab') + " svelte-1azoh89"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(54:4) {#each tabs as tab}",
    		ctx
    	});

    	return block;
    }

    // (60:4) {#if activeTab === tab.id}
    function create_if_block$4(ctx) {
    	let div;
    	let html_tag;
    	let raw_value = /*tab*/ ctx[7].teaser + "";
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let div_id_value;
    	let div_intro;
    	let div_outro;
    	let current;
    	const if_block_creators = [create_if_block_1$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*expand*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			html_tag = new HtmlTagHydration();
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true, id: true });
    			var div_nodes = children(div);
    			html_tag = claim_html_tag(div_nodes);
    			t0 = claim_space(div_nodes);
    			if_block.l(div_nodes);
    			t1 = claim_space(div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			html_tag.a = t0;
    			attr_dev(div, "class", "box svelte-1azoh89");
    			attr_dev(div, "id", div_id_value = /*tab*/ ctx[7].title);
    			add_location(div, file$7, 60, 4, 2655);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			html_tag.m(raw_value, div);
    			append_hydration_dev(div, t0);
    			if_blocks[current_block_type_index].m(div, null);
    			append_hydration_dev(div, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*tabs*/ 1) && raw_value !== (raw_value = /*tab*/ ctx[7].teaser + "")) html_tag.p(raw_value);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, t1);
    			}

    			if (!current || dirty & /*tabs*/ 1 && div_id_value !== (div_id_value = /*tab*/ ctx[7].title)) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, slide, { delay: 500, duration: 500 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, slide, { duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(60:4) {#if activeTab === tab.id}",
    		ctx
    	});

    	return block;
    }

    // (68:8) {:else}
    function create_else_block$1(ctx) {
    	let p;
    	let button;
    	let t_value = /*tab*/ ctx[7].cta + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", {});
    			var p_nodes = children(p);
    			button = claim_element(p_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", "btn svelte-1azoh89");
    			add_location(button, file$7, 68, 11, 3020);
    			add_location(p, file$7, 68, 8, 3017);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, button);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tabs*/ 1 && t_value !== (t_value = /*tab*/ ctx[7].cta + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(68:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:8) {#if expand}
    function create_if_block_1$3(ctx) {
    	let div;
    	let html_tag;
    	let raw_value = /*tab*/ ctx[7].text + "";
    	let t0;
    	let p;
    	let button;
    	let t1;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			html_tag = new HtmlTagHydration();
    			t0 = space();
    			p = element("p");
    			button = element("button");
    			t1 = text("Lukk");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", {});
    			var div_nodes = children(div);
    			html_tag = claim_html_tag(div_nodes);
    			t0 = claim_space(div_nodes);
    			p = claim_element(div_nodes, "P", {});
    			var p_nodes = children(p);
    			button = claim_element(p_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t1 = claim_text(button_nodes, "Lukk");
    			button_nodes.forEach(detach_dev);
    			p_nodes.forEach(detach_dev);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			html_tag.a = t0;
    			attr_dev(button, "class", "btn svelte-1azoh89");
    			add_location(button, file$7, 65, 11, 2905);
    			add_location(p, file$7, 65, 8, 2902);
    			add_location(div, file$7, 63, 8, 2809);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			html_tag.m(raw_value, div);
    			append_hydration_dev(div, t0);
    			append_hydration_dev(div, p);
    			append_hydration_dev(p, button);
    			append_hydration_dev(button, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*tabs*/ 1) && raw_value !== (raw_value = /*tab*/ ctx[7].text + "")) html_tag.p(raw_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, slide, { duration: 500 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, slide, { duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(63:8) {#if expand}",
    		ctx
    	});

    	return block;
    }

    // (59:0) {#each tabs as tab}
    function create_each_block$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*activeTab*/ ctx[1] === /*tab*/ ctx[7].id && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*activeTab*/ ctx[1] === /*tab*/ ctx[7].id) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*activeTab, tabs*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(59:0) {#each tabs as tab}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let t;
    	let each1_anchor;
    	let current;
    	let each_value_1 = /*tabs*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*tabs*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].l(div_nodes);
    			}

    			div_nodes.forEach(detach_dev);
    			t = claim_space(nodes);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(nodes);
    			}

    			each1_anchor = empty();
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "tab-wrap svelte-1azoh89");
    			add_location(div, file$7, 52, 0, 2411);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			insert_hydration_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_hydration_dev(target, each1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tabs, activeTab, showTab*/ 11) {
    				each_value_1 = /*tabs*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*tabs, expand, activeTab*/ 7) {
    				each_value = /*tabs*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('IntroBox', slots, []);

    	let { tabs = [
    		{
    			id: 1,
    			title: "Forro",
    			teaser: `<h2>Klar for dans?</h2>
        <p>Forro er en lett tilgjengelig og populær dans fra Brasil. Den har blitt meget populær i Europa i løpet av de seneste årene. I Norge har ikke dansen vært så populær ennå.</p>
        <p>Mer informasjon om Forro kommer på denne siden. Her kan du bli kjent med dansen og finne arrangementer her i Oslo.</p>
        <p>Denne siden er under konstruksjon.</p>`,
    			cta: "Les mer om Forro her",
    			text: `<p>Forro danses i par</p>
            <p>Det finnes flere festivaler rundt i Europa</p>
            <iframe width="400" height="250" src="https://www.youtube.com/embed/c33sqgUUJKg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    		},
    		{
    			id: 2,
    			title: "Trinnene",
    			teaser: `<h2>Nysgjerrig på trinnene?</h2>
        <p>Forro er en pardans med en sånn og sånn rytme.</p>
        <p>Trinnene er avslappede og med mindre hoftebevegelser enn f.eks. salsa.</p>`,
    			cta: "Se trinnene",
    			text: `<p>Her får du en rask oversikt over trinnene:</p>
            <iframe width="400" height="250" src="https://www.youtube.com/embed/vudZL4_uqLo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    		},
    		{
    			id: 3,
    			title: "Musikken",
    			teaser: `<h2>Trekkspill!</h2>
    <p>Musikksjangeren Forro dreier seg stort sett om instrumentene trekkspill, tamburin og triangel.</p>
    <p>Her ser du noen kjente Forro-artister.</p>`,
    			cta: "Hør musikken",
    			text: `<p>Her kan du høre noe av musikken:</p>
            <iframe width="400" height="250" src="https://www.youtube.com/embed/a6a3gOYW2Is" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    		}
    	] } = $$props;

    	// Start with first tab open
    	let activeTab = 1;

    	function showTab(id) {
    		$$invalidate(1, activeTab = id);
    		$$invalidate(2, expand = false);
    	}

    	let expand = false;
    	const writable_props = ['tabs'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<IntroBox> was created with unknown prop '${key}'`);
    	});

    	const click_handler = tab => {
    		showTab(tab.id);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(2, expand = false);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(2, expand = true);
    	};

    	$$self.$$set = $$props => {
    		if ('tabs' in $$props) $$invalidate(0, tabs = $$props.tabs);
    	};

    	$$self.$capture_state = () => ({ slide, tabs, activeTab, showTab, expand });

    	$$self.$inject_state = $$props => {
    		if ('tabs' in $$props) $$invalidate(0, tabs = $$props.tabs);
    		if ('activeTab' in $$props) $$invalidate(1, activeTab = $$props.activeTab);
    		if ('expand' in $$props) $$invalidate(2, expand = $$props.expand);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tabs,
    		activeTab,
    		expand,
    		showTab,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class IntroBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { tabs: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IntroBox",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get tabs() {
    		throw new Error("<IntroBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<IntroBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Language.svelte generated by Svelte v3.43.1 */
    const file$6 = "src/components/Language.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (23:4) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("X");
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { style: true, class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, "X");
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			set_style(button, "opacity", "0");
    			attr_dev(button, "class", "svelte-10cmvjs");
    			add_location(button, file$6, 23, 4, 564);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(23:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:4) {#if translations.length != 0}
    function create_if_block$3(ctx) {
    	let t0;
    	let button;
    	let t1;
    	let mounted;
    	let dispose;
    	let each_value = /*translations*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			button = element("button");
    			t1 = text("X");
    			this.h();
    		},
    		l: function claim(nodes) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(nodes);
    			}

    			t0 = claim_space(nodes);
    			button = claim_element(nodes, "BUTTON", { style: true, class: true });
    			var button_nodes = children(button);
    			t1 = claim_text(button_nodes, "X");
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			set_style(button, "color", "red");
    			attr_dev(button, "class", "svelte-10cmvjs");
    			add_location(button, file$6, 21, 4, 487);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_hydration_dev(target, t0, anchor);
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*revertLang*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*changeLang, translations*/ 3) {
    				each_value = /*translations*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t0.parentNode, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(18:4) {#if translations.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#each translations as trans}
    function create_each_block$2(ctx) {
    	let button;
    	let t_value = /*trans*/ ctx[4].lang + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", "svelte-10cmvjs");
    			add_location(button, file$6, 19, 4, 396);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					stop_propagation(function () {
    						if (is_function(/*changeLang*/ ctx[1](/*trans*/ ctx[4]))) /*changeLang*/ ctx[1](/*trans*/ ctx[4]).apply(this, arguments);
    					}),
    					false,
    					false,
    					true
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*translations*/ 1 && t_value !== (t_value = /*trans*/ ctx[4].lang + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(19:4) {#each translations as trans}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*translations*/ ctx[0].length != 0) return create_if_block$3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			if_block.l(div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "container svelte-10cmvjs");
    			add_location(div, file$6, 16, 0, 299);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

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
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Language', slots, []);
    	let { translations = [] } = $$props;
    	const dispatch = createEventDispatcher();

    	function changeLang(text) {
    		dispatch("changeLang", text);
    	}

    	function revertLang() {
    		dispatch("revertLang", {});
    	}

    	const writable_props = ['translations'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Language> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('translations' in $$props) $$invalidate(0, translations = $$props.translations);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		translations,
    		dispatch,
    		changeLang,
    		revertLang
    	});

    	$$self.$inject_state = $$props => {
    		if ('translations' in $$props) $$invalidate(0, translations = $$props.translations);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [translations, changeLang, revertLang];
    }

    class Language extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { translations: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Language",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get translations() {
    		throw new Error("<Language>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translations(value) {
    		throw new Error("<Language>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Map.svelte generated by Svelte v3.43.1 */

    const file$5 = "src/components/Map.svelte";

    function create_fragment$5(ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			this.h();
    		},
    		l: function claim(nodes) {
    			iframe = claim_element(nodes, "IFRAME", {
    				title: true,
    				width: true,
    				height: true,
    				style: true,
    				loading: true,
    				src: true
    			});

    			var iframe_nodes = children(iframe);
    			iframe_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(iframe, "title", "map");
    			attr_dev(iframe, "width", "200");
    			attr_dev(iframe, "height", "200");
    			set_style(iframe, "border", "0");
    			attr_dev(iframe, "loading", "lazy");
    			iframe.allowFullscreen = true;
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://www.google.com/maps/embed/v1/place?key=AIzaSyAuhsOpwBdUmjiiDSDRnXZZOSHPhG9YD1s\n  &q=" + /*adress*/ ctx[0] + ", Oslo+No")) attr_dev(iframe, "src", iframe_src_value);
    			add_location(iframe, file$5, 5, 0, 54);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*adress*/ 1 && !src_url_equal(iframe.src, iframe_src_value = "https://www.google.com/maps/embed/v1/place?key=AIzaSyAuhsOpwBdUmjiiDSDRnXZZOSHPhG9YD1s\n  &q=" + /*adress*/ ctx[0] + ", Oslo+No")) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Map', slots, []);
    	let { adress = "Uhørt" } = $$props;
    	const writable_props = ['adress'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('adress' in $$props) $$invalidate(0, adress = $$props.adress);
    	};

    	$$self.$capture_state = () => ({ adress });

    	$$self.$inject_state = $$props => {
    		if ('adress' in $$props) $$invalidate(0, adress = $$props.adress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [adress];
    }

    class Map$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { adress: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get adress() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set adress(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Event.svelte generated by Svelte v3.43.1 */
    const file$4 = "src/components/Event.svelte";

    // (57:4) {#if overlay}
    function create_if_block_6(ctx) {
    	let div;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("❌ LUKK");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			t = claim_text(div_nodes, "❌ LUKK");
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "exit-btn svelte-1nbb9i3");
    			add_location(div, file$4, 57, 4, 1641);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			append_hydration_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", stop_propagation(/*click_handler*/ ctx[14]), false, false, true);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(57:4) {#if overlay}",
    		ctx
    	});

    	return block;
    }

    // (66:12) {#if overlay}
    function create_if_block_5(ctx) {
    	let div;
    	let language;
    	let current;

    	language = new Language({
    			props: { translations: /*translations*/ ctx[9] },
    			$$inline: true
    		});

    	language.$on("changeLang", /*changeLang*/ ctx[10]);
    	language.$on("revertLang", /*revertLang*/ ctx[11]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(language.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			claim_component(language.$$.fragment, div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "lang-menu");
    			add_location(div, file$4, 66, 12, 1955);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			mount_component(language, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(language.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(language.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(language);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(66:12) {#if overlay}",
    		ctx
    	});

    	return block;
    }

    // (71:16) {#if !upcoming}
    function create_if_block_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Arkiv: ");
    		},
    		l: function claim(nodes) {
    			t = claim_text(nodes, "Arkiv: ");
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(71:16) {#if !upcoming}",
    		ctx
    	});

    	return block;
    }

    // (78:12) {#if overlay}
    function create_if_block_3(ctx) {
    	let button;
    	let t0;
    	let t1;
    	let div;
    	let map_1;
    	let current;
    	let mounted;
    	let dispose;

    	map_1 = new Map$1({
    			props: { adress: /*where*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Onde?");
    			t1 = space();
    			div = element("div");
    			create_component(map_1.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t0 = claim_text(button_nodes, "Onde?");
    			button_nodes.forEach(detach_dev);
    			t1 = claim_space(nodes);
    			div = claim_element(nodes, "DIV", { style: true });
    			var div_nodes = children(div);
    			claim_component(map_1.$$.fragment, div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", "btn svelte-1nbb9i3");
    			add_location(button, file$4, 78, 12, 2373);
    			set_style(div, "display", /*map*/ ctx[4] ? 'block' : 'none');
    			add_location(div, file$4, 79, 12, 2457);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t0);
    			insert_hydration_dev(target, t1, anchor);
    			insert_hydration_dev(target, div, anchor);
    			mount_component(map_1, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", stop_propagation(/*toggleMap*/ ctx[12]), false, false, true);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*map*/ 16) {
    				set_style(div, "display", /*map*/ ctx[4] ? 'block' : 'none');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_component(map_1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(78:12) {#if overlay}",
    		ctx
    	});

    	return block;
    }

    // (86:8) {#if overlay}
    function create_if_block$2(ctx) {
    	let previous_key = /*description*/ ctx[2];
    	let key_block_anchor;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			key_block.l(nodes);
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_hydration_dev(target, key_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*description*/ 4 && safe_not_equal(previous_key, previous_key = /*description*/ ctx[2])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			transition_in(key_block);
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(86:8) {#if overlay}",
    		ctx
    	});

    	return block;
    }

    // (91:12) {#if !upcoming}
    function create_if_block_2$1(ctx) {
    	let p;
    	let strong;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			t = text("Obs! Se datoen, vi er ferdige med dette arrangementet!");
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", { class: true });
    			var p_nodes = children(p);
    			strong = claim_element(p_nodes, "STRONG", {});
    			var strong_nodes = children(strong);
    			t = claim_text(strong_nodes, "Obs! Se datoen, vi er ferdige med dette arrangementet!");
    			strong_nodes.forEach(detach_dev);
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(strong, file$4, 91, 15, 2809);
    			attr_dev(p, "class", "svelte-1nbb9i3");
    			add_location(p, file$4, 91, 12, 2806);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, strong);
    			append_hydration_dev(strong, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(91:12) {#if !upcoming}",
    		ctx
    	});

    	return block;
    }

    // (94:12) {#if fbevent}
    function create_if_block_1$2(ctx) {
    	let p;
    	let strong;
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			a = element("a");
    			t = text(">>> Facebook");
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", { class: true });
    			var p_nodes = children(p);
    			strong = claim_element(p_nodes, "STRONG", {});
    			var strong_nodes = children(strong);
    			a = claim_element(strong_nodes, "A", { href: true });
    			var a_nodes = children(a);
    			t = claim_text(a_nodes, ">>> Facebook");
    			a_nodes.forEach(detach_dev);
    			strong_nodes.forEach(detach_dev);
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(a, "href", /*fbevent*/ ctx[7]);
    			add_location(a, file$4, 94, 23, 2952);
    			add_location(strong, file$4, 94, 15, 2944);
    			attr_dev(p, "class", "svelte-1nbb9i3");
    			add_location(p, file$4, 94, 12, 2941);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, strong);
    			append_hydration_dev(strong, a);
    			append_hydration_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(94:12) {#if fbevent}",
    		ctx
    	});

    	return block;
    }

    // (87:8) {#key description}
    function create_key_block(ctx) {
    	let div;
    	let h4;
    	let t0;
    	let t1;
    	let html_tag;
    	let t2;
    	let t3;
    	let div_intro;
    	let if_block0 = !/*upcoming*/ ctx[8] && create_if_block_2$1(ctx);
    	let if_block1 = /*fbevent*/ ctx[7] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			t0 = text("Info:");
    			t1 = space();
    			html_tag = new HtmlTagHydration();
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			h4 = claim_element(div_nodes, "H4", {});
    			var h4_nodes = children(h4);
    			t0 = claim_text(h4_nodes, "Info:");
    			h4_nodes.forEach(detach_dev);
    			t1 = claim_space(div_nodes);
    			html_tag = claim_html_tag(div_nodes);
    			t2 = claim_space(div_nodes);
    			if (if_block0) if_block0.l(div_nodes);
    			t3 = claim_space(div_nodes);
    			if (if_block1) if_block1.l(div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h4, file$4, 88, 12, 2719);
    			html_tag.a = t2;
    			attr_dev(div, "class", "textbox svelte-1nbb9i3");
    			add_location(div, file$4, 87, 8, 2663);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			append_hydration_dev(div, h4);
    			append_hydration_dev(h4, t0);
    			append_hydration_dev(div, t1);
    			html_tag.m(/*description*/ ctx[2], div);
    			append_hydration_dev(div, t2);
    			if (if_block0) if_block0.m(div, null);
    			append_hydration_dev(div, t3);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*description*/ 4) html_tag.p(/*description*/ ctx[2]);
    			if (/*fbevent*/ ctx[7]) if_block1.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { delay: 300 });
    					div_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(87:8) {#key description}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div4;
    	let t0;
    	let div3;
    	let div1;
    	let t1;
    	let h3;
    	let t2;
    	let t3;
    	let div0;
    	let p0;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let t7;
    	let p2;
    	let t8;
    	let t9;
    	let p3;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let div2;
    	let img_1;
    	let img_1_src_value;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*overlay*/ ctx[3] && create_if_block_6(ctx);
    	let if_block1 = /*overlay*/ ctx[3] && create_if_block_5(ctx);
    	let if_block2 = !/*upcoming*/ ctx[8] && create_if_block_4(ctx);
    	let if_block3 = /*overlay*/ ctx[3] && create_if_block_3(ctx);
    	let if_block4 = /*overlay*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			h3 = element("h3");
    			if (if_block2) if_block2.c();
    			t2 = text(/*title*/ ctx[0]);
    			t3 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t4 = text("🌎");
    			t5 = space();
    			p1 = element("p");
    			t6 = text(/*where*/ ctx[5]);
    			t7 = space();
    			p2 = element("p");
    			t8 = text("🕔");
    			t9 = space();
    			p3 = element("p");
    			t10 = text(/*when*/ ctx[1]);
    			t11 = space();
    			if (if_block3) if_block3.c();
    			t12 = space();
    			if (if_block4) if_block4.c();
    			t13 = space();
    			div2 = element("div");
    			img_1 = element("img");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div4 = claim_element(nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			if (if_block0) if_block0.l(div4_nodes);
    			t0 = claim_space(div4_nodes);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div1 = claim_element(div3_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			if (if_block1) if_block1.l(div1_nodes);
    			t1 = claim_space(div1_nodes);
    			h3 = claim_element(div1_nodes, "H3", { class: true });
    			var h3_nodes = children(h3);
    			if (if_block2) if_block2.l(h3_nodes);
    			t2 = claim_text(h3_nodes, /*title*/ ctx[0]);
    			h3_nodes.forEach(detach_dev);
    			t3 = claim_space(div1_nodes);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p0 = claim_element(div0_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t4 = claim_text(p0_nodes, "🌎");
    			p0_nodes.forEach(detach_dev);
    			t5 = claim_space(div0_nodes);
    			p1 = claim_element(div0_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t6 = claim_text(p1_nodes, /*where*/ ctx[5]);
    			p1_nodes.forEach(detach_dev);
    			t7 = claim_space(div0_nodes);
    			p2 = claim_element(div0_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t8 = claim_text(p2_nodes, "🕔");
    			p2_nodes.forEach(detach_dev);
    			t9 = claim_space(div0_nodes);
    			p3 = claim_element(div0_nodes, "P", { class: true });
    			var p3_nodes = children(p3);
    			t10 = claim_text(p3_nodes, /*when*/ ctx[1]);
    			p3_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t11 = claim_space(div1_nodes);
    			if (if_block3) if_block3.l(div1_nodes);
    			div1_nodes.forEach(detach_dev);
    			t12 = claim_space(div3_nodes);
    			if (if_block4) if_block4.l(div3_nodes);
    			t13 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			img_1 = claim_element(div2_nodes, "IMG", { src: true, alt: true });
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h3, "class", "svelte-1nbb9i3");
    			add_location(h3, file$4, 70, 12, 2125);
    			attr_dev(p0, "class", "svelte-1nbb9i3");
    			add_location(p0, file$4, 72, 16, 2219);
    			attr_dev(p1, "class", "svelte-1nbb9i3");
    			add_location(p1, file$4, 73, 16, 2245);
    			attr_dev(p2, "class", "svelte-1nbb9i3");
    			add_location(p2, file$4, 74, 16, 2276);
    			attr_dev(p3, "class", "svelte-1nbb9i3");
    			add_location(p3, file$4, 75, 16, 2302);
    			attr_dev(div0, "class", "infobox svelte-1nbb9i3");
    			add_location(div0, file$4, 71, 12, 2181);
    			attr_dev(div1, "class", "card-header svelte-1nbb9i3");
    			add_location(div1, file$4, 64, 8, 1891);
    			if (!src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[6].src)) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", /*img*/ ctx[6].alt);
    			add_location(img_1, file$4, 101, 12, 3107);
    			attr_dev(div2, "class", "image-box svelte-1nbb9i3");
    			add_location(div2, file$4, 100, 8, 3071);
    			attr_dev(div3, "class", "card svelte-1nbb9i3");
    			toggle_class(div3, "upcoming", !/*upcoming*/ ctx[8]);
    			toggle_class(div3, "selected", /*overlay*/ ctx[3]);
    			add_location(div3, file$4, 59, 4, 1741);
    			attr_dev(div4, "class", "wrapper svelte-1nbb9i3");
    			toggle_class(div4, "overlay", /*overlay*/ ctx[3]);
    			add_location(div4, file$4, 55, 0, 1548);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div4, anchor);
    			if (if_block0) if_block0.m(div4, null);
    			append_hydration_dev(div4, t0);
    			append_hydration_dev(div4, div3);
    			append_hydration_dev(div3, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_hydration_dev(div1, t1);
    			append_hydration_dev(div1, h3);
    			if (if_block2) if_block2.m(h3, null);
    			append_hydration_dev(h3, t2);
    			append_hydration_dev(div1, t3);
    			append_hydration_dev(div1, div0);
    			append_hydration_dev(div0, p0);
    			append_hydration_dev(p0, t4);
    			append_hydration_dev(div0, t5);
    			append_hydration_dev(div0, p1);
    			append_hydration_dev(p1, t6);
    			append_hydration_dev(div0, t7);
    			append_hydration_dev(div0, p2);
    			append_hydration_dev(p2, t8);
    			append_hydration_dev(div0, t9);
    			append_hydration_dev(div0, p3);
    			append_hydration_dev(p3, t10);
    			append_hydration_dev(div1, t11);
    			if (if_block3) if_block3.m(div1, null);
    			append_hydration_dev(div3, t12);
    			if (if_block4) if_block4.m(div3, null);
    			append_hydration_dev(div3, t13);
    			append_hydration_dev(div3, div2);
    			append_hydration_dev(div2, img_1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div4, "click", /*click_handler_1*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*overlay*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					if_block0.m(div4, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*overlay*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*overlay*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*title*/ 1) set_data_dev(t2, /*title*/ ctx[0]);
    			if (!current || dirty & /*when*/ 2) set_data_dev(t10, /*when*/ ctx[1]);

    			if (/*overlay*/ ctx[3]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*overlay*/ 8) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_3(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*overlay*/ ctx[3]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*overlay*/ 8) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$2(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div3, t13);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (dirty & /*overlay*/ 8) {
    				toggle_class(div3, "selected", /*overlay*/ ctx[3]);
    			}

    			if (dirty & /*overlay*/ 8) {
    				toggle_class(div4, "overlay", /*overlay*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block3);
    			transition_in(if_block4);

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fly, { x: 400, duration: 500 }, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block3);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fly, { x: 400, duration: 500 }, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event', slots, []);

    	let { event = {
    		title: "Tittel",
    		where: "Address",
    		when: "01.02.04 10:00",
    		fbevent: "",
    		upcoming: false,
    		img: {
    			src: "image.jpeg",
    			alt: "Alternativ tekst"
    		},
    		description: "Ta med danseskoene og kom!",
    		translations: [
    			{
    				lang: "en",
    				title: "Title",
    				description: "Bring your dancing shoes!!"
    			},
    			{
    				lang: "po",
    				title: "Título",
    				description: "Traga seus sapatos de dança!"
    			}
    		]
    	} } = $$props;

    	let { title, where, when, img, description, fbevent, upcoming } = event;

    	when = new Date(when).toLocaleString("no-NO", {
    		day: 'numeric',
    		month: 'long',
    		hour: 'numeric',
    		minute: 'numeric',
    		year: 'numeric'
    	});

    	let translations = event.translations;
    	let overlay = false;

    	function changeLang(e) {
    		$$invalidate(0, title = e.detail.title);
    		$$invalidate(2, description = e.detail.description);
    	}

    	function revertLang() {
    		$$invalidate(0, title = event.title);
    		$$invalidate(2, description = event.description);
    	}

    	let map = false;

    	function toggleMap() {
    		$$invalidate(4, map = !map);
    	}

    	const writable_props = ['event'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(3, overlay = false);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(3, overlay = true);
    	};

    	$$self.$$set = $$props => {
    		if ('event' in $$props) $$invalidate(13, event = $$props.event);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		Language,
    		Map: Map$1,
    		event,
    		title,
    		where,
    		when,
    		img,
    		description,
    		fbevent,
    		upcoming,
    		translations,
    		overlay,
    		changeLang,
    		revertLang,
    		map,
    		toggleMap
    	});

    	$$self.$inject_state = $$props => {
    		if ('event' in $$props) $$invalidate(13, event = $$props.event);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('where' in $$props) $$invalidate(5, where = $$props.where);
    		if ('when' in $$props) $$invalidate(1, when = $$props.when);
    		if ('img' in $$props) $$invalidate(6, img = $$props.img);
    		if ('description' in $$props) $$invalidate(2, description = $$props.description);
    		if ('fbevent' in $$props) $$invalidate(7, fbevent = $$props.fbevent);
    		if ('upcoming' in $$props) $$invalidate(8, upcoming = $$props.upcoming);
    		if ('translations' in $$props) $$invalidate(9, translations = $$props.translations);
    		if ('overlay' in $$props) $$invalidate(3, overlay = $$props.overlay);
    		if ('map' in $$props) $$invalidate(4, map = $$props.map);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		title,
    		when,
    		description,
    		overlay,
    		map,
    		where,
    		img,
    		fbevent,
    		upcoming,
    		translations,
    		changeLang,
    		revertLang,
    		toggleMap,
    		event,
    		click_handler,
    		click_handler_1
    	];
    }

    class Event extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { event: 13 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get event() {
    		throw new Error("<Event>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set event(value) {
    		throw new Error("<Event>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/EventFrame.svelte generated by Svelte v3.43.1 */
    const file$3 = "src/components/EventFrame.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (74:4) {#if showAll}
    function create_if_block_1$1(ctx) {
    	let input;
    	let label;
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = /*sortedEvents*/ ctx[2].length + "";
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			label = element("label");
    			t0 = text("Viser ");
    			t1 = text(/*items*/ ctx[1]);
    			t2 = text(" av ");
    			t3 = text(t3_value);
    			t4 = text(" arrangementer.");
    			this.h();
    		},
    		l: function claim(nodes) {
    			input = claim_element(nodes, "INPUT", { type: true, id: true, max: true });
    			label = claim_element(nodes, "LABEL", { for: true, class: true });
    			var label_nodes = children(label);
    			t0 = claim_text(label_nodes, "Viser ");
    			t1 = claim_text(label_nodes, /*items*/ ctx[1]);
    			t2 = claim_text(label_nodes, " av ");
    			t3 = claim_text(label_nodes, t3_value);
    			t4 = claim_text(label_nodes, " arrangementer.");
    			label_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(input, "type", "range");
    			attr_dev(input, "id", "itemsrange");
    			attr_dev(input, "max", /*sortedEvents*/ ctx[2].length);
    			add_location(input, file$3, 74, 4, 1975);
    			attr_dev(label, "for", "itemsrange");
    			attr_dev(label, "class", "svelte-1c9b24h");
    			add_location(label, file$3, 74, 85, 2056);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, input, anchor);
    			set_input_value(input, /*items*/ ctx[1]);
    			insert_hydration_dev(target, label, anchor);
    			append_hydration_dev(label, t0);
    			append_hydration_dev(label, t1);
    			append_hydration_dev(label, t2);
    			append_hydration_dev(label, t3);
    			append_hydration_dev(label, t4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2) {
    				set_input_value(input, /*items*/ ctx[1]);
    			}

    			if (dirty & /*items*/ 2) set_data_dev(t1, /*items*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(label);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(74:4) {#if showAll}",
    		ctx
    	});

    	return block;
    }

    // (81:8) {#if (showAll && i < items) || (!showAll && event.upcoming === true)}
    function create_if_block$1(ctx) {
    	let event;
    	let current;

    	event = new Event({
    			props: { event: /*event*/ ctx[8] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(event.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(event.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(event, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(event.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(event.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(event, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(81:8) {#if (showAll && i < items) || (!showAll && event.upcoming === true)}",
    		ctx
    	});

    	return block;
    }

    // (80:4) {#each sortedEvents as event, i (event.id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = (/*showAll*/ ctx[0] && /*i*/ ctx[10] < /*items*/ ctx[1] || !/*showAll*/ ctx[0] && /*event*/ ctx[8].upcoming === true) && create_if_block$1(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.h();
    		},
    		l: function claim(nodes) {
    			first = empty();
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    			this.h();
    		},
    		h: function hydrate() {
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*showAll*/ ctx[0] && /*i*/ ctx[10] < /*items*/ ctx[1] || !/*showAll*/ ctx[0] && /*event*/ ctx[8].upcoming === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showAll, items*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(80:4) {#each sortedEvents as event, i (event.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let h2;
    	let t0;
    	let t1_value = (/*showAll*/ ctx[0] ? "alle" : "kommende") + "";
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let input;
    	let label;
    	let t4;
    	let t5;
    	let t6;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showAll*/ ctx[0] && create_if_block_1$1(ctx);
    	let each_value = /*sortedEvents*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*event*/ ctx[8].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("Se ");
    			t1 = text(t1_value);
    			t2 = text(" arrangementer -->");
    			t3 = space();
    			div0 = element("div");
    			input = element("input");
    			label = element("label");
    			t4 = text("(se alle)");
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.h();
    		},
    		l: function claim(nodes) {
    			h2 = claim_element(nodes, "H2", {});
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Se ");
    			t1 = claim_text(h2_nodes, t1_value);
    			t2 = claim_text(h2_nodes, " arrangementer -->");
    			h2_nodes.forEach(detach_dev);
    			t3 = claim_space(nodes);
    			div0 = claim_element(nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			input = claim_element(div0_nodes, "INPUT", { type: true, id: true, class: true });
    			label = claim_element(div0_nodes, "LABEL", { for: true, class: true });
    			var label_nodes = children(label);
    			t4 = claim_text(label_nodes, "(se alle)");
    			label_nodes.forEach(detach_dev);
    			t5 = claim_space(div0_nodes);
    			if (if_block) if_block.l(div0_nodes);
    			div0_nodes.forEach(detach_dev);
    			t6 = claim_space(nodes);
    			div1 = claim_element(nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(div1_nodes);
    			}

    			div1_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h2, file$3, 69, 0, 1763);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "allcheck");
    			attr_dev(input, "class", "svelte-1c9b24h");
    			add_location(input, file$3, 72, 4, 1853);
    			attr_dev(label, "for", "allcheck");
    			attr_dev(label, "class", "svelte-1c9b24h");
    			add_location(label, file$3, 72, 64, 1913);
    			attr_dev(div0, "class", "controls svelte-1c9b24h");
    			add_location(div0, file$3, 71, 0, 1826);
    			attr_dev(div1, "class", "container svelte-1c9b24h");
    			add_location(div1, file$3, 78, 0, 2160);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, h2, anchor);
    			append_hydration_dev(h2, t0);
    			append_hydration_dev(h2, t1);
    			append_hydration_dev(h2, t2);
    			insert_hydration_dev(target, t3, anchor);
    			insert_hydration_dev(target, div0, anchor);
    			append_hydration_dev(div0, input);
    			input.checked = /*showAll*/ ctx[0];
    			append_hydration_dev(div0, label);
    			append_hydration_dev(label, t4);
    			append_hydration_dev(div0, t5);
    			if (if_block) if_block.m(div0, null);
    			insert_hydration_dev(target, t6, anchor);
    			insert_hydration_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*showAll*/ 1) && t1_value !== (t1_value = (/*showAll*/ ctx[0] ? "alle" : "kommende") + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*showAll*/ 1) {
    				input.checked = /*showAll*/ ctx[0];
    			}

    			if (/*showAll*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*sortedEvents, showAll, items*/ 7) {
    				each_value = /*sortedEvents*/ ctx[2];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EventFrame', slots, []);

    	let { events = [
    		{
    			title: "Tittel",
    			where: "Address",
    			when: "01.02.04 10:00",
    			img: {
    				src: "image.jpeg",
    				alt: "Alternativ tekst"
    			},
    			description: "Ta med danseskoene og kom!",
    			fbevent: "",
    			translations: [
    				{
    					lang: "en",
    					title: "Title",
    					description: "Bring your dancing shoes!!"
    				},
    				{
    					lang: "po",
    					title: "Título",
    					description: "Traga seus sapatos de dança!"
    				}
    			]
    		}
    	] } = $$props;

    	let numberOfUpcoming = 0;

    	// Checks whether the event is in the past or future.
    	function findUpcoming(array) {
    		let today = new Date();

    		return array.map(el => {
    			if (today <= new Date(el.when)) {
    				numberOfUpcoming++;
    				el.upcoming = true;
    				return el;
    			} else {
    				el.upcoming = false;
    				return el;
    			}
    		});
    	}

    	
    	let sortedEvents = findUpcoming(events);

    	// Sort the array so that the upcoming events are first.
    	sortedEvents.sort((a, b) => {
    		if (a.upcoming && b.upcoming) {
    			return 0;
    		}

    		if (a.upcoming && !b.upcoming) {
    			return -1;
    		}

    		if (!a.upcoming && b.upcoming) {
    			return 1;
    		}
    	});

    	let showAll = false;
    	let items = numberOfUpcoming;
    	const writable_props = ['events'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EventFrame> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		showAll = this.checked;
    		$$invalidate(0, showAll);
    	}

    	function input_change_input_handler() {
    		items = to_number(this.value);
    		$$invalidate(1, items);
    	}

    	$$self.$$set = $$props => {
    		if ('events' in $$props) $$invalidate(3, events = $$props.events);
    	};

    	$$self.$capture_state = () => ({
    		Event,
    		events,
    		numberOfUpcoming,
    		findUpcoming,
    		sortedEvents,
    		showAll,
    		items
    	});

    	$$self.$inject_state = $$props => {
    		if ('events' in $$props) $$invalidate(3, events = $$props.events);
    		if ('numberOfUpcoming' in $$props) numberOfUpcoming = $$props.numberOfUpcoming;
    		if ('sortedEvents' in $$props) $$invalidate(2, sortedEvents = $$props.sortedEvents);
    		if ('showAll' in $$props) $$invalidate(0, showAll = $$props.showAll);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showAll,
    		items,
    		sortedEvents,
    		events,
    		input_change_handler,
    		input_change_input_handler
    	];
    }

    class EventFrame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { events: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EventFrame",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get events() {
    		throw new Error("<EventFrame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set events(value) {
    		throw new Error("<EventFrame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Post.svelte generated by Svelte v3.43.1 */

    const file$2 = "src/components/Post.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let p0;
    	let small;
    	let t0;
    	let t1;
    	let t2;
    	let img_1;
    	let img_1_src_value;
    	let img_1_alt_value;
    	let t3;
    	let h2;
    	let t4;
    	let t5;
    	let html_tag;
    	let t6;
    	let p1;
    	let a;
    	let t7;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			small = element("small");
    			t0 = text("Postet: ");
    			t1 = text(/*time*/ ctx[4]);
    			t2 = space();
    			img_1 = element("img");
    			t3 = space();
    			h2 = element("h2");
    			t4 = text(/*title*/ ctx[1]);
    			t5 = space();
    			html_tag = new HtmlTagHydration();
    			t6 = space();
    			p1 = element("p");
    			a = element("a");
    			t7 = text("Les mer");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			p0 = claim_element(div_nodes, "P", {});
    			var p0_nodes = children(p0);
    			small = claim_element(p0_nodes, "SMALL", {});
    			var small_nodes = children(small);
    			t0 = claim_text(small_nodes, "Postet: ");
    			t1 = claim_text(small_nodes, /*time*/ ctx[4]);
    			small_nodes.forEach(detach_dev);
    			p0_nodes.forEach(detach_dev);
    			t2 = claim_space(div_nodes);
    			img_1 = claim_element(div_nodes, "IMG", { src: true, alt: true, class: true });
    			t3 = claim_space(div_nodes);
    			h2 = claim_element(div_nodes, "H2", {});
    			var h2_nodes = children(h2);
    			t4 = claim_text(h2_nodes, /*title*/ ctx[1]);
    			h2_nodes.forEach(detach_dev);
    			t5 = claim_space(div_nodes);
    			html_tag = claim_html_tag(div_nodes);
    			t6 = claim_space(div_nodes);
    			p1 = claim_element(div_nodes, "P", {});
    			var p1_nodes = children(p1);
    			a = claim_element(p1_nodes, "A", { href: true });
    			var a_nodes = children(a);
    			t7 = claim_text(a_nodes, "Les mer");
    			a_nodes.forEach(detach_dev);
    			p1_nodes.forEach(detach_dev);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(small, file$2, 19, 3, 368);
    			add_location(p0, file$2, 19, 0, 365);
    			if (!src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[3].src)) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", img_1_alt_value = /*img*/ ctx[3].alt);
    			attr_dev(img_1, "class", "svelte-1yc2abm");
    			add_location(img_1, file$2, 20, 0, 402);
    			add_location(h2, file$2, 21, 0, 436);
    			html_tag.a = t6;
    			attr_dev(a, "href", a_href_value = "blogg/" + /*id*/ ctx[0]);
    			add_location(a, file$2, 23, 3, 472);
    			add_location(p1, file$2, 23, 0, 469);
    			attr_dev(div, "class", "container");
    			add_location(div, file$2, 18, 0, 341);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			append_hydration_dev(div, p0);
    			append_hydration_dev(p0, small);
    			append_hydration_dev(small, t0);
    			append_hydration_dev(small, t1);
    			append_hydration_dev(div, t2);
    			append_hydration_dev(div, img_1);
    			append_hydration_dev(div, t3);
    			append_hydration_dev(div, h2);
    			append_hydration_dev(h2, t4);
    			append_hydration_dev(div, t5);
    			html_tag.m(/*ingress*/ ctx[2], div);
    			append_hydration_dev(div, t6);
    			append_hydration_dev(div, p1);
    			append_hydration_dev(p1, a);
    			append_hydration_dev(a, t7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*time*/ 16) set_data_dev(t1, /*time*/ ctx[4]);

    			if (dirty & /*img*/ 8 && !src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[3].src)) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*img*/ 8 && img_1_alt_value !== (img_1_alt_value = /*img*/ ctx[3].alt)) {
    				attr_dev(img_1, "alt", img_1_alt_value);
    			}

    			if (dirty & /*title*/ 2) set_data_dev(t4, /*title*/ ctx[1]);
    			if (dirty & /*ingress*/ 4) html_tag.p(/*ingress*/ ctx[2]);

    			if (dirty & /*id*/ 1 && a_href_value !== (a_href_value = "blogg/" + /*id*/ ctx[0])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let time;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Post', slots, []);
    	let { id = 0 } = $$props;
    	let { title = "Tittel" } = $$props;
    	let { ingress = "Ingress" } = $$props;
    	let { date = "" } = $$props;
    	let { img = { src: "", alt: "" } } = $$props;
    	const writable_props = ['id', 'title', 'ingress', 'date', 'img'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('ingress' in $$props) $$invalidate(2, ingress = $$props.ingress);
    		if ('date' in $$props) $$invalidate(5, date = $$props.date);
    		if ('img' in $$props) $$invalidate(3, img = $$props.img);
    	};

    	$$self.$capture_state = () => ({ id, title, ingress, date, img, time });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('ingress' in $$props) $$invalidate(2, ingress = $$props.ingress);
    		if ('date' in $$props) $$invalidate(5, date = $$props.date);
    		if ('img' in $$props) $$invalidate(3, img = $$props.img);
    		if ('time' in $$props) $$invalidate(4, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*date*/ 32) {
    			$$invalidate(4, time = new Date(date).toLocaleString("no-NO", {
    				day: 'numeric',
    				month: 'long',
    				hour: 'numeric',
    				minute: 'numeric',
    				year: 'numeric'
    			}));
    		}
    	};

    	return [id, title, ingress, img, time, date];
    }

    class Post extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			id: 0,
    			title: 1,
    			ingress: 2,
    			date: 5,
    			img: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Post",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get id() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ingress() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ingress(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get img() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/BlogFrame.svelte generated by Svelte v3.43.1 */
    const file$1 = "src/components/BlogFrame.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (45:8) {#if active > 0}
    function create_if_block_2(ctx) {
    	let button;
    	let t;
    	let button_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("◀");
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, "◀");
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", "svelte-mqk3ia");
    			add_location(button, file$1, 45, 8, 1046);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { y: 100, delay: 300, duration: 500 }, true);
    				button_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { y: 100, delay: 300, duration: 500 }, false);
    			button_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(45:8) {#if active > 0}",
    		ctx
    	});

    	return block;
    }

    // (55:4) {#if active === index}
    function create_if_block_1(ctx) {
    	let div;
    	let post;
    	let div_intro;
    	let current;
    	const post_spread_levels = [/*post*/ ctx[6]];
    	let post_props = {};

    	for (let i = 0; i < post_spread_levels.length; i += 1) {
    		post_props = assign(post_props, post_spread_levels[i]);
    	}

    	post = new Post({ props: post_props, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(post.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			claim_component(post.$$.fragment, div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "post svelte-mqk3ia");
    			add_location(div, file$1, 55, 4, 1289);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			mount_component(post, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const post_changes = (dirty & /*posts*/ 1)
    			? get_spread_update(post_spread_levels, [get_spread_object(/*post*/ ctx[6])])
    			: {};

    			post.$set(post_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(post.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, { x: 100, duration: 300 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(post.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(post);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(55:4) {#if active === index}",
    		ctx
    	});

    	return block;
    }

    // (54:4) {#each posts as post, index}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*active*/ ctx[1] === /*index*/ ctx[8] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*active*/ ctx[1] === /*index*/ ctx[8]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*active*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(54:4) {#each posts as post, index}",
    		ctx
    	});

    	return block;
    }

    // (62:8) {#if active < (posts.length -1 )}
    function create_if_block(ctx) {
    	let button;
    	let t;
    	let button_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("▶");
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, "▶");
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", "svelte-mqk3ia");
    			add_location(button, file$1, 62, 8, 1478);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { y: 100, delay: 300, duration: 500 }, true);
    				button_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { y: 100, delay: 300, duration: 500 }, false);
    			button_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(62:8) {#if active < (posts.length -1 )}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let div2;
    	let div0;
    	let t2;
    	let t3;
    	let div1;
    	let current;
    	let if_block0 = /*active*/ ctx[1] > 0 && create_if_block_2(ctx);
    	let each_value = /*posts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block1 = /*active*/ ctx[1] < /*posts*/ ctx[0].length - 1 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("Siste om Forro i Oslo:");
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			h2 = claim_element(nodes, "H2", { class: true });
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Siste om Forro i Oslo:");
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(nodes);
    			div2 = claim_element(nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			div0 = claim_element(div2_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			if (if_block0) if_block0.l(div0_nodes);
    			div0_nodes.forEach(detach_dev);
    			t2 = claim_space(div2_nodes);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(div2_nodes);
    			}

    			t3 = claim_space(div2_nodes);
    			div1 = claim_element(div2_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			if (if_block1) if_block1.l(div1_nodes);
    			div1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h2, "class", "svelte-mqk3ia");
    			add_location(h2, file$1, 41, 0, 931);
    			attr_dev(div0, "class", "btn-box svelte-mqk3ia");
    			add_location(div0, file$1, 43, 4, 991);
    			attr_dev(div1, "class", "btn-box svelte-mqk3ia");
    			add_location(div1, file$1, 60, 4, 1406);
    			attr_dev(div2, "class", "container svelte-mqk3ia");
    			add_location(div2, file$1, 42, 0, 963);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, h2, anchor);
    			append_hydration_dev(h2, t0);
    			insert_hydration_dev(target, t1, anchor);
    			insert_hydration_dev(target, div2, anchor);
    			append_hydration_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_hydration_dev(div2, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_hydration_dev(div2, t3);
    			append_hydration_dev(div2, div1);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[1] > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*active*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*posts, active*/ 3) {
    				each_value = /*posts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, t3);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*active*/ ctx[1] < /*posts*/ ctx[0].length - 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*active, posts*/ 3) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BlogFrame', slots, []);

    	let { posts = [
    		{
    			title: "Title",
    			ingress: "Text",
    			img: {
    				src: "media/event-images/plassholder.jpg",
    				alt: "Folkefest med forro"
    			}
    		},
    		{
    			title: "Title",
    			ingress: "Text",
    			img: {
    				src: "media/event-images/plassholder.jpg",
    				alt: "Folkefest med forro"
    			}
    		}
    	] } = $$props;

    	let active = 0;
    	let direction = "";

    	function change(pil) {
    		if (pil === "left") {
    			direction = pil;

    			if (active > 0) {
    				$$invalidate(1, active--, active);
    			}
    		} else if (pil === "right") {
    			direction = pil;

    			if (active < posts.length - 1) {
    				$$invalidate(1, active++, active);
    			}
    		}
    	}

    	const writable_props = ['posts'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BlogFrame> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		change("left");
    	};

    	const click_handler_1 = () => {
    		change("right");
    	};

    	$$self.$$set = $$props => {
    		if ('posts' in $$props) $$invalidate(0, posts = $$props.posts);
    	};

    	$$self.$capture_state = () => ({
    		Post,
    		fly,
    		posts,
    		active,
    		direction,
    		change
    	});

    	$$self.$inject_state = $$props => {
    		if ('posts' in $$props) $$invalidate(0, posts = $$props.posts);
    		if ('active' in $$props) $$invalidate(1, active = $$props.active);
    		if ('direction' in $$props) direction = $$props.direction;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [posts, active, change, click_handler, click_handler_1];
    }

    class BlogFrame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { posts: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BlogFrame",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get posts() {
    		throw new Error("<BlogFrame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set posts(value) {
    		throw new Error("<BlogFrame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.43.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (46:2) {:catch error}
    function create_catch_block_1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[6].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Noe gikk galt: ");
    			t1 = text(t1_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", {});
    			var p_nodes = children(p);
    			t0 = claim_text(p_nodes, "Noe gikk galt: ");
    			t1 = claim_text(p_nodes, t1_value);
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(p, file, 46, 2, 983);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, t0);
    			append_hydration_dev(p, t1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(46:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (44:2) {:then tabs}
    function create_then_block_1(ctx) {
    	let introbox;
    	let current;

    	introbox = new IntroBox({
    			props: { tabs: /*tabs*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(introbox.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(introbox.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(introbox, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(introbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(introbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(introbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(44:2) {:then tabs}",
    		ctx
    	});

    	return block;
    }

    // (42:21)    <IntroBox />   {:then tabs}
    function create_pending_block_1(ctx) {
    	let introbox;
    	let current;
    	introbox = new IntroBox({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(introbox.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(introbox.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(introbox, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(introbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(introbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(introbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(42:21)    <IntroBox />   {:then tabs}",
    		ctx
    	});

    	return block;
    }

    // (54:2) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[6].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", {});
    			var p_nodes = children(p);
    			t = claim_text(p_nodes, t_value);
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(p, file, 54, 2, 1143);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 2 && t_value !== (t_value = /*error*/ ctx[6].message + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(54:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (52:2) {:then events}
    function create_then_block(ctx) {
    	let eventframe;
    	let current;

    	eventframe = new EventFrame({
    			props: { events: /*events*/ ctx[5] },
    			$$inline: true
    		});

    	eventframe.$on("more", /*open*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(eventframe.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(eventframe.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(eventframe, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const eventframe_changes = {};
    			if (dirty & /*data*/ 2) eventframe_changes.events = /*events*/ ctx[5];
    			eventframe.$set(eventframe_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(eventframe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(eventframe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(eventframe, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(52:2) {:then events}",
    		ctx
    	});

    	return block;
    }

    // (50:15)    <p>venter</p>   {:then events}
    function create_pending_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text("venter");
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", {});
    			var p_nodes = children(p);
    			t = claim_text(p_nodes, "venter");
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(p, file, 50, 2, 1053);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(50:15)    <p>venter</p>   {:then events}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let promise_1;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let blogframe;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 7,
    		error: 6,
    		blocks: [,,,]
    	};

    	handle_promise(/*tabpromise*/ ctx[2], info);

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 5,
    		error: 6,
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = /*data*/ ctx[1], info_1);

    	blogframe = new BlogFrame({
    			props: { posts: /*posts*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			info.block.c();
    			t0 = space();
    			info_1.block.c();
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			create_component(blogframe.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			info.block.l(nodes);
    			t0 = claim_space(nodes);
    			info_1.block.l(nodes);
    			t1 = claim_space(nodes);
    			img = claim_element(nodes, "IMG", { src: true, alt: true, class: true });
    			t2 = claim_space(nodes);
    			claim_component(blogframe.$$.fragment, nodes);
    			this.h();
    		},
    		h: function hydrate() {
    			if (!src_url_equal(img.src, img_src_value = "/static/frontend/banner_bottom.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "En illustrasjon av dansende par");
    			attr_dev(img, "class", "svelte-3lgxsl");
    			add_location(img, file, 57, 2, 1180);
    		},
    		m: function mount(target, anchor) {
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t0.parentNode;
    			info.anchor = t0;
    			insert_hydration_dev(target, t0, anchor);
    			info_1.block.m(target, info_1.anchor = anchor);
    			info_1.mount = () => t1.parentNode;
    			info_1.anchor = t1;
    			insert_hydration_dev(target, t1, anchor);
    			insert_hydration_dev(target, img, anchor);
    			insert_hydration_dev(target, t2, anchor);
    			mount_component(blogframe, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    			info_1.ctx = ctx;

    			if (dirty & /*data*/ 2 && promise_1 !== (promise_1 = /*data*/ ctx[1]) && handle_promise(promise_1, info_1)) ; else {
    				update_await_block_branch(info_1, ctx, dirty);
    			}

    			const blogframe_changes = {};
    			if (dirty & /*posts*/ 1) blogframe_changes.posts = /*posts*/ ctx[0];
    			blogframe.$set(blogframe_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(info_1.block);
    			transition_in(blogframe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			for (let i = 0; i < 3; i += 1) {
    				const block = info_1.blocks[i];
    				transition_out(block);
    			}

    			transition_out(blogframe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t0);
    			info_1.block.d(detaching);
    			info_1.token = null;
    			info_1 = null;
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t2);
    			destroy_component(blogframe, detaching);
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

    async function getData(url) {
    	const response = await fetch(`api/${url}`).catch(error => {
    		console.log(error);
    	});

    	return response.json();
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let posts = [
    		{
    			title: "Title",
    			ingress: "Text",
    			body: "Text",
    			img: {
    				src: "media/event-images/plassholder.jpg",
    				alt: "Folkefest med forro"
    			}
    		}
    	];

    	async function getPosts() {
    		await fetch("api/posts").then(data => data.json()).then(payload => {
    			$$invalidate(0, posts = payload);
    		}).catch(error => {
    			console.log(error);
    		});
    	}

    	let data = getData("events");
    	getPosts();
    	let tabpromise = getData("tabs");

    	function open() {
    		allEvents = true;
    		$$invalidate(1, data = getEvents());
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		IntroBox,
    		EventFrame,
    		BlogFrame,
    		posts,
    		getData,
    		getPosts,
    		data,
    		tabpromise,
    		open
    	});

    	$$self.$inject_state = $$props => {
    		if ('posts' in $$props) $$invalidate(0, posts = $$props.posts);
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    		if ('tabpromise' in $$props) $$invalidate(2, tabpromise = $$props.tabpromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [posts, data, tabpromise, open];
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
    	target: document.getElementById("sap-app"),
    	hydrate: true
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
