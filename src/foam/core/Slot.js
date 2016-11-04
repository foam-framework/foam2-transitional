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
</ul>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Slot',

  methods: [
    /**
      Link two Slots together, setting both to other's value.
      Returns a Destroyable which can be used to break the link.
      After copying a value from one slot to the other, this implementation
      then copies the value back in case the target slot rejected the value.
    */
    function linkFrom(s2) {
      console.assert(s2 && this.cls_.isInstance(s2),
          'Slot.linkFrom: argument is not a Slot');

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
        destroy: function() {
          sub1 && sub1.destroy();
          sub2 && sub2.destroy();
          sub1 = sub2 = null;
        }
      };
    },

    /** See linkFrom. linkTo simply reverses the arguments. */
    function linkTo(other) {
      return other.linkFrom(this);
    },

    /**
      Have this Slot dynamically follow other's value.
      Returns a Destroyable which can be used to cancel the binding.
    */
    function follow(other) {
      console.assert(other && this.cls_.isInstance(other),
          'Slot.follow requires Slot argument.');
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

    /**
     * Maps values from one model to another.
     * @param f maps values from srcValue to dstValue
     */
    function mapFrom(other, f) {
      console.assert(other && this.cls_.isInstance(other),
          'Slot.mapFrom: first argument is not a Slot');
      console.assert(typeof f === 'function',
          'Slot.mapFrom: second argument is not a function');

      var self = this;
      var l = function() { self.set(f(other.get())); };
      l();
      return other.sub(l);
    },

    function mapTo(other, f) {
      return other.mapFrom(this, f);
    },

    /**
     * Relate to another Slot.
     * @param other The other slot.
     * @param f Map from this to other.
     * @param fprime Map from other to this.
     * @param expectUnstable Set this to true if you expect fPrime(f(x)) != x.
     *    Otherwise an error is generated on divergence.
     */
    function relateTo(other, f, fPrime, expectUnstable) {
      console.assert(other && this.cls_.isInstance(other),
          'Slot.relateTo: first argument is not a Slot');
      console.assert(typeof f === 'function',
          'Slot.relateTo: second argument is not a function');
      console.assert(typeof fPrime === 'function',
          'Slot.relateTo: third argument is not a function');

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

      // FUTURE(braden): Once onDestroy is supported, pass these inner
      // subscriptions to sub.onDestroy.
      this.sub(l1);
      other.sub(l2);

      l1();

      return sub;
    },

    function relateFrom(other, f, fPrime) {
      return other.relateTo(this, fPrime, f);
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
      return this.prop.set(this.obj, value);
    },

    function sub(l) {
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