/**
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

/*
 * Debug.js
 *
 * This file contains refinements and replacements designed to make
 * FOAM apps easier to debug. Things like more informative toString() methods
 * .describe() on various types of objects, extra type checking, warnings,
 * and asserts, etc. Many of these features may negatively affect performance,
 * so while this file should be loaded during your day-to-day development,
 * it should not be included in production.
 */

/* Validating a Model should also validate all of its Axioms. */
foam.CLASS({
  refines: 'foam.core.Model',

  methods: [
    function validate() {
      this.SUPER();

      if ( this.refines ) {
        if ( this.hasOwnProperty('extends') ) {
          throw this.id + ': "extends" and "refines" are mutually exclusive.';
        }

        if ( ! this.flags.noWarnOnRefinesAfterCreate ) {
          var context = this.__context__;
          var cls     = context.lookup(this.refines);

          if ( cls.count_ ) {
            for ( var i = 0 ; i < this.axioms_.length ; i++ ) {
              var a = this.axioms_[i];
              if ( ! foam.core.Property.isInstance(a) &&
                   ! foam.core.Method.isInstance(a) ) {
                // FUTURE: use context.warn instead of console.warn
                console.warn(
                    'Refining class "' +
                    this.refines +
                    '", which has already created instances.');
                break;
              }
            }
          }
        }
      }

      for ( var i = 0 ; i < this.axioms_.length ; i++ ) {
        this.axioms_[i].validate && this.axioms_[i].validate(this);
      }
    }
  ]
});


/* Validating a Model should also validate all of its Axioms. */
foam.CLASS({
  refines: 'foam.core.Property',

  methods: [
    function validate(model) {
      /**
       * @param {FObject} model
       */
      this.SUPER();

      foam.assert(
          ! this.name.endsWith('$'),
          'Illegal Property Name: Can\'t end with "$": ', this.name);

      foam.assert(
          ! this.name.startsWith('__'),
          'Illegal Property Name: Names beginning with double underscore ' +
          '"__" are reserved: ', this.name);

      var mName = model.id ? ( model.id + '.' ) : ( model.refines + '.' );

      var es = foam.core.Property.SHADOW_MAP;
      for ( var key in es ) {
        var e = es[key];
        if ( this[key] ) {
          for ( var j = 0 ; j < e.length ; j++ ) {
            if ( this.hasOwnProperty(e[j]) ) {
              console.warn(
                  'Property ' + mName +
                  this.name + ' "' + e[j] +
                  '" hidden by "' + key + '"');
            }
          }
        }
      }
    }
  ]
});


// Decorate installModel() to verify that axiom names aren't duplicated.
foam.core.FObject.installModel = (function() {
  var superInstallModel = foam.core.FObject.installModel;

  return function(m) {
    /** @param {Object} m */
    var names = {};

    for ( var i = 0; i < m.axioms_.length; i++ ) {
      var a = m.axioms_[i];

      foam.assert(! names.hasOwnProperty(a.name),
        'Axiom name conflict in', m.id || m.refines, ':', a.name);

      var prevA    = this.getAxiomByName(a.name);
      var Property = foam.core.Property;
      // Potential failure if:
      //    previousAxiom class does not match newAxiom class
      // But ignore valid cases:
      //    base Property extended by subclass of Property
      //    subclass of Property extended without specifying class
      if ( prevA && prevA.cls_ !== a.cls_ &&
          ! (prevA.cls_ === Property && Property.isSubClass(a.cls_)) &&
          ! (Property.isSubClass(prevA.cls_) && a.cls_ === Property) ) {
        var prevCls = prevA.cls_ ? prevA.cls_.id : 'anonymous';
        var aCls    = a.cls_     ? a.cls_.id     : 'anonymous';

        if ( Property.isSubClass(prevA.cls_) &&
            ! Property.isSubClass(a.cls_) ) {
          throw 'Illegal to change Property to non-Property: ' + this.id + '.' +
            a.name + ' changed to ' + aCls;
        // FUTURE: This case is needed when we have other method types, like
        // Templates and Actions.
        //} else if ( foam.core.Method.isSubClass(prevA.cls_) &&
        //    foam.core.Method.isSubClass(a.cls_) ) {
        //  // NOP
        } else if ( prevA.cls_ ) {
          // FUTURE: Make this an error when supression is supported.
          console.warn('Change of Axiom ' + this.id + '.' + a.name +
              ' type from ' + prevCls + ' to ' + aCls);
        }
      }

      names[a.name] = a;
    }

    superInstallModel.call(this, m);
  };
})();


foam.CLASS({
  refines: 'foam.core.FObject',

  documentation: 'Assert that all required imports are provided.',

  methods: [
    function init() {
      var is = this.cls_.getAxiomsByClass(foam.core.Import);
      for ( var i = 0 ; i < is.length ; i++ ) {
        var imp = is[i];

        if ( imp.required && ! this.__context__[imp.key + '$'] ) {
          var m = 'Missing required import: ' + imp.key + ' in ' + this.cls_.id;
          foam.assert(false, m);
        }
      }
    }
  ]
});


foam.LIB({
  name: 'foam.Function',

  methods: [
    function typeCheck(fn, opt_args) {
      /**
       * Decorates the given function with a runtime type checker.
       * Types should be denoted before each argument:
       * <code>function(\/\*TypeA\*\/ argA, \/\*string\*\/ argB) { ... }</code>
       * Types are either the names of Models (i.e. declared with CLASS), or
       * javascript primitives as returned by 'typeof'. In addition, 'array'
       * is supported as a special case, corresponding to an Array.isArray()
       * check.
       * @param {Function} fn The function to decorate. The toString() of the function must be
       *     accurate.
       * @param {Array=} opt_args In many cases the args are already parsed out or available
       *       from Method.args, so can be provided directly.
       * @return {Function} A new function that will throw errors if arguments
       *         doesn't match the declared types, run the original function,
       *         then type check the returned value.
       */

      // Multiple definitions of LIBs may trigger this multiple times
      // on the same function
      if ( fn.isTypeChecked__ ) return fn;

      // parse out the arguments and their types, if not provided
      var args = opt_args || foam.Function.args(fn);

      // determine if there are no checkable arguments
      var checkable = false;
      function isArgCheckable(a) {
        return ! (
          ( a.typeName === '' || a.typeName === 'any' ||
            foam.Undefined.isInstance(a.typeName) ) &&
          ( a.optional || a.repeats )
        );
      }
      for ( var i = 0 ; i < args.length ; i++ ) {
        if ( isArgCheckable(args[i]) ) {
          checkable = true;
          break;
        }
      }
      if ( ( ! checkable ) && args.returnType ) {
        checkable = isArgCheckable(args.returnType);
      }
      if ( ! checkable ) {
        // nothing to check, don't decorate
        return fn;
      }

      var typeChecker = function() {
        // check each declared argument, arguments[i] can be undefined for
        // missing optional args, extra arguments are ok.
        // Do not validate the last arg yet, it may be repeated.
        var i;
        for ( i = 0; i < ( args.length - 1 ) ; i++ ) {
          args[i].validate(arguments[i]);
        }

        // if last arg repeats, validate remaining arguments against lastArg
        i = args.length - 1;
        var lastArg = args[i];
        if ( lastArg && lastArg.repeats ) {
          // for repeats, loop through remaining arguments passed in
          for (  ; i < arguments.length ; i++ ) {
            lastArg.validate(arguments[i]);
          }
        } else {
          // normal validation
          lastArg.validate(arguments[i]);
        }

        // If nothing threw an exception, we are free to run the function
        var typeCheckerVal = fn.apply(this, arguments);

        // check the return value
        if ( args.returnType ) args.returnType.validate(typeCheckerVal);

        return typeCheckerVal;
      };

      // keep the old value of toString (hide the decorator)
      typeChecker.toString = function() { return fn.toString(); };
      typeChecker.isTypeChecked__ = true;

      return typeChecker;
    }
  ]
});

// Type Checking on Methods and LIBs
(function installTypeChecking() {
  // Access Argument now to avoid circular reference because of lazy model building.
  foam.core.Argument;

  /* Methods gain type checking. */
  foam.CLASS({
    refines: 'foam.core.Method',

    methods: [
      function installInProto(proto) {
        /** @param {any} proto */

        var code;

        // add type checking
        try {
          // this.args may be undefined
          code = foam.Function.typeCheck(this.code,
            ( this.args && this.args.length ) ? this.args : undefined);
        } catch (e) {
          throw new Error(
            'Method: Failed to add type checking to method ' +
            this.name + ' of ' + proto.cls_.id + ':\n' +
            (this.code && this.code.toString()) + '\n' +
            e.toString());
        }

        // extract args if not already set
        if ( ! this.args || ! this.args.length ) {
          // typeCheck succeeded, so args should not fail
          var foundArgs = foam.Function.args(code);
          if ( foundArgs && foundArgs.length ) this.args = foundArgs;
        }

        proto[this.name] = this.override_(proto, code);
      },

    ],

    properties: [
      {
        class: 'FObjectArray',
        name: 'args',
        of: 'foam.core.Argument',
      }
    ]
  });
  // Upgrade a LIBs
  var upgradeLib = function upgradeLib(lib) {
    for ( var key in lib ) {
      var func = lib[key];
      // Note: isInstance is used inside typeChecker,
      //   so avoid infinite loops
      if ( foam.Function.isInstance(func) &&
            key !== 'isInstance' &&
            key !== 'assert' ) {
        lib[key] = foam.Function.typeCheck(func);
      }
    }
  };

  // Upgrade each existing LIB
  for ( var name in foam.__LIBS__ ) {
    upgradeLib(foam.__LIBS__[name]);
  }
  foam.__LIBS__ = null;

  // Decorate foam.LIB to typeCheck new libs
  var oldLIB = foam.LIB;
  foam.LIB = function typeCheckedLIB(model) {
    /** @param {any=} model */
    // Create the lib normally
    oldLIB(model);

    // Find the created LIB
    var root = global;
    var path = model.name.split('.');
    var i;
    for ( i = 0 ; i < path.length ; i++ ) {
      root = root[path[i]];
    }
    upgradeLib(root);
  };
})(); // install type checking


foam.CLASS({
  refines: 'foam.core.Import',

  properties: [
    {
      name: 'name',
      assertValue: function(n) {
        if ( ! /^[a-zA-Z][a-zA-Z0-9_]*?$/.test(n) ) {
          var m = 'Import name "' + n + '" must be a valid variable name.';
          if ( n.indexOf('.') !== -1 ) m += ' Did you mean requires:?';

          foam.assert(false, m);
        }
      }
    }
  ],

  methods: [
    function installInClass(c) {
      /** @param {any} c */
      // Produce warning for duplicate imports
      if ( c.getSuperAxiomByName(this.name) ) {
        // TODO(adamvy): Don't warn if ancestor import is equal to this one.
        // Will be done when we have .compareTo() and/or .equals() support
        // on FObjects.
        console.warn(
          'Import "' + this.name + '" already exists in ancestor class of ' +
          c.id + '.');
      }
    }
  ]
});
