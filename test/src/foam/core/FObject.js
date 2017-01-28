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

// jshint undef:false
describe('FObject features', function() {
  it('init() method is called on creation', function() {
    foam.CLASS({
      name: 'ClassA',
      properties: [
        'wasCalled'
      ],
      methods: [
        function init() {
          expect(this.wasCalled).toBeFalsy();
          this.wasCalled = true;
        }
      ]
    });

    var obj = ClassA.create();

    expect(obj.wasCalled).toBe(true);
  });

  it('initArgs', function() {
    foam.CLASS({
      name: 'ClassA',
      properties: [
        'a',
        'b'
      ]
    });

    foam.CLASS({
      name: 'ClassB',
      properties: [
        'a',
        'c'
      ]
    });


    var objSource = ClassA.create({a: 3, b: 4});
    var obj2Source = ClassB.create({a: 5, c: 6});

    // init from plain JS object.
    var obj = ClassA.create({a: 1, b: 2});
    expect(obj.a).toBe(1);
    expect(obj.b).toBe(2);
  });

  it('clone', function() {
    foam.CLASS({
      name: 'ClassA',
      properties: [
        'a',
        'b'
      ]
    });

    var obj = ClassA.create({
      a: 1,
      b: ClassA.create({
        b: 3
      })
    });

    // Clone returns a deep clone of the object.
    var obj2 = obj.clone();

    expect(obj).not.toBe(obj2);

    // Plain values are copied
    expect(obj2.a).toBe(1);

    // Ensure it's deep
    expect(obj2.b).not.toBe(obj.b);
    expect(obj2.b.b).toBe(3);
  });

  it('toString', function() {
    foam.CLASS({
      name: 'ClassA'
    });

    expect(ClassA.create().toString()).toBe('ClassA');
    expect(ClassA.prototype.toString()).toBe('ClassAProto');
  });


  it('clearProperty', function() {
    foam.CLASS({
      name: 'SomeClass',
      axioms: [
        {
          name: 'nonPropertyAxiom',
          installInProto: function() {}
        }
      ],
      properties: [
        {
          name: 'a',
          value: 123
        }
      ]
    });

    var obj = SomeClass.create();
    obj.a = 12;
    expect(obj.a).toBe(12);

    // clearProperty reverts the value to its default.
    obj.clearProperty('a');
    expect(obj.a).toBe(123);

    // No errors if you clear an already cleared property.
    obj.clearProperty('a');
    expect(obj.a).toBe(123);

    // clearProperty errors on non-property axioms;
    // properties
    expect(function() {
      obj.clearProperty('nonPropertyAxiom');
    }).toThrow();

    // Also errors on unknown axioms.
    expect(function() {
      obj.clearProperty('asdfasdfasdfasdf');
    }).toThrow();
  });

  it('private_ support', function() {
    foam.CLASS({
      name: 'SomeClass',
      methods: [
        function testPrivates() {
          // Clearing unknown private doesn't break anything.
          // Privates are not modeled like properties, its a
          // free for all key/value store.
          expect(this.clearPrivate_('asdfasdf'));

          expect(this.getPrivate_('foo')).toBe(undefined);

          expect(this.hasOwnPrivate_('foo')).toBeFalsy();

          expect(this.setPrivate_('foo', 'bar')).toBe('bar');

          expect(this.hasOwnPrivate_('foo')).toBeTruthy();

          expect(this.getPrivate_('foo')).toBe('bar');

          this.clearPrivate_('foo');

          expect(this.hasOwnPrivate_('foo')).toBeFalsy();

          expect(this.getPrivate_('foo')).toBe(undefined);
        }
      ]
    });

    var obj = SomeClass.create();
    obj.testPrivates();
  });

  it('pub/sub support', function() {
    foam.CLASS({
      name: 'SomeClass'
    });

    var obj = SomeClass.create();

    var wasCalled1 = false;
    var wasCalled2 = false;
    var wasCalled3 = false;
    var count;

    count = obj.pub();
    expect(count).toBe(0);

    var s1 = obj.sub('some', 'topic', function(s, a, b, c) {
      wasCalled1 = true;
      expect(a).toBe('some');
      expect(b).toBe('topic');
      expect(c).toBe('value');

      // No harm calling detach multiple times.
      s.detach();
      s.detach();
    });

    expect(obj.hasListeners('some')).toBe(false);
    expect(obj.hasListeners('some', 'topic')).toBe(true);
    expect(obj.hasListeners('some', 'topic', '123')).toBe(true);
    expect(obj.hasListeners('something', 'else')).toBe(false);

    var s2 = obj.sub('some', 'topic', function(s, a, b, c) {
      wasCalled2 = true;
      expect(a).toBe('some');
      expect(b).toBe('topic');
    });

    var listener3 = function(s, a, b, c) {
      wasCalled3 = true;
      expect(a).toBe('some');
    };

    var s3 = obj.sub('some', listener3);

    count = obj.pub('some', 'topic', 'value');

    expect(count).toBe(3);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(true);
    expect(wasCalled3).toBe(true);

    wasCalled1 = wasCalled2 = wasCalled3 = false;

    count = obj.pub('some', 'topic');

    // First listener destoryed itself via s.detach();
    expect(wasCalled1).toBe(false);

    expect(wasCalled2).toBe(true);
    expect(wasCalled3).toBe(true);
    expect(count).toBe(2);

    wasCalled1 = wasCalled2 = wasCalled3 = false;

    count = obj.pub('some', 'othertopic', 'foo', 'asdfasdf');

    expect(wasCalled1).toBe(false);

    // Second listener doesn't match the 'some', 'othertopic'
    expect(wasCalled2).toBe(false);

    expect(wasCalled3).toBe(true);
    expect(count).toBe(1);

    // Can unsubscribe by detaching the returned object
    s2.detach();

    wasCalled1 = wasCalled2 = wasCalled3 = false;

    count = obj.pub('some', 'topic');

    expect(wasCalled1).toBe(false);

    // Listener 2 has been unsubscribed via s2.detach()
    expect(wasCalled2).toBe(false);
    expect(wasCalled3).toBe(true);
  });

  // Provides coverage of all cases when a subscription is
  // removed from the linked list.
  it('pub/sub unsubscribing code coverage', function() {
    foam.CLASS({
      name: 'SomeClass'
    });

    var obj = SomeClass.create();

    var wasCalled1 = false;
    var wasCalled2 = false;
    var wasCalled3 = false;
    var wasCalled4 = false;
    var wasCalled5 = false;

    var listener1 = function() { wasCalled1 = true; };
    var listener2 = function() { wasCalled2 = true; };
    var listener3 = function() { wasCalled3 = true; };
    var listener4 = function() { wasCalled4 = true; };
    var listener5 = function() { wasCalled5 = true; };

    var s1 = obj.sub('a', 'b', 'c', listener1);
    var s2 = obj.sub('a', 'b', 'c', listener2);
    var s3 = obj.sub('a', 'b', 'c', listener3);
    var s4 = obj.sub('a', 'b', 'c', listener4);
    var s5 = obj.sub('a', 'b', 'c', listener5);


    // nodes in the list are in reverse order of subscription.

    // detach the last node
    s1.detach();

    // detach first node in the list
    s5.detach();

    // detach a middle node
    s3.detach();

    var count = obj.pub('a', 'b', 'c');

    expect(count).toBe(2);
    expect(wasCalled1).toBe(false);
    expect(wasCalled2).toBe(true);
    expect(wasCalled3).toBe(false);
    expect(wasCalled4).toBe(true);
    expect(wasCalled5).toBe(false);
  });

  // Tests for long topics, non-string topics.
  // Provides coverage of special optimization code paths.
  it('pub/sub special cases', function() {
    foam.CLASS({
      name: 'SomeClass'
    });

    var obj = SomeClass.create();

    var s1;
    var wasCalled1 = false;
    var listener1 = function() {
      wasCalled1 = true;
    };

    var s2;
    var wasCalled2 = false;
    var listener2 = function() {
      wasCalled2 = true;
    };

    s1 = obj.sub(listener1);
    s2 = obj.sub(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, listener2);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub();
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2, 3);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2, 3, 4);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2, 3, 4, 5);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2, 3, 4, 5, 6);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2, 3, 4, 5, 6, 7);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2, 3, 4, 5, 6, 7, 8);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2, 3, 4, 5, 6, 7, 8, 9);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(false);

    wasCalled1 = false;
    wasCalled2 = false;
    obj.pub(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(true);

    s1.detach();
    s2.detach();


    // Topics are automatically turned to strings.
    var topicObj = {
      toString: function() {
        return 'foo';
      }
    };

    var now = Date.now();
    var dateNow = new Date(now);
    var stringNow = dateNow.toString();

    // Both subscription are to the same topic, since each
    // argument evaluates to the same string.
    obj.sub('topic', topicObj, dateNow,       listener1);
    obj.sub('topic', 'foo',    new Date(now), listener2);

    wasCalled1 = wasCalled2 = false;
    obj.pub('topic', topicObj, new Date(now));
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(true);

    wasCalled1 = wasCalled2 = false;
    obj.pub('topic', 'foo', stringNow);
    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(true);
  });

  it('pub/sub unsub during pub does not lose events', function() {
    // A common bug in pubsub systems is losing events when
    // someone unsubscribes while an event is being published.
    // This is a regression test that helps ensure the FObject pub/sub
    // doesn't lose events.


    foam.CLASS({
      name: 'SomeClass'
    });

    var obj = SomeClass.create();

    var wasCalled1 = false;
    var wasCalled2 = false;

    obj.sub('a', function(s) {
      s.detach();
      wasCalled1 = true;
    });

    obj.sub('a', function(s) {
      s.detach();
      wasCalled2 = true;
    });

    obj.pub('a');

    expect(wasCalled1).toBe(true);
    expect(wasCalled2).toBe(true);
  });

  it('property slot support', function() {
    foam.CLASS({
      name: 'SomeClass',
      properties: [
        'abc'
      ]
    });

    var obj = SomeClass.create({
      abc: 12
    });
    var slot = obj.abc$;

    // Fetching the slot twice returns the same object.
    expect(slot).toBe(obj.abc$);

    expect(slot.get()).toBe(12);
    slot.set(100);

    expect(obj.abc).toBe(100);

    var objB = SomeClass.create();

    expect(function() {
      // Currently unsupported.
      obj.abc$ = objB.abc$;
    }).toThrow();
  });

  it('property change events', function() {
    foam.CLASS({
      name: 'SomeClass',
      properties: [
        'propertyA',
        'propertyB'
      ]
    });

    var obj = SomeClass.create();

    // Set the property once with no listeners added to ensure
    // coverage of that case.
    obj.propertyA = 1;

    var propertyAChangedWasCalled = false;
    var aSub = obj.sub('propertyChange', 'propertyA', function() {
      propertyAChangedWasCalled = true;
    });

    var anyPropertyChangedWasCalled = false;
    var allSub = obj.sub('propertyChange', function() {
      anyPropertyChangedWasCalled = true;
    });

    expect(anyPropertyChangedWasCalled).toBe(false);
    expect(propertyAChangedWasCalled).toBe(false);

    obj.propertyA = 12;

    expect(anyPropertyChangedWasCalled).toBe(true);
    expect(propertyAChangedWasCalled).toBe(true);

    anyPropertyChangedWasCalled = false;
    propertyAChangedWasCalled = false;

    obj.propertyB = 24;

    expect(anyPropertyChangedWasCalled).toBe(true);
    expect(propertyAChangedWasCalled).toBe(false);

    anyPropertyChangedWasCalled = false;
    propertyAChangedWasCalled = false;

    // Property change not published if the property is set
    // to its current value.
    obj.propertyB = 24;

    expect(anyPropertyChangedWasCalled).toBe(false);
    expect(propertyAChangedWasCalled).toBe(false);


    anyPropertyChangedWasCalled = false;
    propertyAChangedWasCalled = false;

    obj.clearProperty('propertyA');

    expect(anyPropertyChangedWasCalled).toBe(true);
    expect(propertyAChangedWasCalled).toBe(true);
  });

  it('propertyChange event arguments', function() {
    foam.CLASS({
      name: 'SomeClass',
      properties: [
        {
          name: 'abc'
        }
      ]
    });

    var obj = SomeClass.create({abc: 12});

    var wasCalled = false;
    obj.sub('propertyChange', 'abc', function(s, pc, abc, slot, oldValue) {
      wasCalled = true;

      expect(pc).toBe('propertyChange');
      expect(abc).toBe('abc');

      expect(slot.get()).toBe(100);

      expect(oldValue).toBe(12);
    });

    obj.abc = 100;

    expect(wasCalled).toBe(true);
  });

  it('no property change from factory', function() {
    foam.CLASS({
      name: 'SomeClass',
      properties: [
        {
          name: 'abc',
          factory: function() {
            return 12;
          }
        }
      ]
    });

    var obj = SomeClass.create();

    var wasCalled = false;
    obj.sub('propertyChange', function() {
      wasCalled = true;
    });

    // Trigger the factory
    expect(obj.abc).toBe(12);

    // Event was not published because the value
    // was "set" from a factory.
    expect(wasCalled).toBe(false);
  });

  it('clearProperty propertyChange events', function() {
    foam.CLASS({
      name: 'SomeClass',
      properties: [
        {
          name: 'abc',
          factory: function() {
            return 12;
          }
        }
      ]
    });

    var obj = SomeClass.create();

    var wasCalled = false;
    obj.sub('propertyChange', 'abc', function() {
      wasCalled = true;
    });

    expect(obj.abc).toBe(12);

    expect(wasCalled).toBe(false);

    // Clearing the property will fire a property change event
    // even if the value of the property will be the same
    // because it came from a factory
    obj.clearProperty('abc');

    expect(wasCalled).toBe(true);

    wasCalled = false;

    expect(obj.abc).toBe(12);

    // But the factory still won't trigger a property change event.
    expect(wasCalled).toBe(false);
  });

  it('supports detach and onDetach', function() {
    var obj1 = foam.lookup('foam.core.FObject').create();

    var wasCalled = 0;
    obj1.sub('abc', function() { wasCalled++; });

    obj1.pub('abc');
    expect(wasCalled).toBe(1);

    obj1.detach();

    // Listeners were removed on detach.
    wasCalled = 0;
    obj1.pub('abc');
    expect(wasCalled).toBe(0);

    var obj2 = foam.lookup('foam.core.FObject').create();
    var simpleCalled = false;
    var detachableCalled = false;
    obj2.onDetach(function() {
      simpleCalled = true;

      // Detach() is protected from infinite recursion.
      expect(function() {
        obj2.detach();
      }).not.toThrow();
    });
    obj2.onDetach({
      detach: function() { detachableCalled = true; }
    });

    // onDetach should ignore empty values.
    obj2.onDetach(null);

    // onDetach should throw if the input is not a detachable.
    expect(function() {
      obj2.onDetach({detach: 7});
    }).toThrow();
    expect(function() {
      obj2.onDetach(7);
    }).toThrow();

    expect(simpleCalled).toBe(false);
    expect(detachableCalled).toBe(false);
    obj2.detach();
    expect(simpleCalled).toBe(true);
    expect(detachableCalled).toBe(true);

    // Detaching again should be safe.
    expect(function() {
      obj2.detach();
    }).not.toThrow();
  });
});

describe('Library level FObject methods', function() {
  it('getAxiomsByClass', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        {
          name: 'someProperty'
        }
      ],
      methods: [
        {
          name: 'someMethod',
          code: function() {}
        },
        {
          name: 'someOtherMethod',
          code: function() {}
        }
      ]
    });

    var properties = Abc.getAxiomsByClass(foam.core.Property);

    expect(properties.length).toBe(1);

    // Fetch again to ensure coverage of caching
    var properties2 = Abc.getAxiomsByClass(foam.core.Property);

    expect(properties2.length).toBe(properties.length);
    expect(properties2[0]).toBe(properties[0]);

    var methods = Abc.getAxiomsByClass(foam.core.Method);

    var found = {};

    for ( var i = 0 ; i < methods.length ; i++ ) {
      var method = methods[i];
      expect(foam.core.Method.isInstance(method)).toBe(true);
      found[method.name] = true;
    }
    expect(found.someMethod).toBe(true);
    expect(found.someOtherMethod).toBe(true);
  });

  it('hasOwnAxiom', function() {
    foam.CLASS({
      name: 'Parent',
      properties: [
        'a'
      ]
    });

    foam.CLASS({
      name: 'Child',
      extends: 'Parent',
      properties: [
        'b'
      ]
    });

    expect(Child.getAxiomByName('b')).toBeTruthy();
    expect(Child.getAxiomByName('a')).toBeTruthy();
    expect(Child.hasOwnAxiom('b')).toBeTruthy();
    expect(Child.hasOwnAxiom('a')).toBeFalsy();
  });

  it('getSuperAxiomByName', function() {
    foam.CLASS({
      name: 'Parent',
      properties: [
        'a'
      ]
    });

    foam.CLASS({
      name: 'Child',
      extends: 'Parent',
      properties: [
        'a'
      ]
    });

    expect(Child.getSuperAxiomByName('a')).toBe(Parent.getAxiomByName('a'));
  });

  it('toString', function() {
    foam.CLASS({
      name: 'Abc'
    });

    expect(Abc.toString()).toBe('AbcClass');
  });

  it('anonymous axioms are verified', function() {
    expect(function() {
      foam.CLASS({
        name: 'SomeClass',
        axioms: [
          {
            name: 'axiomMissingInstallInClassOrProto'
          }
        ]
      });
    }).toThrow();
  });

  it('installAxiom imperatively', function() {
    foam.CLASS({
      name: 'SomeClass'
    });

    expect(function() {
      SomeClass.installAxiom({
        name: 'axiomMissingInstallInClassOrProto2'
      });
    }).toThrow();
  });

  it('instance count', function() {
    foam.CLASS({
      name: 'SomeClass'
    });

    expect(SomeClass.count_).toBe(0);
    SomeClass.create();
    expect(SomeClass.count_).toBe(1);
    SomeClass.create();
    expect(SomeClass.count_).toBe(2);
  });

  it('refine warning', function() {
    foam.CLASS({
      name: 'SomeClass'
    });

    var capture = captureWarn();

    foam.CLASS({
      refines: 'SomeClass',
      exports: ['foo']
    });

    expect(global.matchingLine(capture(), 'Refining class')).toBe(undefined);

    SomeClass.create();

    capture = captureWarn();

    foam.CLASS({
      refines: 'SomeClass',
      exports: ['bar']
    });

    expect(global.matchingLine(capture(), 'Refining class')).toBe(
        'Refining class "SomeClass", which has already created instances.');

    capture = captureWarn();

    foam.CLASS({
      refines: 'SomeClass',
      flags: {noWarnOnRefinesAfterCreate: true},
      exports: ['baz']
    });

    expect(global.matchingLine(capture(), 'Refining class')).toBe(undefined);

    foam.CLASS({
      refines: 'SomeClass',
      properties: ['p1']
    });

    expect(global.matchingLine(capture(), 'Refining class')).toBe(undefined);

    foam.CLASS({
      refines: 'SomeClass',
      methods: [function m1() {}]
    });

    expect(global.matchingLine(capture(), 'Refining class')).toBe(undefined);
  });

  it('__context__ and __subContext___', function() {
    foam.CLASS({
      name: 'SomeClass'
    });

    var obja = SomeClass.create();
    var objb = SomeClass.create(null, obja);

    // Can also pass the context directly
    var objc = SomeClass.create(null, obja.__context__);

    // Defaults to global context
    expect(obja.__context__).toBe(foam.__context__);

    expect(objb.__context__).toBe(obja.__subContext__);

    expect(objc.__context__).toBe(obja.__subContext__);

    // Can only set __context__ to a parent object or a context
    expect(function() {
      // Boolean is not a context.
      SomeClass.create(null, true);
    }).toThrow();

    expect(function() {
      // Nor is an empty object
      SomeClass.create(null, {});
    }).toThrow();

    expect(function() {
      // Nor is a Date
      SomeClass.create(null, new Date());
    }).toThrow();

    // You should never mutate __context__ or __subContext__
    // __subContext__ will throw if you mutate it
    expect(function() {
      obja.__subContext__ = {};
    }).toThrow();

    // Object creation will throw if you pass a non-context or non-parent
    // object as the parent parameter.
    expect(function() {
      // Plain JS objects are not contexts
      SomeClass.create(null, {});
    }).toThrow();

    expect(function() {
      // Neither are booleans
      SomeClass.create(null, true);
    }).toThrow();

    // Attempting to change the __context__ of a created object will also throw
    // even if setting it to a valid context.
    expect(function() {
      obja.__context__ = foam.__context__;
    }).toThrow();
  });

  it('installAxioms ordering resiliancy', function() {
    var fooAxiom = {
      name: 'foo',
      installInClass: function(cls) {
        expect(cls.getAxiomByName('bar')).toBe(barAxiom);
      }
    };

    var barAxiom = {
      name: 'bar',
      installInClass: function(cls) {
        expect(cls.getAxiomByName('foo')).toBe(fooAxiom);
      }
    };

    foam.CLASS({
      name: 'SomeClass',
      axioms: [
        fooAxiom,
        barAxiom
      ]
    });
  });

  it('Comparison functions', function() {
    foam.CLASS({
      name: 'ClassA',
      properties: [
        {
          class: 'Int',
          name: 'intProp'
        },
        {
          class: 'String',
          name: 'stringProp'
        }
      ]
    });

    foam.CLASS({
      name: 'ClassB',
      properties: [
        {
          class: 'Int',
          name: 'intProp'
        },
        {
          class: 'Int',
          name: 'otherIntProp'
        }
      ]
    });

    var aOne = ClassA.create({
      intProp: 0,
      stringProp: 'a'
    });
    var aTwo = ClassA.create({
      intProp: 0,
      stringProp: 'b'
    });
    var aThree = ClassA.create({
      intProp: 1,
      stringProp: 'a'
    });
    var aFour = ClassA.create({
      intProp: 2,
      stringProp: 'c'
    });
    var aFive = ClassA.create({
      intProp: 2,
      stringProp: 'c'
    });

    // Same object, so equals should be true.
    expect(aOne.equals(aOne)).toBe(true);

    // Different object, but properties are equal values.
    expect(aFour.equals(aFive)).toBe(true);

    expect(aOne.compareTo(aTwo) < 0).toBe(true);
    expect(aTwo.compareTo(aThree) < 0).toBe(true);
    expect(aThree.compareTo(aFour) < 0).toBe(true);
    expect(aFour.compareTo(aFive) === 0).toBe(true);

    var bOne = ClassB.create({
      intProp: 0,
      otherIntProp: 0
    });

    expect(aOne.equals(bOne)).toBe(false);
    expect(aOne.compareTo(bOne) < 0).toBe(true);

    // Objects are not equal to null.
    expect(aOne.equals(null)).toBe(false);

    // FObjects are always considered "greater than" non FObjects.
    expect(aOne.compareTo({}) > 0).toBe(true);
  });
});
