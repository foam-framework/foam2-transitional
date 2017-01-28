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

foam.CLASS({
  package: 'foam.core.property',
  name: 'Int',
  extends: 'Property',

  properties: [
    'units',
    ['value', 0],
    ['adapt', function adaptInt(_, v) {
      foam.assert(foam.Number.isInstance(v),
        'Cannot convert type', typeof v, 'to int');
      foam.assert(Math.trunc(v) === v,
        'Attempted to set int to float value');

      return v;
    }]
  ]
});
