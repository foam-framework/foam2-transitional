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

describe('Singleton axiom', function() {
  it('should always return the same axiom', function() {
    var a = foam.pattern.Singleton.create();
    var b = foam.pattern.Singleton.create();
    expect(a).toBe(b);
  });

  it('should always return the same axiom', function() {
    var a = foam.pattern.Singleton.create();
    var b = a.clone();
    expect(a).toBe(b);
  });

  it('should answer equals() with ===', function() {
    var a = foam.pattern.Singleton.create();
    var b = a.clone();
    expect(a.equals(b)).toBe(true);
    expect(b.equals(a)).toBe(true);
    expect(a.equals(7)).toBe(false);
    expect(a.equals(Math)).toBe(false);
  });
});
