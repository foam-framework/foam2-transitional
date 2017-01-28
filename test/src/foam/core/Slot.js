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
describe('PropertySlot', function() {
  it('basics', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    var obj = Abc.create({a: 1});
    var slot = obj.a$;

    expect(slot.get()).toBe(1);

    slot.set(12);

    expect(slot.get()).toBe(12);
    expect(obj.a).toBe(12);

    expect(slot.isDefined()).toBe(true);
    slot.clear();
    expect(slot.isDefined()).toBe(false);

    expect(slot.toString()).toBe('PropertySlot(Abc.a)');
  });

  it('supports follow()', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Abc.create({a: 2});
    var slot2 = obj2.a$;

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(2);

    slot2.follow(slot1);
    expect(slot2.get()).toBe(1);

    slot1.set(3);
    expect(slot2.get()).toBe(3);

    // But it's one-way.
    slot2.set(6);
    expect(slot2.get()).toBe(6);
    expect(slot1.get()).toBe(3);

    // Follow fails if passed a non-Slot.
    expect(function() {
      slot2.follow(null);
    }).toThrow();
    expect(function() {
      slot2.follow(Abc.A);
    }).toThrow();
  });

  it('supports linkFrom()', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Abc.create({a: 2});
    var slot2 = obj2.a$;

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(2);

    slot2.linkFrom(slot1);
    expect(slot2.get()).toBe(1);

    slot1.set(3);
    expect(slot2.get()).toBe(3);

    slot2.set(6);
    expect(slot2.get()).toBe(6);
    expect(slot1.get()).toBe(6);

    // linkFrom fails if passed a non-Slot.
    expect(function() {
      slot2.linkFrom(null);
    }).toThrow();
    expect(function() {
      slot2.linkFrom(Abc.A);
    }).toThrow();
  });

  it('supports linkTo()', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Abc.create({a: 2});
    var slot2 = obj2.a$;


    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(2);

    slot2.linkTo(slot1);
    expect(slot2.get()).toBe(2);
    expect(slot1.get()).toBe(2);

    slot1.set(3);
    expect(slot2.get()).toBe(3);

    slot2.set(6);
    expect(slot2.get()).toBe(6);
    expect(slot1.get()).toBe(6);

    // linkTo fails if passed a non-Slot.
    expect(function() {
      slot2.linkTo(null);
    }).toThrow();
    expect(function() {
      slot2.linkTo(Abc.A);
    }).toThrow();
  });

  it('supports mapFrom() and mapTo()', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Abc.create({a: 2});
    var slot2 = obj2.a$;
    var obj3 = Abc.create({a: 3});
    var slot3 = obj3.a$;

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(2);
    expect(slot3.get()).toBe(3);

    slot2.mapFrom(slot1, function(x) { return -x; });
    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(-1);

    slot1.set(5);
    expect(slot1.get()).toBe(5);
    expect(slot2.get()).toBe(-5);

    // Check one-way.
    slot2.set(3);
    expect(slot2.get()).toBe(3);
    expect(slot1.get()).toBe(5); // Hasn't changed.


    // Trying the other way with mapTo().
    slot1.mapTo(slot3, function(x) { return 4 * x; });
    expect(slot1.get()).toBe(5);
    expect(slot3.get()).toBe(20);

    slot1.set(3);
    expect(slot1.get()).toBe(3);
    expect(slot3.get()).toBe(12);

    // But it's one-way.
    slot3.set(6);
    expect(slot3.get()).toBe(6);
    expect(slot1.get()).toBe(3);

    // mapFrom fails if passed a non-Slot, or non-function
    expect(function() { slot2.mapFrom(null); }).toThrow();
    expect(function() { slot2.mapFrom(Abc.A); }).toThrow();
    expect(function() { slot2.mapFrom(slot3); }).toThrow();
    expect(function() { slot2.mapFrom(slot3, 7); }).toThrow();
    // mapTo fails if passed a non-Slot, or non-function
    expect(function() { slot2.mapTo(null); }).toThrow();
    expect(function() { slot2.mapTo(Abc.A); }).toThrow();
    expect(function() { slot2.mapTo(slot3); }).toThrow();
    expect(function() { slot2.mapTo(slot3, 7); }).toThrow();
  });

  it('supports relateFrom() and relateTo()', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Abc.create({a: 2});
    var slot2 = obj2.a$;
    var obj3 = Abc.create({a: 3});
    var slot3 = obj3.a$;

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(2);
    expect(slot3.get()).toBe(3);

    slot2.relateFrom(slot1, function(x) { return -x; },
        function(x) { return -x; });
    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(-1);

    slot1.set(5);
    expect(slot1.get()).toBe(5);
    expect(slot2.get()).toBe(-5);

    // Check two-way.
    slot2.set(3);
    expect(slot2.get()).toBe(3);
    expect(slot1.get()).toBe(-3);

    // Trying the other way with relateTo().
    slot1.relateTo(slot3, function(x) { return 4 * x; },
        function(x) { return x / 4; });
    expect(slot1.get()).toBe(-3);
    expect(slot3.get()).toBe(-12);

    slot1.set(6);
    expect(slot1.get()).toBe(6);
    expect(slot3.get()).toBe(24);

    // And it's two-way.
    slot3.set(6);
    expect(slot3.get()).toBe(6);
    expect(slot1.get()).toBe(1.5);

    // relateFrom fails if passed a non-Slot, or non-functions
    expect(function() { slot2.relateFrom(null); }).toThrow();
    expect(function() { slot2.relateFrom(Abc.A); }).toThrow();
    expect(function() { slot2.relateFrom(slot3); }).toThrow();
    expect(function() { slot2.relateFrom(slot3, 7); }).toThrow();
    expect(function() {
      slot2.relateFrom(slot3, function(x) { return x; }, 7);
    }).toThrow();

    // relateTo fails if passed a non-Slot, or non-function
    expect(function() { slot2.relateTo(null); }).toThrow();
    expect(function() { slot2.relateTo(Abc.A); }).toThrow();
    expect(function() { slot2.relateTo(slot3); }).toThrow();
    expect(function() { slot2.relateTo(slot3, 7); }).toThrow();
    expect(function() {
      slot2.relateTo(slot3, function(x) { return x; }, 7);
    }).toThrow();
  });

  it('prevents feedback in relateTo/From', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    // Divergence should be caught.
    expect(function() {
      var obj1 = Abc.create({a: 1});
      var obj2 = Abc.create({a: 2});
      obj1.a$.relateTo(obj2.a$, function(x) { return x + 1; },
          function(x) { return x + 1; });
      obj1.a = 5;
    }).toThrow('relateTo: Unexpected divergence.');

    // In both directions.
    expect(function() {
      var obj1 = Abc.create({a: 1});
      var obj2 = Abc.create({a: 2});
      obj1.a$.relateFrom(obj2.a$, function(x) { return x + 1; },
          function(x) { return x + 1; });
      obj2.a = 4;
    }).toThrow('relateTo: Unexpected divergence.');

    // Setting expectUnstable should stop any feedback.
    expect(function() {
      var obj1 = Abc.create({a: 1});
      var obj2 = Abc.create({a: 2});
      obj1.a$.relateTo(obj2.a$, function(x) { return x + 1; },
          function(x) { return x; }, true);
      obj1.a = 3;
      expect(obj2.a).toBe(4);
    }).not.toThrow();

    // And in reverse.
    expect(function() {
      var obj1 = Abc.create({a: 1});
      var obj2 = Abc.create({a: 2});
      obj1.a$.relateTo(obj2.a$, function(x) { return x + 1; },
          function(x) { return x + 1; }, true);
      obj2.a = 5;
      expect(obj1.a).toBe(6);
    }).not.toThrow();
  });

  it('supports detach()', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Abc.create({a: 2});
    var slot2 = obj2.a$;

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(2);

    var sub = slot2.linkFrom(slot1);
    expect(slot2.get()).toBe(1);

    slot1.set(3);
    expect(slot2.get()).toBe(3);

    // Now if I detach it, it stops binding.
    sub.detach();
    slot2.set(6);
    expect(slot2.get()).toBe(6);
    expect(slot1.get()).toBe(3);
  });

  it('prevents feedback', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    foam.CLASS({
      name: 'Def',
      properties: [
        {name: 'b', adapt: function(old, nu) { return Math.ceil(nu);}}
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Def.create({b: 2});
    var slot2 = obj2.b$;

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(2);

    var sub = slot2.linkFrom(slot1);

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(1);

    slot1.set(3.5);
    expect(slot1.get()).toBe(4);
    expect(slot2.get()).toBe(4);
  });

  it('correctly handles adapts overriding the value', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    foam.CLASS({
      name: 'Def',
      properties: [
        {name: 'b', adapt: function(old, nu) { return nu > 20 ? 20 : nu;}}
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Def.create({b: 2});
    var slot2 = obj2.b$;

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(2);

    var sub = slot1.linkTo(slot2);
    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(1);

    slot1.set(200);
    expect(slot1.get()).toBe(20);
    expect(slot2.get()).toBe(20);

    slot1.set(400);
    expect(slot1.get()).toBe(20);
    expect(slot2.get()).toBe(20);

    sub.detach();

    slot2.linkTo(slot1);

    slot1.set(200);
    expect(slot1.get()).toBe(20);
    expect(slot2.get()).toBe(20);

    slot1.set(400);
    expect(slot1.get()).toBe(20);
    expect(slot2.get()).toBe(20);
  });

  it('handles follow() when the values are identical', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'a'
      ]
    });

    var obj1 = Abc.create({a: 1});
    var slot1 = obj1.a$;
    var obj2 = Abc.create({a: 1});
    var slot2 = obj2.a$;

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(1);

    slot1.follow(slot2);

    expect(slot1.get()).toBe(1);
    expect(slot2.get()).toBe(1);
  });
});

describe('ExpressionSlot', function() {
  it('basics', function() {
    foam.CLASS({
      package: 'test.slot.expr',
      name: 'Person',
      properties: [
        'name', 'age'
      ]
    });

    var person = foam.lookup('test.slot.expr.Person').create({
      name: 'Jeff',
      age: 22
    });

    var isAdult = foam.lookup('foam.core.ExpressionSlot').create({
      code: function(age) { return age >= 18; },
      args: [person.age$]
    });

    expect(isAdult.get()).toBe(true);
    person.age = 16;
    expect(isAdult.get()).toBe(false);

    // set() is ignored
    isAdult.set(true);
    expect(isAdult.get()).toBe(false);

    isAdult.detach();
  });

  it('is integrated as Property.expression', function() {
    foam.CLASS({
      package: 'test.slot.expr',
      name: 'Person',
      properties: [
        'firstName',
        'lastName',
        {
          name: 'fullName',
          expression: function(firstName, lastName) {
            this.count_++;
            return firstName + ' ' + lastName;
          }
        },
        ['count_', 0]
      ]
    });

    var person = foam.lookup('test.slot.expr.Person').create({
      firstName: 'John',
      lastName: 'Smith'
    });

    expect(person.count_).toBe(0);
    // fullName should work.
    expect(person.fullName).toBe('John Smith');
    // And accessing it will bump the count.
    expect(person.count_).toBe(1);

    // But accessing it again won't change the count.
    expect(person.fullName).toBe('John Smith');
    expect(person.count_).toBe(1);

    // Changing one of the dependencies will invalidate, but not recompute.
    person.lastName = 'Cooper';
    expect(person.count_).toBe(1);

    // And I can cause it to recompute.
    expect(person.fullName).toBe('John Cooper');
    expect(person.count_).toBe(2);

    // Setting the expression property works, and it sticks even if depencies
    // change.
    person.fullName = 'Jim Brown';
    expect(person.fullName).toBe('Jim Brown');
    expect(person.count_).toBe(2);
    person.firstName = 'Paul';
    expect(person.fullName).toBe('Jim Brown');
    expect(person.count_).toBe(2);

    // Now if I clear the property, the expression takes over again.
    person.clearProperty('fullName');
    expect(person.count_).toBe(2);
    expect(person.fullName).toBe('Paul Cooper');
    expect(person.count_).toBe(3);

    // Expressions do fire propertyChange when someone is listening.
    var callCount = 0;
    person.fullName$.sub(function() { callCount++; });
    expect(callCount).toBe(0);
    person.lastName = 'Davis';

    // Note that listeners are called even before anyone accesses the value.
    expect(callCount).toBe(1);
    expect(person.count_).toBe(3);
    expect(person.fullName).toBe('Paul Davis');
    expect(person.count_).toBe(4);
    expect(callCount).toBe(1);

    // On a completely other topic: I can use this.slot(function...) to make an
    // ad-hoc expression.
    var slot = person.slot(function(fullName) { return fullName.length; });
    expect(slot.get()).toBe(10); // Paul Davis
    person.firstName = 'Ben';
    expect(slot.get()).toBe(9); // Ben Davis

    // I can also just specify arguments as Slots, and then the parameter names
    // are arbitrary.
    var slot2 = person.slot(function(f) { return f.length; },
        person.firstName$);
    expect(slot2.get()).toBe(3);
    person.firstName = 'James';
    expect(slot2.get()).toBe(5);

    // Finally, if I sub to an ExpressionSlot, I get notified when it changes.
    callCount = 0;
    slot2.sub(function() { callCount++; });
    expect(callCount).toBe(0);
    person.firstName = 'Paul';
    expect(callCount).toBe(1);
    person.firstName = 'Alan';
    expect(callCount).toBe(1); // Length doesn't change!
  });
});


describe('ConstantSlot', function() {
  it('coverage', function() {
    var slot = foam.core.ConstantSlot.create({value: 123});

    expect(slot.get()).toBe(123);

    // Constant slot is immutable, throw when set
    expect(function() {
      slot.set(12);
    }).toThrow();

    expect(slot.get()).toBe(123);

    // Users shouldn't access the "value" property directly, but we test it here
    // for coverage.
    expect(slot.value).toBe(123);
    slot.value = 12;
    expect(slot.value).toBe(123);
    expect(slot.get()).toBe(123);


    // .sub() is a no-op on ConstantSlot, since it can't change, the provided listener
    // will never be fired.  Call it here to ensure coverage, but there is nothing
    // to verify.
    slot.sub(function() { console.log('Slot was changed!'); });
  });
});
