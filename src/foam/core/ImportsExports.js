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
  Imports and Exports provide implicit Context dependency management.

  A class can list which values it requires from the Context, and then
  these values will be added to the object itself so that it doesn't need
  to explicitly work with the Context.

  A class can list which values (properties, methods, or method-like axioms)
  that it exports, and these will automatically be added to the object's
  sub-Context. The object's sub-Context is the context that is used when
  new objects are created by the object.

  Ex.
<pre>
foam.CLASS({
  name: 'ImportsTest',

  imports: ['log', 'warn'],

  methods: [
    function foo() {
      this.log('log foo from ImportTest');
      this.warn('warn foo from ImportTest');
    }
  ]
});

foam.CLASS({
  name: 'ExportsTest',
  requires: ['ImportsTest'],

  exports: ['log', 'log as warn'],

  methods: [
    function init() {
      // ImportsTest will be created in ExportTest's
      // sub-Context, which will have 'log' and 'warn'
      // exported.
      this.ImportsTest.create().foo();
    },
    function log(msg) {
      console.log('log:', msg);
    }
  ]
});
</pre>

  Aliasing:
    Bindings can be renamed or aliased when they're imported or exported using
    'as alias'.

  Examples:
<pre>
    // import 'userDAO' from the Context and make available as this.dao
    imports: ['userDAO as dao']

    // export my log method as 'warn'
    exports: ['log as warn']

    // If the axiom to be exported isn't named, but just aliased, then 'this'
    // is exported as the named alias.  This is how objects export themselves.
    exports: ['as Controller']
</pre>
  See Context.js.
 */
foam.CLASS({
  package: 'foam.core',
  name: 'Import',

  properties: [
    'name',
    'key',
    {
      class: 'Boolean',
      name: 'required',
      value: true
    },
    {
      name: 'slotName_',
      factory: function() {
        return foam.String.toSlotName(this.name);
      }
    }
  ],

  methods: [
    function installInProto(proto) {
      /** @param {any} proto */

      var name     = this.name;
      var key      = foam.String.toSlotName(this.key);
      var slotName = this.slotName_;

      var slotGetter = this.required ? function importsSlotGetter() {
        var slot = this.__context__[key];
        foam.assert(slot, 'Access missing import:', key);
        return slot;
      } : function importsSlotGetter() {
        var slot = this.__context__[key];
        if ( slot ) return slot;
        return undefined;
      };


      Object.defineProperty(proto, slotName, {
        get: slotGetter,
        configurable: false,
        enumerable: false
      });

      var getter =
        this.required ? function importsGetter()  {
          var slot = this[slotName];
          foam.assert(slot, 'Access missing import:', name);
          return slot.get();
        } : function importsGetter() {
          var slot = this[slotName];
          if ( slot ) return slot.get();
          return undefined;
        };

      var setter = function importsSetter(v) {
        var slot = this[slotName];
        foam.assert(slot, 'Attempt to set missing import:', name);
        slot.set(v);
      };

      Object.defineProperty(proto, name, {
        get: getter,
        set: setter,
        configurable: true,
        enumerable: false
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Export',

  documentation: 'Export Sub-Context Value Axiom',

  properties: [
    'name',
    {
      name: 'exportName',
      postSet: function(_, name) {
        this.name = '__export_' + name;
      }
    },
    'key'
  ],

  methods: [
    function installInProto(proto) {
      /** @param {any} proto */

      // Every export on a model is its own axiom, but the __subContext__
      // getter we define actually builds a subContext with all the exports
      // present. So we only need to define the __subContext__ once on the
      // proto, if a previous Export axiom defined it (or a parent class) then
      // we can just return early.
      if ( Object.prototype.hasOwnProperty.call(proto, '__subContext__' ) ) {
        return;
      }

      Object.defineProperty(proto, '__subContext__', {
        get: function YGetter() {
          if ( ! this.hasOwnPrivate_('__subContext__') ) {
            var ctx = this.__context__;
            var m = {};
            var bs = proto.cls_.getAxiomsByClass(foam.core.Export);
            for ( var i = 0 ; i < bs.length ; i++ ) {
              var b = bs[i];

              if ( b.key ) {
                var a = this.cls_.getAxiomByName(b.key);

                foam.assert(!! a, 'Unknown export: "', b.key, '" in model: ',
                    this.cls_.id);

                // Axioms have an option of wrapping a value for export.
                // This could be used to bind a method to 'this', for example.
                m[b.exportName] = a.exportAs ? a.exportAs(this) : this[b.key];
              } else {
                // Exports that don't have a key mean that we are exporting
                // 'this'.  So if you did exports: ['as Bank'], that would
                // mean that we are exporting 'this' as Bank.
                //
                // Anyone who imported 'Bank' would get a reference to the
                // object which had the export.
                m[b.exportName] = this;
              }
            }
            this.setPrivate_('__subContext__', ctx.createSubContext(m));
          }

          return this.getPrivate_('__subContext__');
        },
        set: function() {
          throw new Error('Attempted to set unsettable __subContext__ in ' +
              this.cls_.id);
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
      of: 'Import',
      name: 'imports',
      adaptArrayElement: function(o) {
        if ( typeof o === 'string' ) {
          var a        = o.split(' as ');
          var key      = a[0];
          var optional = key.endsWith('?');
          if ( optional ) key = key.slice(0, key.length - 1);

          return foam.core.Import.create({
            name: a[1] || key,
            key: key,
            required: ! optional
          });
        }

        return foam.core.Import.create(o);
      }
    },
    {
      class: 'AxiomArray',
      of: 'Export',
      name: 'exports',
      adaptArrayElement: function(o) {
        if ( typeof o === 'string' ) {
          var a = o.split(' ');

          switch ( a.length ) {
            case 1:
              return foam.core.Export.create({exportName: a[0], key: a[0]});

            case 2:
              // Export 'this'
              foam.assert(
                  a[0] === 'as',
                  'Invalid export syntax: key [as value] | as value');
              return foam.core.Export.create({exportName: a[1], key: null});

            case 3:
              foam.assert(
                  a[1] === 'as',
                  'Invalid export syntax: key [as value] | as value');
              return foam.core.Export.create({exportName: a[2], key: a[0]});

            default:
              foam.assert(false,
                  'Invalid export syntax: key [as value] | as value');
          }
        }

        return foam.core.Export.create(o);
      }
    }
  ]
});
