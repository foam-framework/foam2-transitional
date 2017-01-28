/*
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
  Export common window/document services through the Context.

  Rather than using window or document directly, objects should import: the
  services that foam.core.Window exports:, and then access them as this.name,
  rather than as console.name or document.name.

  This is done to remove dependency on the globals 'document' and 'window',
  which makes it easier to write code which works with multiple windows.

  It also allows for common services to be decorated, trapped, or replaced
  in sub-contexts (for example, to replace console.error and console.warn when
  running test).

  A foam.core.Window is installed by FOAM on starup for the default
  window/document, but if user code opens a new Window, it should create
  and install a new foam.core.Window explicitly.
 */
foam.CLASS({
  package: 'foam.core',
  name: 'Window',

  exports: [
    'setTimeout',
    'clearTimeout',
    'merged'
  ],

  properties: [
    {
      name: 'name',
      value: 'window'
    },
    {
      name: 'window'
    }
  ],

  methods: [
    function merged(l, opt_delay) {
      /**
       * @param {any} l
       * @param {Number=} opt_delay
       */
      var delay = opt_delay || 16;
      var ctx    = this;

      return foam.Function.setName((function() {
        var triggered = false;
        var lastArgs  = null;
        function mergedListener() {
          triggered = false;
          var args = Array.from(lastArgs);
          lastArgs = null;
          l.apply(this, args);
        }

        var f = function() {
          lastArgs = arguments;

          if ( ! triggered ) {
            triggered = true;
            ctx.setTimeout(mergedListener, delay);
          }
        };

        return f;
      }()), 'merged(' + l.name + ')');
    },

    function setTimeout(f, delay) {
      /**
       * @param {Function} f
       * @param {Number} delay
       * @return {Number}
       */
      return this.window.setTimeout(f, delay);
    },

    function clearTimeout(id) {
      /**
       * @param {Number} id
       */
      this.window.clearTimeout(id);
    }
  ]
});


// Replace top-level Context with one which includes Window's exports.
foam.__context__ = foam.core.Window.create(
  {window: global},
  foam.__context__
).__subContext__;
