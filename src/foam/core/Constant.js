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

/**
 * Constants are fixed values attached to a class.
 *
 * For convenience, they are installed on the prototype as well as the class:
 * <pre>
 * constants: {
 *   KEY: 'some value'
 * }
 *
 * this.cls_.KEY === this.KEY === 'some value'
 * </pre>
 */
foam.CLASS({
  package: 'foam.core',
  name: 'Constant',
  properties: ['name', 'value'],

  methods: [
    function installInClass(cls) {
      /** @param {any} cls */
      var value = this.value;
      Object.defineProperty(cls, this.name, {
        get: function() { return value; },
        set: function() { throw 'Attempted to reassign a constant.'; },
        configurable: false
      });
    },
    function installInProto(proto) {
      /** @param {any} proto */
      this.installInClass(proto);
    }
  ]
});

foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'Constant',
      name: 'constants',
      adapt: function(_, a, prop) {
        if ( ! a ) return [];
        if ( ! Array.isArray(a) ) {
          var cs = [];
          for ( var key in a ) {
            cs.push(foam.core.Constant.create({name: key, value: a[key]}));
          }
          return cs;
        }

        var b = new Array(a.length);
        for ( var i = 0 ; i < a.length ; i++ ) {
          b[i] = prop.adaptArrayElement.call(this, a[i], prop);
        }
        return b;
      }
    }
  ]
});
