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

/* globals test */
describe('interfaces', function() {
  it('can be defined, but not create()d', function() {
    foam.INTERFACE({
      package: 'test',
      name: 'IThing',
      methods: [
        {
          name: 'foo',
          returns: 'Number',
          args: [
            {name: 'bar'}
          ]
        }
      ]
    });

    expect(function() { test.IThing.create(); }).toThrow();
  });

  it('can be implemented by a class', function() {
    foam.INTERFACE({
      name: 'IThing',
      methods: [
        {name: 'foo'}
      ]
    });

    foam.CLASS({
      package: 'test',
      name: 'Thing',
      implements: ['IThing'],
    });

    var t = test.Thing.create();
    expect(function() {
      t.foo('asdf');
    }).toThrow();
  });

  it('correctly answer isInstance on classes', function() {
    foam.INTERFACE({package: 'test', name: 'Int1'});
    foam.INTERFACE({package: 'test', name: 'Int2'});
    foam.INTERFACE({package: 'test', name: 'Int3'});

    foam.CLASS({
      package: 'test',
      name: 'Thing',
      implements: ['test.Int1', 'test.Int2']
    });

    var t = test.Thing.create();
    expect(test.Int1.isInstance(t)).toBe(true);
    expect(test.Int2.isInstance(t)).toBe(true);
    expect(test.Int3.isInstance(t)).toBe(false);
  });

  it('mix in to classes that implement them', function() {
    var method = foam.core.Method.create({
      name: 'baz',
      code: function() { return 7; }
    });

    var prop = foam.core.Property.create({name: 'abc'});

    foam.INTERFACE({
      package: 'test',
      name: 'Int1',
      properties: [
        {name: 'foo', value: 7},
        ['defaulting', 4],
        'bare',
        prop
      ],

      axioms: [
        {
          name: 'asdf',
          installInProto: function(p) { p.hjkl = 99; }
        }
      ],

      topics: [
        'event',
        {name: 'otherThing'}
      ],

      methods: [
        function bar(x) {
          return x;
        },
        method
      ]
    });

    foam.CLASS({
      package: 'test',
      name: 'Thing',
      implements: ['test.Int1'],
      properties: [
        'asdf'
      ]
    });

    var t = test.Thing.create();
    expect(test.Thing.ASDF).toBeDefined();
    expect(test.Thing.FOO).toBeDefined();
    expect(t.foo).toBe(7);
    t.foo = 12;
    expect(t.foo).toBe(12);

    expect(t.hjkl).toBe(99);

    expect(function() { t.abc = 8; }).not.toThrow();
    expect(t.abc).toBe(8);

    expect(function() { t.bare = 2; }).not.toThrow();
    expect(t.bare).toBe(2);

    expect(t.defaulting).toBe(4);
    t.defaulting = 99;
    expect(t.defaulting).toBe(99);

    var called = false;
    t.event.sub(function() { called = true; });
    expect(called).toBe(false);
    t.event.pub();
    expect(called).toBe(true);

    called = false;
    t.otherThing.sub(function() { called = true; });
    expect(called).toBe(false);
    t.otherThing.pub();
    expect(called).toBe(true);

    expect(t.bar('baz')).toBe('baz');
    expect(t.baz()).toBe(7);
  });

  it('support extending, and the getAxiom* methods like classes', function() {
    var m = foam.core.Method.create({name: 'mmm'});
    foam.INTERFACE({
      package: 'test',
      name: 'Int1',
      properties: ['foo', 'bar'],
      methods: [m]
    });

    expect(test.Int1.getAxiomByName('mmm')).toBe(m);

    expect(test.Int1.getAxiomsByClass(foam.core.Property).length).toBe(2);
    expect(test.Int1.getOwnAxiomsByClass(foam.core.Property).length).toBe(2);
    expect(test.Int1.hasOwnAxiom('asdf')).toBe(false);
    expect(test.Int1.hasOwnAxiom('bar')).toBe(true);
  });

  it('throw if you try to implement one that does not exist', function() {
    var oldLookup = foam.lookup;
    foam.lookup = function(name) {
      try {
        var m = oldLookup.call(this, name);
        return m;
      } catch (e) {
        return undefined;
      }
    };

    expect(function() {
      foam.CLASS({
        package: 'test',
        name: 'Thing',
        implements: ['test.DoesNotExist']
      });
      test.Thing.create();
    }).toThrow();

    foam.lookup = oldLookup;
  });

  it('throws if you try to mix-in a real class', function() {
    foam.CLASS({
      package: 'test',
      name: 'Mixin',
      properties: ['foo']
    });

    expect(function() {
      foam.CLASS({
        package: 'test',
        name: 'User',
        implements: [{path: 'test.Mixin'}],
        properties: ['bar']
      });
    }).toThrow();
  });

  it('error if multiple interfaces define conflicting properties', function() {
    foam.INTERFACE({
      package: 'test',
      name: 'Int1',
      properties: [
        {class: 'String', name: 'baz'}
      ]
    });
    foam.INTERFACE({
      package: 'test',
      name: 'Int2',
      properties: [
        {class: 'Int', name: 'baz'}
      ]
    });

    var log = global.captureWarn();
    foam.CLASS({
      package: 'test',
      name: 'MultiImplement',
      implements: ['test.Int1', 'test.Int2']
    });

    expect(global.matchingLine(log(), 'Change of Axiom')).toBe(
        'Change of Axiom test.MultiImplement.baz type from ' +
        'foam.core.property.String to foam.core.property.Int');

    var t = test.MultiImplement.create();
    expect(test.MultiImplement.BAZ).toBeDefined();
  });

  it('error if multiple interfaces define conflicting axioms', function() {
    foam.INTERFACE({
      package: 'test',
      name: 'Int1',
      properties: ['bar']
    });

    foam.INTERFACE({
      package: 'test',
      name: 'Int2',
      methods: [
        function bar() {}
      ]
    });

    expect(function() {
      foam.CLASS({
        package: 'test',
        name: 'MultiImplement2',
        implements: ['test.Int1', 'test.Int2']
      });
    }).toThrow();

    var log = global.captureWarn();
    foam.CLASS({
      package: 'test',
      name: 'MultiImplement2',
      implements: ['test.Int2', 'test.Int1']
    });
    expect(global.matchingLine(log(), 'Change of Axiom')).toBe(
        'Change of Axiom test.MultiImplement2.bar type from foam.core.Method ' +
        'to foam.core.Property');
  });

  it('work properly with isSubClass', function() {
    foam.INTERFACE({
      package: 'test',
      name: 'Int',
      methods: [
        function foo() {}
      ]
    });

    foam.CLASS({
      package: 'test',
      name: 'Obj',
      implements: ['test.Int']
    });

    foam.CLASS({
      package: 'test',
      name: 'Child',
      extends: 'test.Obj'
    });

    expect(test.Int.isSubClass(test.Obj)).toBe(true);
    expect(test.Int.isSubClass(null)).toBe(false);
    // Should work for subclasses of the implementer too, transitively.
    expect(test.Int.isSubClass(test.Child)).toBe(true);
  });
});
