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

/**
 * Specific flavour of methods for the methods on an interface.
 *
 * installInProto does nothing, and they're tagged as abstract.
 */
foam.CLASS({
  package: 'foam.core.internal',
  name: 'InterfaceMethod',
  extends: 'foam.core.Method',

  properties: [
    {
      name: 'code',
      required: false
    },
    {
      class: 'Boolean',
      name: 'abstract',
      value: true
    }
  ],

  methods: [
    function installInProto() {
    }
  ]
});


/**
 * Interfaces define a set of properties and methods (with their input/output
 * types, for languages that need them).
 *
 * Classes can add 1 or more interfaces into their <tt>implements: []</tt>
 * array, which will include the properties and methods defined on that
 * interface into the class.
 *
 * Interface methods can have default implementations.
 *
 * <pre>
 * foam.INTERFACE({
 *   package: 'example',
 *   name: 'MyInterface',
 *   properties: ['foo'],
 *   methods: [
 *     {name: 'bar'}
 *   ]
 * });
 *
 * foam.CLASS({
 *   package: 'example',
 *   name: 'SomeClass',
 *   implements: ['example.MyInterface'],
 *
 *   methods: [
 *     function bar() {
 *       return 77;
 *     }
 *   ]
 * });
 *
 * var sc = example.SomeClass.create();
 * sc.foo = 8;
 * sc.bar(); // Returns 77.
 * </pre>
 */
foam.CLASS({
  package: 'foam.core',
  name: 'Interface',

  properties: [
    {
      /** Similar to a Class's <tt>package</tt>. */
      class: 'String',
      name: 'package'
    },
    {
      /** The name of the interface, similar to a Class's <tt>name</tt>. */
      class: 'String',
      name: 'name'
    },
    /* FUTURE: Bring this back if it proves useful.
    {
      /**
       * Interfaces can extend multiple other interfaces, combining their
       * properties and methods.
       * /
      class: 'StringArray',
      name: 'extends'
    },
    */
    {
      /** Combined package and name, as on a class. */
      class: 'String',
      name: 'id',
      getter: function() {
        return this.package ? (this.package + '.' + this.name) : this.name;
      }
    },
    {
      /**
       * Generic array of axioms. Prefer to use one of the specific types, like
       * properties or methods.
       */
      name: 'axioms',
      postSet: function(_, a) { this.axioms_.push.apply(this.axioms_, a); }
    },
    {
      /**
       * The list of methods on this interface. They are converted to
       * <tt>InterfaceMethod</tt>s, which are not installed on prototypes.
       */
      class: 'AxiomArray',
      name: 'methods',
      of: 'foam.core.AbstractMethod',
      adaptArrayElement: function(o) {
        if ( typeof o === 'function' ) {
          foam.assert(o.name, 'Methods must be named');
          return foam.core.Method.create({name: o.name, code: o});
        }

        return foam.core.Method.isInstance(o) ?  o :
            o.code ? foam.core.Method.create(o) :
            foam.core.internal.InterfaceMethod.create(o);
      }
    },
    {
      /** The list of properties on this interface. */
      class: 'PropertyArray',
      name: 'properties'
    },
    {
      /** The list of topics on this interface, like the topics on a Class. */
      class: 'AxiomArray',
      name: 'topics',
      of: 'foam.core.Topic',
      adaptArrayElement: function(o) {
        return typeof o === 'string'        ?
          foam.core.Topic.create({name: o}) :
          foam.core.Topic.create(o)         ;
      }
    },
    {
      name: 'axioms_',
      factory: function() { return []; }
    }
  ],

  methods: [
    function getAxiomByName(name) {
      /**
       * Fetches an axiom (property, method, topic, etc.) by name.
       *
       * For compatibility with classes.
       * @param {String} name
       */
      return this.axioms_.filter(function(a) {
        return a.name === name;
      })[0];
    },

    function getAxiomsByClass(cls) {
      /**
       * Fetches a list of axioms (property, method, topic, etc.) by their class.
       *
       * For compatibility with classes.
       * @param {any} cls
       */
      return this.axioms_.filter(function(a) {
        return cls.isInstance(a);
      });
    },

    function getOwnAxiomsByClass(cls) {
      /**
       * Fetches a list of axioms (property, method, topic, etc.) by their class.
       * Restricts the search to this interface only, not any interfaces it
       * extends.
       *
       * For compatibility with classes.
       * @param {any} cls
       */
      return this.getAxiomsByClass(cls);
    },

    function hasOwnAxiom(name) {
      /**
       * Returns true if this interface supports an axiom with the given name.
       *
       * For compatibility with classes.
       * @param {String} name
       */
      return this.axioms_.some(function(a) { return a.name === name; });
    },

    function isInstance(o) {
      /**
       * Returns true if the input object's class implements this interface
       * (transitively).
       * @param {any=} o
       */
      return !! (
        o && o.cls_ && o.cls_.getAxiomByName('implements_' + this.id)
      );
    },

    function isSubClass(c) {
      /**
       * Returns true if the input object's class implements this interface
       * (transitively).
       * @param {any=} c
       */
      if ( ! c || ! c.id ) return false;
      return c.getAxiomByName && !! c.getAxiomByName('implements_' + this.id);
    }
  ]
});


foam.LIB({
  name: 'foam',

  methods: [
    function INTERFACE(m) {
      /**
       * Top-level function for defining a new interface, like foam.CLASS().
       * @param {Object} m
       */
      var model = foam.core.Interface.create(m);
      foam.register(model);
      foam.package.registerClass(model);
    }
  ]
});
