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
 FOAM Bootstrap
<p>
 FOAM uses Models to specify class definitions.
 The FOAM Model class is itself specified with a FOAM model, meaning
 that Model is defined in the same language which it defines.
 This self-modeling system requires some care to bootstrap, but results
 in a very compact, uniform, and powerful system.
<pre>
            Abstract Class
                  ^
                  |
 FObject -> FObject Class                     Prototype
    ^                        +-.prototype---------^
    |                        |                    |
  Model  -> buildClass()  -> Class -> create() -> instance
</pre>
  FObject is the root model/class of all other classes, including Model.
  Abstract Class is the prototype of FObject's Class, which makes it the root of all Classes.
  From a Model we call buildClass() to create a Class (or the previously created Class) object.
  From the Class we call create() to create new instances of that class.
  New instances extend the classes prototype object, which is stored on the class as .prototype.
<pre>
  instance ---> .cls_   -> Object's Class
       |
       +------> .model_ -> Object's Model
</pre>
  All descendents of FObject have references to both their Model and Class.
    - obj.cls_ refers to an Object's Class
    - obj.model_ refers to an Object's Model

<p>  Classes also refer to their Model with .model_.

<p>  Model is its own definition:
<pre>
    Model.buildClass().create(Model) == Model
    Model.model_ === Model
</pre>
  Models are defined as a collection of Axioms.
  It is the responsibility of Axioms to install itself onto a Model's Class and/or Prototype.

<p>
  Axioms are defined with the following psedo-interface:
<pre>
    public interface Axiom {
      optional installInClass(cls)
      optional installInProto(proto)
    }
</pre>
  Ex. of a Model with one Axiom:
<pre>
  foam.CLASS({
    name: 'Sample',

    axioms: [
      {
        name: 'axiom1',
        installInClass: function(cls) { ... },
        installInProto: function(proto) { ... }
      }
    ]
  });
</pre>
  Axioms can be added either during the initial creation of a class and prototype,
  or anytime after.  This allows classes to be extended with new functionality,
  and this is very important to the bootstrap process because it allows us to
  start out with very simple definitions of Model and FObject, and then build
  them up until they're fully bootstrapped.
<p>
  However, raw axioms are rarely used directly. Instead we model higher-level
  axiom types, including:
<ul>
  <li>Requires   - Require other classes
  <li>Imports    - Context imports
  <li>Exports    - Context exports
  <li>Implements - Declare interfaces implemented / mix-ins mixed-in
  <li>Constants  - Add constants to the prototype and class
  <li>Properties - High-level instance variable definitions
  <li>Methods    - Prototype methods
  <li>Topics     - Publish/sub topics
  <li>Listeners  - Like methods, but with extra features for use as callbacks
</ul>

*/


/**
 Bootstrap support.

 Is discarded after use.
*/
foam.LIB({
  name: 'foam.boot',

  constants: {
    startTime: Date.now(),
  },

  methods: [
    /**
      Create or Update a Prototype from a Model definition.

      This will be added as a method on the Model class
      when it is eventually built.

      (Model is 'this').
    */
    function buildClass() {
      var context = foam.__context__;
      var cls;

      if ( this.refines ) {
        cls = context.lookup(this.refines);
        console.assert(cls, 'Unknown refinement class: ' + this.refines);
      } else {
        console.assert(this.id, 'Missing id name.', this.name);
        console.assert(this.name, 'Missing class name.');

        var parent = this.extends      ?
          context.lookup(this.extends) :
          foam.AbstractClass;

        cls                  = Object.create(parent);
        cls.prototype        = Object.create(parent.prototype);
        cls.prototype.cls_   = cls;
        cls.prototype.model_ = this;
        cls.private_         = { axiomCache: {} };
        cls.axiomMap_        = Object.create(parent.axiomMap_);
        cls.id               = this.id;
        cls.package          = this.package;
        cls.name             = this.name;
        cls.model_           = this;
      }

      cls.installModel(this);

      return cls;
    },

    function start() {
      /* Start the bootstrap process. */

      var buildClass = this.buildClass;

      // Will be replaced in phase2.
      foam.CLASS = function(m) {
        m.id = m.package + '.' + m.name;
        var cls = buildClass.call(m);

        console.assert(
          ! m.refines,
          'Refines is not supported in early bootstrap');

        foam.register(cls);

        // Register the class in the global package path.
        foam.package.registerClass(cls);

        return cls;
      };
    },

    /** Start second phase of bootstrap process. */
    function phase2() {
      // Upgrade to final CLASS() definition.
      /** Creates a Foam class from a plain-old-object definition.
          @method CLASS
          @memberof module:foam */
      foam.CLASS = function(m) {
        var model = foam.core.Model.create(m);
        model.validate();
        var cls = model.buildClass();
        cls.validate();

        if ( ! m.refines ) {
          foam.register(cls);

          // Register the class in the global package path.
          foam.package.registerClass(cls);
        }

        return cls;
      };

      // Upgrade existing classes to real classes.
      for ( var key in foam.core ) {
        var m = foam.lookup(key).model_;
        m.refines = m.id;
        foam.CLASS(m);
      }
    },

    function phase3() {
      // Substitute AbstractClass.installModel() ( defined in AbstractClass.js ) with
      // the final version.  A simpler axiom-only verion.
      foam.AbstractClass.installModel = function installModel(m) {
        this.private_.axiomCache = {};

        // Install Axioms in first pass so that they're available in the second-pass
        // when axioms are actually run. This avoids some ordering issues.
        for ( var i = 0 ; i < m.axioms_.length ; i++ ) {
          var a = m.axioms_[i];
          console.assert(a !== null && typeof a === 'object',
                         'Axiom is not an object.');
          console.assert(a.installInClass || a.installInProto,
                         'Axiom amust define one of installInClass or ' +
                         'installInProto');

          this.axiomMap_[a.name] = a;
        }

        for ( var i = 0 ; i < m.axioms_.length ; i++ ) {
          var a = m.axioms_[i];
          a.installInClass && a.installInClass(this);
          a.installInProto && a.installInProto(this.prototype);
        }
      };
    },

    /** Finish the bootstrap process, deleting foam.boot when done. */
    function end() {
      var Model = foam.core.Model;

      // Update psedo-Models to real Models
      for ( var key in foam.core ) {
        var c = foam.core[key];
        c.prototype.model_ = c.model_ = Model.create(c.model_);
      }

      delete foam.boot;

      var bootTime = Date.now() - this.startTime;
      foam._BOOT_TIME_ = bootTime;

      console.log('core boot time: ', bootTime);
    }
  ]
});


foam.boot.start();