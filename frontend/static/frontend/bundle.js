
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
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
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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

    /* src/components/IntroBox.svelte generated by Svelte v3.43.1 */

    const file$6 = "src/components/IntroBox.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let h2;
    	let t0;
    	let t1;
    	let p0;
    	let t2;
    	let t3;
    	let p1;
    	let t4;
    	let t5;
    	let p2;
    	let button;
    	let t6;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text("Klar for å danse?");
    			t1 = space();
    			p0 = element("p");
    			t2 = text("Forro er en lett tilgjengelig og populær dans fra Brasil. Den har blitt meget populær i Europa i løpet av de seneste årene. I Norge har ikke dansen vært så populær ennå.");
    			t3 = space();
    			p1 = element("p");
    			t4 = text("Mer informasjon om Forro kommer på denne siden. Her kan du bli kjent med dansen og finne arrangementer her i Oslo.");
    			t5 = space();
    			p2 = element("p");
    			button = element("button");
    			t6 = text("Les mer om Forro her");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			h2 = claim_element(div_nodes, "H2", {});
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Klar for å danse?");
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(div_nodes);
    			p0 = claim_element(div_nodes, "P", {});
    			var p0_nodes = children(p0);
    			t2 = claim_text(p0_nodes, "Forro er en lett tilgjengelig og populær dans fra Brasil. Den har blitt meget populær i Europa i løpet av de seneste årene. I Norge har ikke dansen vært så populær ennå.");
    			p0_nodes.forEach(detach_dev);
    			t3 = claim_space(div_nodes);
    			p1 = claim_element(div_nodes, "P", {});
    			var p1_nodes = children(p1);
    			t4 = claim_text(p1_nodes, "Mer informasjon om Forro kommer på denne siden. Her kan du bli kjent med dansen og finne arrangementer her i Oslo.");
    			p1_nodes.forEach(detach_dev);
    			t5 = claim_space(div_nodes);
    			p2 = claim_element(div_nodes, "P", {});
    			var p2_nodes = children(p2);
    			button = claim_element(p2_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t6 = claim_text(button_nodes, "Les mer om Forro her");
    			button_nodes.forEach(detach_dev);
    			p2_nodes.forEach(detach_dev);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h2, file$6, 7, 4, 45);
    			add_location(p0, file$6, 8, 4, 76);
    			add_location(p1, file$6, 9, 4, 257);
    			attr_dev(button, "class", "btn svelte-2dcx45");
    			add_location(button, file$6, 10, 7, 386);
    			add_location(p2, file$6, 10, 4, 383);
    			attr_dev(div, "class", "box svelte-2dcx45");
    			add_location(div, file$6, 6, 0, 23);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			append_hydration_dev(div, h2);
    			append_hydration_dev(h2, t0);
    			append_hydration_dev(div, t1);
    			append_hydration_dev(div, p0);
    			append_hydration_dev(p0, t2);
    			append_hydration_dev(div, t3);
    			append_hydration_dev(div, p1);
    			append_hydration_dev(p1, t4);
    			append_hydration_dev(div, t5);
    			append_hydration_dev(div, p2);
    			append_hydration_dev(p2, button);
    			append_hydration_dev(button, t6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('IntroBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<IntroBox> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class IntroBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IntroBox",
    			options,
    			id: create_fragment$6.name
    		});
    	}
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

    /* src/components/Language.svelte generated by Svelte v3.43.1 */
    const file$5 = "src/components/Language.svelte";

    function get_each_context$1(ctx, list, i) {
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
    			attr_dev(button, "class", "svelte-1su6ojj");
    			add_location(button, file$5, 23, 4, 548);
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
    function create_if_block$1(ctx) {
    	let t0;
    	let button;
    	let t1;
    	let mounted;
    	let dispose;
    	let each_value = /*translations*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    			attr_dev(button, "class", "svelte-1su6ojj");
    			add_location(button, file$5, 21, 4, 471);
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
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(18:4) {#if translations.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#each translations as trans}
    function create_each_block$1(ctx) {
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
    			attr_dev(button, "class", "svelte-1su6ojj");
    			add_location(button, file$5, 19, 4, 396);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*changeLang*/ ctx[1](/*trans*/ ctx[4]))) /*changeLang*/ ctx[1](/*trans*/ ctx[4]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(19:4) {#each translations as trans}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*translations*/ ctx[0].length != 0) return create_if_block$1;
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
    			attr_dev(div, "class", "container svelte-1su6ojj");
    			add_location(div, file$5, 16, 0, 299);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { translations: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Language",
    			options,
    			id: create_fragment$5.name
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

    const file$4 = "src/components/Map.svelte";

    function create_fragment$4(ctx) {
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
    			add_location(iframe, file$4, 5, 0, 54);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { adress: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map",
    			options,
    			id: create_fragment$4.name
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
    const file$3 = "src/components/Event.svelte";

    // (41:8) {#if overlay}
    function create_if_block_3(ctx) {
    	let div1;
    	let language;
    	let t0;
    	let div0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;

    	language = new Language({
    			props: { translations: /*translations*/ ctx[6] },
    			$$inline: true
    		});

    	language.$on("changeLang", /*changeLang*/ ctx[9]);
    	language.$on("revertLang", /*revertLang*/ ctx[10]);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(language.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = text("❌");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div1 = claim_element(nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			claim_component(language.$$.fragment, div1_nodes);
    			t0 = claim_space(div1_nodes);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			t1 = claim_text(div0_nodes, "❌");
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div0, "class", "exit-btn svelte-4dzftg");
    			add_location(div0, file$3, 43, 12, 899);
    			attr_dev(div1, "class", "lang-menu");
    			add_location(div1, file$3, 41, 8, 770);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div1, anchor);
    			mount_component(language, div1, null);
    			append_hydration_dev(div1, t0);
    			append_hydration_dev(div1, div0);
    			append_hydration_dev(div0, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "dblclick", /*overlayOff*/ ctx[8], false, false, false);
    				mounted = true;
    			}
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
    			if (detaching) detach_dev(div1);
    			destroy_component(language);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(41:8) {#if overlay}",
    		ctx
    	});

    	return block;
    }

    // (54:8) {#if overlay}
    function create_if_block_2(ctx) {
    	let map;
    	let current;

    	map = new Map$1({
    			props: { adress: /*where*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(map.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(54:8) {#if overlay}",
    		ctx
    	});

    	return block;
    }

    // (59:4) {#if overlay}
    function create_if_block_1(ctx) {
    	let div;
    	let h4;
    	let t0;
    	let t1;
    	let p;
    	let t2;
    	let p_intro;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			t0 = text("Info:");
    			t1 = space();
    			p = element("p");
    			t2 = text(/*description*/ ctx[1]);
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
    			p = claim_element(div_nodes, "P", { class: true });
    			var p_nodes = children(p);
    			t2 = claim_text(p_nodes, /*description*/ ctx[1]);
    			p_nodes.forEach(detach_dev);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h4, file$3, 60, 8, 1285);
    			attr_dev(p, "class", "svelte-4dzftg");
    			add_location(p, file$3, 61, 8, 1308);
    			attr_dev(div, "class", "textbox svelte-4dzftg");
    			add_location(div, file$3, 59, 4, 1255);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			append_hydration_dev(div, h4);
    			append_hydration_dev(h4, t0);
    			append_hydration_dev(div, t1);
    			append_hydration_dev(div, p);
    			append_hydration_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*description*/ 2) set_data_dev(t2, /*description*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, fade, { delay: 300 });
    					p_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(59:4) {#if overlay}",
    		ctx
    	});

    	return block;
    }

    // (71:0) {#if overlay}
    function create_if_block(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			children(div).forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "active_overlay svelte-4dzftg");
    			add_location(div, file$3, 71, 0, 1478);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*overlayOff*/ ctx[8], false, false, false);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(71:0) {#if overlay}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let div1;
    	let t0;
    	let h3;
    	let t1;
    	let t2;
    	let div0;
    	let p0;
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let t6;
    	let p2;
    	let t7;
    	let t8;
    	let p3;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let div2;
    	let img_1;
    	let img_1_src_value;
    	let t13;
    	let if_block3_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*overlay*/ ctx[2] && create_if_block_3(ctx);
    	let if_block1 = /*overlay*/ ctx[2] && create_if_block_2(ctx);
    	let if_block2 = /*overlay*/ ctx[2] && create_if_block_1(ctx);
    	let if_block3 = /*overlay*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			h3 = element("h3");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t3 = text("🌎");
    			t4 = space();
    			p1 = element("p");
    			t5 = text(/*where*/ ctx[3]);
    			t6 = space();
    			p2 = element("p");
    			t7 = text("🕔");
    			t8 = space();
    			p3 = element("p");
    			t9 = text(/*when*/ ctx[4]);
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			if (if_block2) if_block2.c();
    			t12 = space();
    			div2 = element("div");
    			img_1 = element("img");
    			t13 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div3 = claim_element(nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div1 = claim_element(div3_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			if (if_block0) if_block0.l(div1_nodes);
    			t0 = claim_space(div1_nodes);
    			h3 = claim_element(div1_nodes, "H3", {});
    			var h3_nodes = children(h3);
    			t1 = claim_text(h3_nodes, /*title*/ ctx[0]);
    			h3_nodes.forEach(detach_dev);
    			t2 = claim_space(div1_nodes);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p0 = claim_element(div0_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t3 = claim_text(p0_nodes, "🌎");
    			p0_nodes.forEach(detach_dev);
    			t4 = claim_space(div0_nodes);
    			p1 = claim_element(div0_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t5 = claim_text(p1_nodes, /*where*/ ctx[3]);
    			p1_nodes.forEach(detach_dev);
    			t6 = claim_space(div0_nodes);
    			p2 = claim_element(div0_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t7 = claim_text(p2_nodes, "🕔");
    			p2_nodes.forEach(detach_dev);
    			t8 = claim_space(div0_nodes);
    			p3 = claim_element(div0_nodes, "P", { class: true });
    			var p3_nodes = children(p3);
    			t9 = claim_text(p3_nodes, /*when*/ ctx[4]);
    			p3_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t10 = claim_space(div1_nodes);
    			if (if_block1) if_block1.l(div1_nodes);
    			div1_nodes.forEach(detach_dev);
    			t11 = claim_space(div3_nodes);
    			if (if_block2) if_block2.l(div3_nodes);
    			t12 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			img_1 = claim_element(div2_nodes, "IMG", { src: true, alt: true });
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			t13 = claim_space(nodes);
    			if (if_block3) if_block3.l(nodes);
    			if_block3_anchor = empty();
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h3, file$3, 46, 8, 991);
    			attr_dev(p0, "class", "svelte-4dzftg");
    			add_location(p0, file$3, 48, 12, 1050);
    			attr_dev(p1, "class", "svelte-4dzftg");
    			add_location(p1, file$3, 49, 12, 1072);
    			attr_dev(p2, "class", "svelte-4dzftg");
    			add_location(p2, file$3, 50, 12, 1099);
    			attr_dev(p3, "class", "svelte-4dzftg");
    			add_location(p3, file$3, 51, 12, 1121);
    			attr_dev(div0, "class", "infobox svelte-4dzftg");
    			add_location(div0, file$3, 47, 8, 1016);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$3, 39, 4, 714);
    			if (!src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[5].src)) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", /*img*/ ctx[5].alt);
    			add_location(img_1, file$3, 66, 8, 1411);
    			attr_dev(div2, "class", "image-box svelte-4dzftg");
    			add_location(div2, file$3, 65, 4, 1379);
    			attr_dev(div3, "class", "card svelte-4dzftg");
    			toggle_class(div3, "selected", /*overlay*/ ctx[2]);
    			add_location(div3, file$3, 35, 0, 634);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div3, anchor);
    			append_hydration_dev(div3, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_hydration_dev(div1, t0);
    			append_hydration_dev(div1, h3);
    			append_hydration_dev(h3, t1);
    			append_hydration_dev(div1, t2);
    			append_hydration_dev(div1, div0);
    			append_hydration_dev(div0, p0);
    			append_hydration_dev(p0, t3);
    			append_hydration_dev(div0, t4);
    			append_hydration_dev(div0, p1);
    			append_hydration_dev(p1, t5);
    			append_hydration_dev(div0, t6);
    			append_hydration_dev(div0, p2);
    			append_hydration_dev(p2, t7);
    			append_hydration_dev(div0, t8);
    			append_hydration_dev(div0, p3);
    			append_hydration_dev(p3, t9);
    			append_hydration_dev(div1, t10);
    			if (if_block1) if_block1.m(div1, null);
    			append_hydration_dev(div3, t11);
    			if (if_block2) if_block2.m(div3, null);
    			append_hydration_dev(div3, t12);
    			append_hydration_dev(div3, div2);
    			append_hydration_dev(div2, img_1);
    			insert_hydration_dev(target, t13, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_hydration_dev(target, if_block3_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", /*overlayOn*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*overlay*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*overlay*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);

    			if (/*overlay*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*overlay*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
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

    			if (/*overlay*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*overlay*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div3, t12);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*overlay*/ 4) {
    				toggle_class(div3, "selected", /*overlay*/ ctx[2]);
    			}

    			if (/*overlay*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (detaching) detach_dev(t13);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(if_block3_anchor);
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
    	validate_slots('Event', slots, []);
    	let { event } = $$props;
    	let { title, where, when, img, description } = event;
    	let translations = event.translations;
    	let overlay = false;

    	function overlayOn() {
    		$$invalidate(2, overlay = true);
    	}

    	function overlayOff() {
    		$$invalidate(2, overlay = false);
    	}

    	function changeLang(e) {
    		$$invalidate(0, title = e.detail.title);
    		$$invalidate(1, description = e.detail.description);
    	}

    	function revertLang() {
    		$$invalidate(0, title = event.title);
    		$$invalidate(1, description = event.description);
    	}

    	const writable_props = ['event'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('event' in $$props) $$invalidate(11, event = $$props.event);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		Language,
    		Map: Map$1,
    		event,
    		title,
    		where,
    		when,
    		img,
    		description,
    		translations,
    		overlay,
    		overlayOn,
    		overlayOff,
    		changeLang,
    		revertLang
    	});

    	$$self.$inject_state = $$props => {
    		if ('event' in $$props) $$invalidate(11, event = $$props.event);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('where' in $$props) $$invalidate(3, where = $$props.where);
    		if ('when' in $$props) $$invalidate(4, when = $$props.when);
    		if ('img' in $$props) $$invalidate(5, img = $$props.img);
    		if ('description' in $$props) $$invalidate(1, description = $$props.description);
    		if ('translations' in $$props) $$invalidate(6, translations = $$props.translations);
    		if ('overlay' in $$props) $$invalidate(2, overlay = $$props.overlay);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		title,
    		description,
    		overlay,
    		where,
    		when,
    		img,
    		translations,
    		overlayOn,
    		overlayOff,
    		changeLang,
    		revertLang,
    		event
    	];
    }

    class Event extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { event: 11 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*event*/ ctx[11] === undefined && !('event' in props)) {
    			console.warn("<Event> was created without expected prop 'event'");
    		}
    	}

    	get event() {
    		throw new Error("<Event>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set event(value) {
    		throw new Error("<Event>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/EventFrame.svelte generated by Svelte v3.43.1 */
    const file$2 = "src/components/EventFrame.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (45:4) {#each new_events as event}
    function create_each_block(ctx) {
    	let event;
    	let current;

    	event = new Event({
    			props: { event: /*event*/ ctx[4] },
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(45:4) {#each new_events as event}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let div0;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*new_events*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("Se de neste arrangementene -->");
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div0 = element("div");
    			t3 = text("+");
    			this.h();
    		},
    		l: function claim(nodes) {
    			h2 = claim_element(nodes, "H2", {});
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Se de neste arrangementene -->");
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(nodes);
    			div1 = claim_element(nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(div1_nodes);
    			}

    			t2 = claim_space(div1_nodes);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			t3 = claim_text(div0_nodes, "+");
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h2, file$2, 41, 0, 1150);
    			attr_dev(div0, "class", "more svelte-14i4jg2");
    			add_location(div0, file$2, 47, 4, 1285);
    			attr_dev(div1, "class", "container svelte-14i4jg2");
    			add_location(div1, file$2, 43, 0, 1191);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, h2, anchor);
    			append_hydration_dev(h2, t0);
    			insert_hydration_dev(target, t1, anchor);
    			insert_hydration_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_hydration_dev(div1, t2);
    			append_hydration_dev(div1, div0);
    			append_hydration_dev(div0, t3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*moreClicked*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*new_events*/ 1) {
    				each_value = /*new_events*/ ctx[0];
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
    						each_blocks[i].m(div1, t2);
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
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EventFrame', slots, []);
    	const dispatch = createEventDispatcher();

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

    	// We only want to see the three first elements here.
    	// This needs to be refines
    	let new_events = events.slice(-3);

    	function moreClicked() {
    		dispatch("more");
    	}

    	const writable_props = ['events'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EventFrame> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('events' in $$props) $$invalidate(2, events = $$props.events);
    	};

    	$$self.$capture_state = () => ({
    		Event,
    		createEventDispatcher,
    		dispatch,
    		events,
    		new_events,
    		moreClicked
    	});

    	$$self.$inject_state = $$props => {
    		if ('events' in $$props) $$invalidate(2, events = $$props.events);
    		if ('new_events' in $$props) $$invalidate(0, new_events = $$props.new_events);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [new_events, moreClicked, events];
    }

    class EventFrame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { events: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EventFrame",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get events() {
    		throw new Error("<EventFrame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set events(value) {
    		throw new Error("<EventFrame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Blog.svelte generated by Svelte v3.43.1 */
    const file$1 = "src/components/Blog.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let h1;
    	let t1_value = /*post*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let p;
    	let strong;
    	let t3_value = /*post*/ ctx[0].ingress + "";
    	let t3;
    	let t4;
    	let html_tag;
    	let raw_value = /*post*/ ctx[0].body + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			strong = element("strong");
    			t3 = text(t3_value);
    			t4 = space();
    			html_tag = new HtmlTagHydration();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			img = claim_element(div_nodes, "IMG", { src: true, alt: true });
    			t0 = claim_space(div_nodes);
    			h1 = claim_element(div_nodes, "H1", {});
    			var h1_nodes = children(h1);
    			t1 = claim_text(h1_nodes, t1_value);
    			h1_nodes.forEach(detach_dev);
    			t2 = claim_space(div_nodes);
    			p = claim_element(div_nodes, "P", {});
    			var p_nodes = children(p);
    			strong = claim_element(p_nodes, "STRONG", {});
    			var strong_nodes = children(strong);
    			t3 = claim_text(strong_nodes, t3_value);
    			strong_nodes.forEach(detach_dev);
    			p_nodes.forEach(detach_dev);
    			t4 = claim_space(div_nodes);
    			html_tag = claim_html_tag(div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			if (!src_url_equal(img.src, img_src_value = /*post*/ ctx[0].img.src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*post*/ ctx[0].img.alt);
    			add_location(img, file$1, 42, 0, 977);
    			add_location(h1, file$1, 43, 0, 1021);
    			add_location(strong, file$1, 44, 3, 1046);
    			add_location(p, file$1, 44, 0, 1043);
    			html_tag.a = null;
    			attr_dev(div, "class", "container svelte-11wsuqt");
    			add_location(div, file$1, 41, 0, 953);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			append_hydration_dev(div, img);
    			append_hydration_dev(div, t0);
    			append_hydration_dev(div, h1);
    			append_hydration_dev(h1, t1);
    			append_hydration_dev(div, t2);
    			append_hydration_dev(div, p);
    			append_hydration_dev(p, strong);
    			append_hydration_dev(strong, t3);
    			append_hydration_dev(div, t4);
    			html_tag.m(raw_value, div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*post*/ 1 && !src_url_equal(img.src, img_src_value = /*post*/ ctx[0].img.src)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*post*/ 1 && img_alt_value !== (img_alt_value = /*post*/ ctx[0].img.alt)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*post*/ 1 && t1_value !== (t1_value = /*post*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*post*/ 1 && t3_value !== (t3_value = /*post*/ ctx[0].ingress + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*post*/ 1 && raw_value !== (raw_value = /*post*/ ctx[0].body + "")) html_tag.p(raw_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function parseMD(input) {
    	let output = [];
    	let paragraphs = input.split("\r\n\r\n");

    	paragraphs.forEach(el => {
    		if (el.startsWith("# ")) {
    			output.push(el.replace("# ", "<h3>") + "</h3>");
    		} else if (el.startsWith("![") && el.endsWith(")")) {
    			output.push(el.replace("![", `<img alt="`).replace("](", `" src="`).replace(")", `"<br>`));
    		} else {
    			output.push("<p>" + el + "</p>");
    		}
    	});

    	return output.join("\n");
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Blog', slots, []);

    	let { post = {
    		title: "Tittel",
    		ingress: "Ingress",
    		body: "<p>Body Text</p>",
    		img: { src: "", alt: "" }
    	} } = $$props;

    	afterUpdate(() => {
    		$$invalidate(0, post.body = parseMD(post.body), post);
    	});

    	const writable_props = ['post'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Blog> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('post' in $$props) $$invalidate(0, post = $$props.post);
    	};

    	$$self.$capture_state = () => ({ afterUpdate, post, parseMD });

    	$$self.$inject_state = $$props => {
    		if ('post' in $$props) $$invalidate(0, post = $$props.post);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [post];
    }

    class Blog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { post: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Blog",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get post() {
    		throw new Error("<Blog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<Blog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.43.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (51:2) {:catch error}
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
    			add_location(p, file, 51, 2, 993);
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
    		source: "(51:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (49:2) {:then events}
    function create_then_block(ctx) {
    	let eventframe;
    	let current;

    	eventframe = new EventFrame({
    			props: { events: /*events*/ ctx[5] },
    			$$inline: true
    		});

    	eventframe.$on("more", /*open*/ ctx[2]);

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
    		source: "(49:2) {:then events}",
    		ctx
    	});

    	return block;
    }

    // (47:15)    <p>venter</p>   {:then events}
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
    			add_location(p, file, 47, 2, 903);
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
    		source: "(47:15)    <p>venter</p>   {:then events}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let introbox;
    	let t0;
    	let promise;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let blog;
    	let current;
    	introbox = new IntroBox({ $$inline: true });

    	let info = {
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

    	handle_promise(promise = /*data*/ ctx[1], info);

    	blog = new Blog({
    			props: { post: /*post*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(introbox.$$.fragment);
    			t0 = space();
    			info.block.c();
    			t1 = space();
    			p = element("p");
    			t2 = text("Some static element");
    			t3 = space();
    			create_component(blog.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			claim_component(introbox.$$.fragment, nodes);
    			t0 = claim_space(nodes);
    			info.block.l(nodes);
    			t1 = claim_space(nodes);
    			p = claim_element(nodes, "P", {});
    			var p_nodes = children(p);
    			t2 = claim_text(p_nodes, "Some static element");
    			p_nodes.forEach(detach_dev);
    			t3 = claim_space(nodes);
    			claim_component(blog.$$.fragment, nodes);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(p, file, 55, 2, 1031);
    		},
    		m: function mount(target, anchor) {
    			mount_component(introbox, target, anchor);
    			insert_hydration_dev(target, t0, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t1.parentNode;
    			info.anchor = t1;
    			insert_hydration_dev(target, t1, anchor);
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, t2);
    			insert_hydration_dev(target, t3, anchor);
    			mount_component(blog, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*data*/ 2 && promise !== (promise = /*data*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			const blog_changes = {};
    			if (dirty & /*post*/ 1) blog_changes.post = /*post*/ ctx[0];
    			blog.$set(blog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(introbox.$$.fragment, local);
    			transition_in(info.block);
    			transition_in(blog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(introbox.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(blog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(introbox, detaching);
    			if (detaching) detach_dev(t0);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			destroy_component(blog, detaching);
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

    	let post = {
    		title: "Title",
    		ingress: "Text",
    		body: "Text",
    		img: {
    			src: "media/event-images/plassholder.jpg",
    			alt: "Folkefest med forro"
    		}
    	};

    	async function getPosts() {
    		await fetch("api/posts").then(data => data.json()).then(payload => {
    			$$invalidate(0, post = payload[0]);
    		}).catch(error => {
    			console.log(error);
    		});
    	}

    	let data = getData("events");
    	getPosts();
    	let allEvents = false;

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
    		Blog,
    		post,
    		getData,
    		getPosts,
    		data,
    		allEvents,
    		open
    	});

    	$$self.$inject_state = $$props => {
    		if ('post' in $$props) $$invalidate(0, post = $$props.post);
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    		if ('allEvents' in $$props) allEvents = $$props.allEvents;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [post, data, open];
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
