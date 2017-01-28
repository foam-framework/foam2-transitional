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
describe('IDSupport tests', function() {
  it('Single part IDs', function() {
    foam.CLASS({
      name: 'SomeClass',
      ids: ['a'],
      properties: [
        {
          class: 'Int',
          name: 'a'
        }
      ]
    });

    var objA = SomeClass.create({a: 12});
    var objB = SomeClass.create({a: 13});

    expect(objA.id).toBe(12);

    expect(SomeClass.ID.compare(objA, objB) < 0).toBe(true);

    objA.id = objB.id;
    expect(objA.a).toBe(13);
  });

  it('Multipart IDs', function() {
    foam.CLASS({
      name: 'SomeClass',
      ids: ['a', 'b'],
      properties: [
        {
          class: 'Int',
          name: 'a'
        },
        {
          class: 'Int',
          name: 'b'
        }
      ]
    });

    var objA = SomeClass.create({a: 1, b: 2});
    var objB = SomeClass.create({a: 1, b: 2});
    var objC = SomeClass.create({a: 2, b: 1});

    var objD = SomeClass.create({a: 1, b: 3});

    expect(objA.id.length).toBe(2);
    expect(objA.id[0]).toBe(1);
    expect(objA.id[1]).toBe(2);

    expect(SomeClass.ID.compare(objA, objB) === 0).toBe(true);
    expect(SomeClass.ID.compare(objB, objC) < 0).toBe(true);
    expect(SomeClass.ID.compare(objC, objD) > 0).toBe(true);

    objA.id = objC.id;

    expect(objA.a).toBe(2);
    expect(objA.b).toBe(1);

    // Array is created by value, mutating the returned array does not
    // mutate that actualy property values.

    objA.id[0] = 12;
    expect(objA.a).toBe(2);
    expect(objA.id[0]).toBe(2);
  });
});
