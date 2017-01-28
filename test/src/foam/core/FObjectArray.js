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
describe('FObjectArray', function() {
  foam.CLASS({
    package: 'test',
    name: 'Payload',
    properties: ['foo']
  });

  it('it defaults to empty array', function() {
    foam.CLASS({
      package: 'test',
      name: 'FOATest',
      properties: [
        {
          class: 'FObjectArray',
          of: 'test.Payload',
          name: 'arr'
        },
      ]
    });

    var t = test.FOATest.create();
    expect(t.arr).toBeDefined();
    expect(t.arr).toEqual([]);
  });

  it('adapts each element to class "of"', function() {
    foam.CLASS({
      package: 'test',
      name: 'FOATest',
      properties: [
        {
          class: 'FObjectArray',
          of: 'test.Payload',
          name: 'arr'
        },
      ]
    });

    var payload = test.Payload.create({foo: 7});

    var t = test.FOATest.create({
      arr: [
        {foo: 2},
        {foo: 'bar'},
        payload
      ]
    });

    expect(t.arr.length).toBe(3);
    expect(t.arr[0].cls_.id).toBe('test.Payload');
    expect(t.arr[0].foo).toBe(2);
    expect(t.arr[1].cls_.id).toBe('test.Payload');
    expect(t.arr[1].foo).toBe('bar');
    expect(t.arr[2].cls_.id).toBe('test.Payload');
    expect(t.arr[2]).toBe(payload);
  });

  it('should throw if given a non-array', function() {
    foam.CLASS({
      package: 'test',
      name: 'FOATest',
      properties: [
        {
          class: 'FObjectArray',
          of: 'test.Payload',
          name: 'arr'
        },
      ]
    });

    var t = test.FOATest.create();
    expect(function() { t.arr = 7; }).toThrow();
  });

  it('should default to an empty array if given a falsy value', function() {
    foam.CLASS({
      package: 'test',
      name: 'FOATest',
      properties: [
        {
          class: 'FObjectArray',
          of: 'test.Payload',
          name: 'arr'
        },
      ]
    });

    var t = test.FOATest.create();
    t.arr = 0;
    expect(t.arr).toEqual([]);
  });
});
