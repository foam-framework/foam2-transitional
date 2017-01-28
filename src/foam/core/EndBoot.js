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
 * Map of Property property names to arrays of names of properties that they shadow.
 *
 * Ex. 'setter' has higher precedence than 'adapt', 'preSet', and 'postSet', so if
 * it is set, then it shadows those other properties if they are set, causing their
 * values to be ignored.
 *
 * Not defined as a constant, because they haven't been defined yet.
 */
foam.core.Property.SHADOW_MAP = {
  setter:     ['adapt', 'preSet', 'postSet'],
  getter:     ['factory', 'expression', 'value'],
  factory:    ['expression', 'value'],
  expression: ['value']
};

/** Add new Axiom types (Implements, Constants, Topics, Properties, Methods and Listeners) to Model. */
foam.CLASS({
  refines: 'foam.core.Model',

  // documentation: 'Add new Axiom types (Implements, Constants, Topics, Properties, Methods and Listeners) to Model.',

  properties: [
    {
      class: 'PropertyArray',
      name: 'properties'
    },
    {
      class: 'AxiomArray',
      of: 'Method',
      name: 'methods',
      adaptArrayElement: function(o) {
        /*
          Methods can be defined using two formats.
          1. Short-form function literal:
               function foo() {
                 console.log('bar');
               }

          3. Long-form JSON:
               {
                 name: 'foo',
                 code: function() {
                   console.log('bar');
                 }
               }
             The long-form will support many options, but only 'name' and 'code'
             are mandatory.
         */
        if ( foam.Function.isInstance(o) ) {
          // TODO(adamvy): Ensure that name and code are typechecked and validated
          // when model validation becomes a thing.
          var m = foam.core.Method.create();
          m.name = o.name;
          m.code = o;
          return m;
        }
        return foam.core.Method.isInstance(o) ? o : foam.core.Method.create(o);
      }
    }
  ]
});


foam.boot.phase3();


foam.CLASS({
  refines: 'foam.core.FObject',

  // documentation: 'Upgrade FObject to fully bootstrapped form.',

  axioms: [
    {
      name: '__context__',
      installInProto: function(p) {
        /** @param {any} p */
        Object.defineProperty(p, '__context__', {
          get: function() {
            var x = this.getPrivate_('__context__');
            if ( ! x ) {
              var contextParent = this.getPrivate_('contextParent');
              if ( contextParent ) {
                this.setPrivate_(
                    '__context__',
                    x = contextParent.__subContext__);
                this.setPrivate_('contextParent', undefined);
              } else {
                // Default to the global context if none was provided
                return this.__context__ = foam.__context__;
              }
            }
            return x;
          },
          set: function(x) {
            foam.assert(
                ! this.hasOwnPrivate_('contextParent') &&
                ! this.hasOwnPrivate_('__context__'),
                '__context__ has already been initialized.');

            foam.assert(
                foam.core.FObject.isInstance(x) ||
                foam.Context.isInstance(x),
                'Tried to set __context__ to non-context');

            this.setPrivate_(
                foam.core.FObject.isInstance(x) ?
                    'contextParent' :
                    '__context__',
                x);
          }
        });

        // By default the __subContext__ of an FObject is the same as its,
        // __context__.  Later when exports support is added we will refine FObject
        // such that __subContext__ is truly a sub-context of __context__ that
        // contains anything FObject exports.
        //
        // TODO(adamvy): Link to exports definition of __subContext__ when that
        // code is added.
        Object.defineProperty(
            p,
            '__subContext__',
            {
              get: function() { return this.__context__; },
              set: function() {
                throw new Error(
                    'Attempted to set unsettable __subContext__ in ' +
                    this.cls_.id);
              }
            });
      }
    }
  ],

  methods: [
    function initArgs(args, opt_parent) {
      /**
       * Called to process constructor arguments.
       * Replaces simpler version defined in original FObject definition.
       * @param {Object=} args
       * @param {any=} opt_parent
       */
      if ( opt_parent ) this.__context__ = opt_parent;
      if ( ! args ) return;

      // If args are just a simple {} map, just copy
      if ( args.__proto__ === Object.prototype || ! args.__proto__ ) {
        for ( var key in args ) {
          var a = this.cls_.getAxiomByName(key);
          if ( a && foam.core.Property.isInstance(a) ) {
            this[key] = args[key];
          } else {
            this.unknownArg(key, args[key]);
          }
        }
      }
    },

    function unknownArg(key, value) {
      /**
       * Template method used to report an unknown argument passed
       * to a constructor. Is set in debug.js.
       * @param {String} key
       * @param {any=} value
       */
      // NOP
    }
  ]
});


foam.boot.end();
