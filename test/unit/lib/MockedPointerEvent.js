export class MockedPointerEvent extends PointerEvent {
  /** 
   * @type {EventTarget}
   */
  #target;

  set target(value) {
    this.#target = value;
  }

  get target() {
    return this.#target;
  }
}
