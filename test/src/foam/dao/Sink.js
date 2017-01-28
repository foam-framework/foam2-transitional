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
describe('Sink interface', function() {
  it('contains default empty implementations for the Sink methods', function() {
    foam.CLASS({
      package: 'test',
      name: 'Sink',
      implements: ['foam.dao.Sink']
    });

    foam.CLASS({
      package: 'test',
      name: 'Person',
      properties: ['id', 'name']
    });

    var p = test.Person.create({id: 1, name: 'Jeff'});
    var sink = test.Sink.create();
    expect(function() { sink.put(p); }).not.toThrow();
    expect(function() { sink.remove(p); }).not.toThrow();
    expect(function() { sink.error(new Error('o noes')); }).not.toThrow();
    expect(function() { sink.eof(); }).not.toThrow();
    expect(function() { sink.reset(); }).not.toThrow();
  });
});
