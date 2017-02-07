'use strict'
var EventManager = require('../lib/eventManager')
var style = require('./styles/basicStyles')
var ui = require('../helpers/ui')
var yo = require('yo-yo')

function ButtonNavigator (_parent, _traceManager) {
  this.event = new EventManager()
  this.intoBackDisabled = true
  this.overBackDisabled = true
  this.intoForwardDisabled = true
  this.overForwardDisabled = true
  this.jumpOutDisabled = true
  this.playDisabled = true

  this.traceManager = _traceManager
  this.currentCall = null
  this.revertionPoint = null

  _parent.event.register('indexChanged', this, (index) => {
    if (index < 0) return
    if (_parent.currentStepIndex !== index) return

    this.traceManager.buildCallPath(index, (error, callsPath) => {
      if (error) {
        console.log(error)
        resetWarning(this)
      } else {
        this.currentCall = callsPath[callsPath.length - 1]
        if (this.currentCall.reverted) {
          this.revertionPoint = this.currentCall.return
          this.view.querySelector('#reverted').style.display = 'block'
          this.view.querySelector('#reverted #outofgas').style.display = this.currentCall.outOfGas ? 'inline' : 'none'
          this.view.querySelector('#reverted #parenthasthrown').style.display = 'none'
        } else {
          var k = callsPath.length - 2
          while (k >= 0) {
            var parent = callsPath[k]
            if (parent.reverted) {
              this.revertionPoint = parent.return
              this.view.querySelector('#reverted').style.display = 'block'
              this.view.querySelector('#reverted #parenthasthrown').style.display = parent ? 'inline' : 'none'
              this.view.querySelector('#reverted #outofgas').style.display = 'none'
              return
            }
            k--
          }
          resetWarning(this)
        }
      }
    })
  })

  this.view
}

module.exports = ButtonNavigator

ButtonNavigator.prototype.render = function () {
  var self = this
  var view = yo`<div>    
    <button id='overback' title='step over back' class='fa fa-angle-double-left' style=${ui.formatCss(style.button)} onclick=${function () { self.event.trigger('stepOverBack') }} disabled=${this.overBackDisabled} >
    </button>
    <button id='intoback' title='step into back' class='fa fa-angle-left' style=${ui.formatCss(style.button)} onclick=${function () { self.event.trigger('stepIntoBack') }} disabled=${this.intoBackDisabled} >
    </button>    
    <button id='intoforward' title='step into forward'  class='fa fa-angle-right' style=${ui.formatCss(style.button)} onclick=${function () { self.event.trigger('stepIntoForward') }} disabled=${this.intoForwardDisabled} >
    </button>
    <button id='overforward' title='step over forward' class='fa fa-angle-double-right' style=${ui.formatCss(style.button)} onclick=${function () { self.event.trigger('stepOverForward') }} disabled=${this.overForwardDisabled} >
    </button>
    <button id='jumpout' title='jump out' class='fa fa-share' style=${ui.formatCss(style.button)} onclick=${function () { self.event.trigger('jumpOut') }} disabled=${this.jumpOutDisabled} >
    </button>
    <button id='play' title='jump to the next breakpoint' class='fa fa-step-forward' style=${ui.formatCss(style.button)} onclick=${function () { self.event.trigger('play') }} disabled=${this.playDisabled} >
    </button>
    <div id='reverted' style="display:none">
      <button id='jumptoexception' title='jump to exception' class='fa fa-exclamation-triangle' style=${ui.formatCss(style.button)} onclick=${function () { self.event.trigger('jumpToException', [self.revertionPoint]) }} disabled=${this.jumpOutDisabled} >
      </button>
      <span>State changes made during this call will be reverted.</span>
      <span id='outofgas' style="display:none">This call will run out of gas.</span>
      <span id='parenthasthrown' style="display:none">The parent call will throw an exception</span>
    </div>
  </div>`
  if (!this.view) {
    this.view = view
  }
  return view
}

ButtonNavigator.prototype.reset = function () {
  this.intoBackDisabled = true
  this.overBackDisabled = true
  this.intoForwardDisabled = true
  this.overForwardDisabled = true
  this.jumpOutDisabled = true
  resetWarning(this)
}

ButtonNavigator.prototype.stepChanged = function (step) {
  this.intoBackDisabled = step <= 0
  this.overBackDisabled = step <= 0
  if (!this.traceManager) {
    this.intoForwardDisabled = true
    this.overForwardDisabled = true
  } else {
    var self = this
    this.traceManager.getLength(function (error, length) {
      if (error) {
        self.reset()
        console.log(error)
      } else {
        self.playDisabled = step >= length - 1
        self.intoForwardDisabled = step >= length - 1
        self.overForwardDisabled = step >= length - 1
        var stepOut = self.traceManager.findStepOut(step)
        self.jumpOutDisabled = stepOut === step
      }
      self.updateAll()
    })
  }
  this.updateAll()
}

ButtonNavigator.prototype.updateAll = function () {
  this.updateDisabled('intoback', this.intoBackDisabled)
  this.updateDisabled('overback', this.overBackDisabled)
  this.updateDisabled('overforward', this.overForwardDisabled)
  this.updateDisabled('intoforward', this.intoForwardDisabled)
  this.updateDisabled('jumpout', this.jumpOutDisabled)
  this.updateDisabled('jumptoexception', this.jumpOutDisabled)
  this.updateDisabled('play', this.playDisabled)
}

ButtonNavigator.prototype.updateDisabled = function (id, disabled) {
  if (disabled) {
    document.getElementById(id).setAttribute('disabled', true)
  } else {
    document.getElementById(id).removeAttribute('disabled')
  }
}

function resetWarning (self) {
  self.view.querySelector('#reverted #outofgas').style.display = 'none'
  self.view.querySelector('#reverted #parenthasthrown').style.display = 'none'
  self.view.querySelector('#reverted').style.display = 'none'
}

module.exports = ButtonNavigator
