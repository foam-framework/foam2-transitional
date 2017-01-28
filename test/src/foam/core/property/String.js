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

var createTestProperties = function createTestProperties() {
  if ( ! foam.lookup('test.StringTester', true) ) {
    foam.CLASS({
      name: 'StringTester',
      package: 'test',

      properties: [
        {
          class: 'String',
          name: 'string',
        },
      ]
    });
  }

  return global.test.StringTester.create(undefined, foam.__context__);
};

describe('String', function() {
  var p;

  beforeEach(function() {
    p = createTestProperties();
  });
  afterEach(function() {
    p = null;
  });

  it('accepts string values', function() {
    p.string = 'Hello';
    expect(p.string).toBe('Hello');
  });
  it('converts number values', function() {
    p.string = 42;
    expect(p.string).toBe('42');
  });
  it('toString()s objects', function() {
    p.string = {toString: function() {
      return 'You called toString!';
    }};
    expect(p.string).toBe('You called toString!');
  });
  // jscs:disable
  it('extracts multiline strings from function comments', function() {
    p.string = function() {/*
multiline comment
string
*/};
    expect(p.string).toBe('\nmultiline comment\nstring\n');
  });
  // jscs:enable
  it('defaults to empty string for unsupported values', function() {
    p.string = {toString: null};
    expect(p.string).toBe('');
  });

});
