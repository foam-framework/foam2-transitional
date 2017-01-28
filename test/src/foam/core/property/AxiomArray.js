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
describe('AxiomArray', function() {
  it('adapt', function() {
    foam.CLASS({
      name: 'SomeObject',
      properties: [
        'a',
        'b'
      ]
    });

    foam.CLASS({
      name: 'Abc',
      properties: [
        {
          name: 'axioms_',
          factory: function() { return []; }
        },
        {
          class: 'AxiomArray',
          of: 'SomeObject',
          name: 'objects'
        }
      ]
    });

    var obj = Abc.create();

    // Does not accept non array objects.
    expect(function() {
      obj.objects = 'foo';
    }).toThrow();

    // Adapts array of maps to instances of inner type.
    obj.objects = [
      {
        a: 1,
        b: 2
      },
      {
        a: 3,
        b: 4
      }
    ];

    expect(SomeObject.isInstance(obj.objects[0])).toBe(true);
    expect(SomeObject.isInstance(obj.objects[1])).toBe(true);

    expect(obj.objects[0].a).toBe(1);
    expect(obj.objects[0].b).toBe(2);

    // and pushed those objects onto axioms_.

    expect(obj.axioms_.length).toBe(2);
    expect(obj.axioms_[0]).toBe(obj.objects[0]);
    expect(obj.axioms_[1]).toBe(obj.objects[1]);

    // Does not mutate objects if they already are the right type.

    var inner = SomeObject.create({a: 1, b: 2});
    obj.objects = [
      inner
    ];

    expect(obj.objects[0]).toBe(inner);

    // Only copies the array if it needs to.

    var objs = [
      inner
    ];
    obj.objects = objs;

    expect(obj.objects).toBe(objs);

    objs = [
      inner,
      {
        a: 1,
        b: 2
      }
    ];
    obj.objects = objs;

    expect(obj.objects).not.toBe(objs);
    // First element is preserved
    expect(obj.objects[0]).toBe(inner);

    // Second element is upgraded
    expect(obj.objects[1]).not.toBe(objs[1]);
    expect(SomeObject.isInstance(obj.objects[1])).toBeTruthy();
  });
});
