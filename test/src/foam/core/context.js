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
describe('foam global object context additions', function() {
  it('register', function() {
    var obj = {
      id: 'test.object'
    };

    foam.register(obj);
    expect(foam.lookup('test.object')).toBe(obj);
  });
});

describe('Context object', function() {
  var context;

  beforeEach(function() {
    context = foam.createSubContext();
  });

  it('register and lookup', function() {
    var someClass = {
      id: 'com.acme.Foo'
    };

    var coreClass = {
      package: 'foam.core',
      name: 'Bar',
      id: 'foam.core.Bar'
    };

    context.register(someClass);
    context.register(coreClass);

    expect(context.lookup('com.acme.Foo')).toBe(someClass);
    expect(context.lookup('Bar')).toBe(coreClass);
    expect(context.lookup('foam.core.Bar')).toBe(coreClass);

    // Looking up an unknown class throws an exception
    expect(function() {
      context.lookup('unknown.class');
    }).toThrow();

    // unless opt_suppress is true.
    expect(function() {
      context.lookup('unknown.class', true);
    }).not.toThrow();

    // Can only replace classes in sub contexts.
    var replaceClass = {
      id: 'com.acme.Foo'
    };

    expect(function() { context.register(replaceClass); }).toThrow();

    var subContext = context.createSubContext();
    expect(function() { subContext.register(replaceClass); }).not.toThrow();
    expect(subContext.lookup('com.acme.Foo')).toBe(replaceClass);

    // Can only look up string values.
    expect(function() { context.lookup(213123); }).toThrow();

    // Lookup up non string values returns false if opt_suppress is true.
    expect(context.lookup(123123, true)).toBe(false);
  });

  it('createSubContext', function() {
    var named = foam.createSubContext({}, 'HELLO');
    var unNamed = named.createSubContext({});

    // Check that that the NAME is set
    expect(named.NAME).toBe('HELLO');
    // And is propogated to unNamed sub contexts
    expect(unNamed.NAME).toBe('HELLO');

    // The NAME key should not be enumerable
    for ( var key in named ) {
      expect(key).not.toEqual('NAME');
    }


    // Contexts are frozen
    expect(named.foo).toBe(undefined);
    named.foo = 123;
    expect(named.foo).toBe(undefined);


    // Raw values are upgraded to constant slots.
    var sub = named.createSubContext({
      foo: 1,
      bar: 2
    });

    expect(sub.foo).toBe(1);
    expect(sub.bar).toBe(2);
    expect(sub.foo$.get()).toBe(1);
    expect(sub.bar$.get()).toBe(2);

    // Constant slots are immutable and throw when set.

    expect(function() {
      sub.foo$.set(12);
    }).toThrow();

    // value is left unchanged after failed mutation.
    expect(sub.foo).toBe(1);
    expect(sub.foo$.get()).toBe(1);


    // Exported slots add a raw key name as a getter
    foam.CLASS({
      name: 'SomeObject',
      properties: [
        'a'
      ]
    });

    var obj = SomeObject.create({a: 12});

    sub = named.createSubContext({
      a: obj.a$
    });

    expect(sub.a).toBe(12);
    expect(sub.a$.get()).toBe(12);

    // Exported slots are mutable via the object
    obj.a = 13;
    expect(sub.a).toBe(13);
    expect(sub.a$.get()).toBe(13);

    // Or the slot directly
    sub.a$.set(123);
    expect(sub.a).toBe(123);
    expect(sub.a$.get()).toBe(123);



    // Registered objects are propogated to child contexts
    var foo = {
      id: 'some.packaged.Foo'
    };

    named.register(foo);
    expect(unNamed.lookup('some.packaged.Foo')).toBe(foo);
  });

  it("createSubContext doesn't include inherited values", function() {
    var sub = foam.createSubContext({
      __proto__: {
        a: 1
      },
      b: 2
    });

    expect(sub.a$).toBe(undefined);
    expect(sub.b$.get()).toBe(2);
  });

  it('__context__ is frozen', function() {
    foam.__context__.foo = 'hello';
    expect(foam.__context__.foo).not.toEqual('hello');
  });
});
