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
 * Classes can have "inner classes", which are classes defined within a class,
 * rather than being top-level classes.
 * This helps avoid polluting the namespace with classes which are only used by
 * a single class.
 *
 * Note that inner classes are only a matter of namespacing. They have no
 * special access to their "parent" class. Inner classes are implicitly
 * 'required' in the parent class, as this.MyInnerClass.
 *
 * Inner classes can be accessed by anyone as
 * <tt>foo.bar.OuterClass.InnerClass</tt>.
 *
 * <pre>
 * foam.CLASS({
 *   name: 'InnerClassTest',
 *   classes: [
 *     {name: 'InnerClass1', properties: ['a', 'b']},
 *     {name: 'InnerClass2', properties: ['x', 'y']}
 *   ],
 *   methods: [
 *     function init() {
 *       var ic1 = this.InnerClass1.create({a: 1, b: 2});
 *       var ic2 = this.InnerClass2.create({x: 5, y: 10});
 *       log(ic1.a, ic1.b, ic2.x, ic2.y);
 *     }
 *   ]
 * });
 * InnerClassTest.create();
 * </pre>
 */
foam.CLASS({
  package: 'foam.core',
  name: 'InnerClass',

  properties: [
    {
      name: 'name',
      getter: function() { return this.model.name; }
    },
    {
      name: 'model',
      adapt: function(_, m) {
        return foam.core.Model.isInstance(m) ? m : foam.core.Model.create(m);
      }
    }
  ],

  methods: [
    function installInClass(cls) {
      /** @param {any} cls */
      cls[this.model.name] = this.model.buildClass();
    },

    function installInProto(proto) {
      /** @param {any} proto */

      // Get the class already created in installInClass().
      var name = this.model.name;
      var cls = proto.cls_[name];

      // Create a private_ clone of the Class, with the create() method
      // decorated to pass 'this' as the context if one is not explicitly
      // provided. This ensures that the created object has access to this
      // object's exported bindings.
      Object.defineProperty(proto, name, {
        get: function innerClassgetter() {
          if ( ! this.hasOwnPrivate_(name) ) {
            var parent = this;
            var c = Object.create(cls);

            c.create = function innerClassCreate(args, ctx) {
              return cls.create(args, ctx || parent);
            };
            this.setPrivate_(name, c);
          }

          return this.getPrivate_(name);
        },
        configurable: true,
        enumerable: false
      });
    }
  ]
});

foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'InnerClass',
      name: 'classes',
      // A custom adaptArrayElement is needed because we're passing the model
      // definition as model: rather than as all of the arguments to create().
      adaptArrayElement: function(o) {
        return foam.core.InnerClass.isInstance(o) ?
            o : foam.core.InnerClass.create({model: o});
      }
    }
  ]
});
