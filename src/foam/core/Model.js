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

 FObject -> FObject Class                     Prototype
    ^                        +-.prototype---------^
    |                        |                    |
  Model  -> buildClass()  -> Class -> create() -> instance
</pre>
  FObject is the root model/class of all classes, including Model.
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
foam.CLASS({
  package: 'foam.core',
  name: 'Model',
  extends: 'FObject', // Isn't the default yet.

  properties: [
    {
      name: 'id',
      getter: function() {
        return this.package ? this.package + '.' + this.name : this.name;
      }
    },
    'package',
    'abstract',
    'name',
    {
      name: 'flags',
      factory: function() { return {}; }
    },
    ['extends', 'FObject'],
    'refines',
    {
      // List of all axioms, including methods, properties, listeners,
      // etc. and 'axioms'.
      name: 'axioms_',
      factory: function() { return []; }
    },
    {
      // List of extra axioms. Is added to axioms_.
      name: 'axioms',
      factory: function() { return []; },
      postSet: function(_, a) { this.axioms_.push.apply(this.axioms_, a); }
    },
    {
      // Is upgraded to an AxiomArray later.
      of: 'Property',
      name: 'properties'
    },
    {
      // Is upgraded to an AxiomArray later.
      of: 'Method',
      name: 'methods'
    }
  ],

  methods: [foam.boot.buildClass]
});
