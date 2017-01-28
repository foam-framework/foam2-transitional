/*
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
  Slots are observable values which can change over time.

  Slots are simple single-value Model-View-Controller Models, but since
  another meaning of 'Model' is already heavily used in FOAM, Slot is
  used to avoid overloading the term.

  <ul>Types of Slots include:
    <li>PropertySlot
    <li>ExpressionSlot
    <li>ConstantSlot
</ul>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Slot',

  methods: [
    function linkFrom(s2) {
      /**
       * Link two Slots together, setting both to other's value.
       * Returns a Detachable which can be used to break the link.
       * After copying a value from one slot to the other, this implementation
       * then copies the value back in case the target slot rejected the value.
       * @param {foam.core.Slot} s2
       */
      var s1        = this;
      var feedback1 = false;
      var feedback2 = false;

      // FUTURE(kgr): Once all slot types property set 'src', these
      // two listeneners can be merged.
      var l1 = function(e) {
        if ( feedback1 ) return;

        // FUTURE(braden): Switch this to foam.util.equals when defined.
        if ( s1.get() !== s2.get() ) {
          feedback1 = true;
          s2.set(s1.get());
          // FUTURE(braden): Switch this to foam.util.equals when defined.
          if ( s1.get() !== s2.get() ) {
            s1.set(s2.get());
          }
          feedback1 = false;
        }
      };

      var l2 = function(e) {
        if ( feedback2 ) return;

        // FUTURE(braden): Switch this to foam.util.equals when defined.
        if ( s1.get() !== s2.get() ) {
          feedback2 = true;
          s1.set(s2.get());
          // FUTURE(braden): Switch this to foam.util.equals when defined.
          if ( s1.get() !== s2.get() ) {
            s2.set(s1.get());
          }
          feedback2 = false;
        }
      };

      var sub1 = s1.sub(l1);
      var sub2 = s2.sub(l2);

      l2();

      return {
        detach: function() {
          sub1 && sub1.detach();
          sub2 && sub2.detach();
          sub1 = sub2 = null;
        }
      };
    },

    function linkTo(other) {
      /**
       * See linkFrom. linkTo simply reverses the arguments.
       * @param {foam.core.Slot} other
       */
      return other.linkFrom(this);
    },

    function follow(other) {
      /**
       * Have this Slot dynamically follow other's value.
       * Returns a Detachable which can be used to cancel the binding.
       * @param {foam.core.Slot} other
       */
      var self = this;
      var l = function() {
        // FUTURE(braden): Switch this to foam.util.equals when defined.
        if ( self.get() !== other.get() ) {
          self.set(other.get());
        }
      };
      l();
      return other.sub(l);
    },

    function mapFrom(other, f) {
      /**
       * Maps values from one model to another.
       * @param {foam.core.Slot} other
       * @param {Function} f maps values from srcValue to dstValue
       */

      var self = this;
      var l = function() { self.set(f(other.get())); };
      l();
      return other.sub(l);
    },

    function mapTo(other, f) {
      /**
       * Maps values from another model to this one (reverse of MapFrom).
       * @param {foam.core.Slot} other
       * @param {Function} f maps values from srcValue to dstValue
       */
      return other.mapFrom(this, f);
    },

    function relateTo(other, f, fPrime, expectUnstable) {
      /**
       * Relate to another Slot.
       * @param {foam.core.Slot} other The other slot.
       * @param {Function} f Map from this to other.
       * @param {Function} fPrime Map from other to this.
       * @param {Boolean=} expectUnstable Set this to true if you expect fPrime(f(x)) != x.
       *    Otherwise an error is generated on divergence.
       */
      var self     = this;
      var feedback = false;
      var feedbackCounter = 0;
      var sub      = foam.core.FObject.create();
      var l1 = function() {
        if ( feedback ) return;
        feedback = expectUnstable;
        if ( ! expectUnstable && feedbackCounter > 5 ) {
          throw 'relateTo: Unexpected divergence.';
        }
        feedbackCounter++;
        other.set(f(self.get()));
        feedback = false;
        feedbackCounter--;
      };
      var l2 = function() {
        if ( feedback ) return;
        feedback = expectUnstable;
        feedbackCounter++;
        self.set(fPrime(other.get()));
        feedback = false;
        feedbackCounter--;
      };

      sub.onDetach(this.sub(l1));
      sub.onDetach(other.sub(l2));

      l1();

      return sub;
    },

    function relateFrom(other, f, fPrime, expectUnstable) {
      /**
       * Relate from another Slot (reverse of relateTo).
       * @param {foam.core.Slot} other The other slot.
       * @param {Function} f Map from other to this.
       * @param {Function} fPrime Map from this to other.
       * @param {Boolean=} expectUnstable Set this to true if you expect fPrime(f(x)) != x.
       *    Otherwise an error is generated on divergence.
       */
      return other.relateTo(this, fPrime, f, expectUnstable);
    }
  ]
});

/**
  PropertySlot represents object properties as Slots.
  Created with calling obj.myProperty$ or obj.slot('myProperty').
  For internal use only.
 */
foam.CLASS({
  package: 'foam.core.internal',
  name: 'PropertySlot',
  extends: 'foam.core.Slot',
  properties: [
    {
      name: 'obj'
    },
    {
      name: 'prop'
    }
  ],

  methods: [
    function initArgs() { },
    function init() { },

    function get() {
      return this.prop.get(this.obj);
    },

    function set(value) {
      /** @param {any=} value */
      return this.prop.set(this.obj, value);
    },

    function sub(l) {
      /** @param {any} l */
      var s = this.obj.sub('propertyChange', this.prop.name, l);
      s.src = this;
      return s;
    },

    function isDefined() {
      return this.obj.hasOwnProperty(this.prop.name);
    },

    function clear() {
      this.obj.clearProperty(this.prop.name);
    },

    function toString() {
      return 'PropertySlot(' + this.obj.cls_.id + '.' + this.prop.name + ')';
    }
  ]
});

/**
  Tracks the dependencies of a dynamic function, and invalidates the Slot if
  they change.

  Any slots that depend on this slot get invalidated too, recursively. However,
  values are only recomputed on-demand, when someone calls get().

<pre>
  foam.CLASS({name: 'Person', properties: ['fname', 'lname']});
  var p = Person.create({fname: 'John', lname: 'Smith'});
  var e = foam.core.ExpressionSlot.create({
    args: [p.fname$, p.lname$],
    code: function(f, l) { return f + ' ' + l; }
  });
  log(e.get());
  e.sub(log);
  p.fname = 'Steve';
  p.lname = 'Jones';
  log(e.get());

  Output:
   > John Smith
   > [object Object] propertyChange value [object Object]
   > [object Object] propertyChange value [object Object]
   > Steve Jones

  var p = foam.CLASS({name: 'Person', properties: ['f', 'l']}).create({f:'John', l: 'Doe'});
  var e = foam.core.ExpressionSlot.create({
    obj: p,
    code: function(f, l) { return f + ' ' + l; }
  });
</pre>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'ExpressionSlot',
  // FUTURE(braden): Switch this back to 'implements', once that's supported.
  extends: 'foam.core.Slot',

  properties: [
    'obj',
    'code',
    {
      name: 'args',
      expression: function(obj) {
        foam.assert(obj, 'ExpressionSlot: "obj" or "args" required.');

        var args = foam.Function.formalArgs(this.code);
        for ( var i = 0 ; i < args.length ; i++ ) {
          args[i] = obj.slot(args[i]);
        }

        // this.invalidate(); // ???: Is this needed?
        this.subToArgs_(args);

        return args;
      },
      postSet: function(_, args) {
        this.subToArgs_(args);
      }
    },
    {
      name: 'value',
      factory: function() {
        return this.code.apply(this.obj || this, this.args.map(function(a) {
          return a.get();
        }));
      }
    },
    {
      /** Detachable to clean up old subs when obj changes. */
      name: 'cleanup_',
      factory: function() {
        return foam.core.FObject.create();
      }
    }
  ],

  methods: [
    function init() {
      /** Always call cleanup when this expression is detached. */
      var self = this;
      this.onDetach(function() {
        self.cleanup_.detach();
      });
    },

    function get() {
      /**
       * Returns the previously computed value of this expression.
       * If the expression has been invalidated, this will trigger value.factory
       * and recompute the value.
       */
      return this.value;
    },

    function set() {
      /** Does nothing. Setting expressions is a no-op. */
    },

    function sub(l) {
      /** @param {any} l */
      return arguments.length === 1 ?
        this.SUPER('propertyChange', 'value', l) :
        this.SUPER.apply(this, arguments);
    },

    function subToArgs_(args) {
      /**
       * Helper function that subscribes to each argument of the expression.
       * @param {Array} args
       */
      this.cleanup_.detach();
      this.cleanup_ = foam.core.FObject.create();

      var self = this;
      for ( var i = 0 ; i < args.length ; i++ ) {
        this.cleanup_.onDetach(args[i].sub(function() {
          self.clearProperty('value');
        }));
      }
    }
  ]
});

/** An immutable constant valued Slot. */
foam.CLASS({
  package: 'foam.core',
  name: 'ConstantSlot',
  extends: 'foam.core.Slot',

  properties: [
    {
      name: 'value',
      getter: function() { return this.value_; },
      setter: function() {}
    }
  ],

  methods: [
    function initArgs(args) {
      /** @param {Object=} args */
      this.value_ = args && args.value;
    },

    function get() { return this.value; },

    function set() {
      throw new Error('Tried to mutate immutable ConstantSlot.');
    },

    function sub() {/* nop */ }
  ]
});
