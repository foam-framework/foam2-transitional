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

/* global bank, test */
describe('Requires', function() {
  it('work correctly', function() {
    foam.CLASS({
      package: 'bank',
      name: 'Account',
      properties: [
        'owner',
        'balance',
        ['interestRate', 0.008]
      ]
    });

    foam.CLASS({
      package: 'bank',
      name: 'SavingsAccount',
      extends: 'bank.Account',
      properties: [
        ['interestRate', 0.012]
      ]
    });

    foam.CLASS({
      package: 'test',
      name: 'BankTest',
      requires: [
        'bank.Account',
        'bank.SavingsAccount as SAccount'
      ],

      exports: [
        'transitNumber'
      ],

      properties: [
        ['owner', 'me'],
        ['transitNumber', '003'],
        {
          name: 'chequeing',
          factory: function() {
            return this.Account.create({owner: this.owner, balance: 200});
          }
        },
        {
          name: 'savings',
          factory: function() {
            return this.SAccount.create({owner: this.owner, balance: 300});
          }
        }
      ]
    });

    foam.CLASS({
      package: 'test',
      name: 'BankTest2',
      requires: [
        {name: 'ACT', path: 'bank.Account'}
      ],
      properties: [
        {
          name: 'inner',
          factory: function() {
            return this.ACT.create();
          }
        },
        {
          name: 'inner2',
          factory: function() {
            return this.ACT.create();
          }
        }
      ]
    });

    var t = test.BankTest.create();
    expect(t.chequeing.interestRate).toBe(0.008);
    expect(t.savings.interestRate).toBe(0.012);

    var t2 = test.BankTest2.create(null, null);
    expect(t2.inner.interestRate).toBe(0.008);
    expect(t2.inner2.interestRate).toBe(0.008);
    expect(t.savings.__context__.transitNumber).toBe('003');
  });
});
