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
  AbstractClass is the root of FOAM's class hierarchy.
  The FObject Class extends AbstractClass.

  For details on how AbstractClass fits in to the FOAM class system,
  see the documentation in the top of Boot.js
 */
foam.LIB({
  name: 'foam.AbstractClass',

  // documentation: "Root prototype for all classes.",

  constants: {
    prototype: Object.prototype,

    // axiomMap_ maps axiom names to the actual axiom objects that have
    // been installed into AbstractClass
    axiomMap_: {}
  },

  methods: [
    /**
      Create a new instance of this class.
      Configured from values taken from 'args', if supplifed.
    */
    function create(args, opt_parent) {
      var obj = Object.create(this.prototype);

      // Properties have their values stored in instance_ instead
      // of on the object directly. This lets us defineProperty on
      // the object itself so that we can add extra behaviour
      // to properties (things like preSet, postSet, firing property-
      // change events, etc.).
      obj.instance_ = {};

      // initArgs() is the standard argument extraction method.
      obj.initArgs(args, opt_parent);

      // init(), if defined, is called when object is created.
      // This is where class-specific initialization code should
      // be put (not in initArgs).
      obj.init && obj.init();

      return obj;
    },

    /**
      Install an Axiom into the class and prototype.
      Invalidate the axiom-cache, used by getAxiomsByName().

      FUTURE: Wait for first object to be created before creating prototype.
      Currently it installs axioms into the protoype immediately, but it should
      wait until the first object is created. This will provide
      better startup performance.
    */
    function installAxiom(a) {
      console.assert(a !== null && typeof a === 'object',
                     'Axiom is not an object.');

      console.assert(a.installInClass || a.installInProto,
                     'Axiom amust define one of installInClass or ' +
                     'installInProto');

      this.axiomMap_[a.name] = a;
      this.private_.axiomCache = {};

      a.installInClass && a.installInClass(this);
      a.installInProto && a.installInProto(this.prototype);
    },

    /**
      Determine if an object is an instance of this class
      or one of its sub-classes.
    */
    function isInstance(o) {
      return !! ( o && o.cls_ && this.isSubClass(o.cls_) );
    },

    /** Determine if a class is either this class or a sub-class. */
    function isSubClass(c) {
      if ( ! c ) return false;

      var cache = this.private_.isSubClassCache ||
        ( this.private_.isSubClassCache = {} );

      if ( cache[c.id] === undefined ) {
        cache[c.id] = ( c === this.prototype.cls_ ) ||
          this.isSubClass(c.__proto__);
      }

      return cache[c.id];
    },

    /** Find an axiom by the specified name from either this class or an ancestor. */
    function getAxiomByName(name) {
      return this.axiomMap_[name];
    },

    /**
      Returns all axioms defined on this class or its parent classes
      that are instances of the specified class.
    */
    function getAxiomsByClass(cls) {
      // FUTURE: Add efficient support for:
      //    .where() .orderBy() .groupBy()
      var as = this.private_.axiomCache[cls.id];
      if ( ! as ) {
        as = [];
        for ( var key in this.axiomMap_ ) {
          var a = this.axiomMap_[key];
          if ( cls.isInstance(a) ) as.push(a);
        }
        this.private_.axiomCache[cls.id] = as;
      }

      return as;
    },

    /**
      Return true if an axiom named "name" is defined on this class
      directly, regardless of what parent classes define.
    */
    function hasOwnAxiom(name) {
      return this.axiomMap_.hasOwnProperty(name);
    },

    /** Returns all axioms defined on this class or its parent classes. */
    function getAxioms() {
      // The full axiom list is stored in the regular cache with '' as a key.
      var as = this.private_.axiomCache[''];
      if ( ! as ) {
        as = [];
        for ( var key in this.axiomMap_ ) as.push(this.axiomMap_[key]);
        this.private_.axiomCache[''] = as;
      }
      return as;
    },

    // NOP, is replaced if debug.js is loaded
    function validate() { },

    function toString() { return this.name + 'Class'; },

    /**
      Temporary Bootstrap Implementation

      This is a temporary version of installModel.
      When the bootstrap is finished, it will be replaced by a
      version that only knows how to install axioms in Boot.js phase3().

      It is easier to start with hard-coded method and property
      support because Axioms need methods to install themselves
      and Property Axioms themselves have properties.

      However, once we've bootstrapped proper Property and Method
      Axioms, we can remove this support and just install Axioms.
    */
    function installModel(m) {
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
           The long-form will support many options (many of which are defined
           in Method.js), but only 'name' and 'code' are mandatory.
       */
      if ( m.methods ) {
        for ( var i = 0 ; i < m.methods.length ; i++ ) {
          var a = m.methods[i];
          if ( typeof a === 'function' ) {
            m.methods[i] = a = { name: a.name, code: a };
          }
          this.prototype[a.name] = a.code;
        }
      }
      /*
        Properties can be defined using three formats:
        1. Short-form String:  'firstName' or 'sex'

        2. Medium-form Array:  [ 'firstName', 'John' ] or [ 'sex', 'Male' ]
           The first element of the array is the name and the second is the
           default value.

        3. Long-form JSON:     { class: 'String', name: 'sex', value: 'Male' }
           The long-form will support many options (many of which are defined
           in Property.js), but only 'name' is mandatory.
       */
      if ( foam.core.Property && m.properties ) {
        for ( var i = 0 ; i < m.properties.length ; i++ ) {
          var a = m.properties[i];

          if ( Array.isArray(a) ) {
            m.properties[i] = a = { name: a[0], value: a[1] };
          } else if ( typeof a === 'string' ) {
            m.properties[i] = a = { name: a };
          }

          var type = foam.lookup(a.class, true) || foam.core.Property;
          console.assert(
            type !== a.cls_,
            'Property', a.name, 'on', m.name,
            'has already been upgraded to a Property.');

          a = type.create(a);

          this.installAxiom(a);
        }
      }
    }
  ]
});
