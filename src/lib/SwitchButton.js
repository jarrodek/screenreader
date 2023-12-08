/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 *   File:  switch.js
 *
 *   Desc:  Switch widget that implements ARIA Authoring Practices
 */

export class ButtonSwitch {
  /**
   * @type {HTMLButtonElement}
   */
  switchNode;

  /**
   * Turns the `button[role^=switch]` into a toggle switch element.
   * 
   * @param {HTMLButtonElement} domNode A button element with `[role^=switch]`
   */
  constructor(domNode) {
    this.switchNode = domNode;
    this.switchNode.addEventListener('click', () => this.toggleStatus());

    // Set background color for the SVG container Rect
    const color = getComputedStyle(this.switchNode).getPropertyValue(
      'background-color'
    );
    const containerNode = this.switchNode.querySelector('rect.container');
    containerNode.setAttribute('fill', color);
  }

  // Switch state of a switch
  toggleStatus() {
    const currentState = this.switchNode.getAttribute('aria-checked') === 'true';
    const newState = String(!currentState);
    this.switchNode.setAttribute('aria-checked', newState);
    this.switchNode.dispatchEvent(new Event('change'));
  }
}
