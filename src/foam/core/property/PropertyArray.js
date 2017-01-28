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
 * PropertyArray is a particular flavour of AxiomArray for when "of" is
 * Property.
 */
foam.CLASS({
  package: 'foam.core.property',
  name: 'PropertyArray',
  extends: 'foam.core.property.AxiomArray',

  properties: [
    ['of', 'Property'],
    {
      /**
       * Specialized adaptArrayElement that handles the many flavours of
       * defining a Property.
       */
      name: 'adaptArrayElement',
      value: function(o) {
        /*
          Properties can be defined using three formats:
          1. Short-form String:  'firstName' or 'sex'

          2. Medium-form Array:  ['firstName', 'John'] or ['sex', 'Male']
             The first element of the array is the name and the second is the
             default value.

          3. Long-form JSON:     {class: 'String', name: 'sex', value: 'Male'}
             The long-form will support many options, but only 'name' is
             mandatory.
         */
        if ( foam.String.isInstance(o) ) {
          var p = foam.core.Property.create();
          p.name = o;
          return p;
        }

        if ( foam.Array.isInstance(o) ) {
          // TODO(adamvy): Ensure that name is typechecked and validated
          // when model validation becomes a thing.
          var p = foam.core.Property.create();
          p.name  = o[0];
          p.value = o[1];
          return p;
        }

        if ( o.class ) {
          var m = foam.lookup(o.class);
          return m.create(o);
        }

        return foam.core.Property.isInstance(o) ?
          o : foam.core.Property.create(o);
      }
    }
  ]
});
