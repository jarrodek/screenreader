import { chai, assert, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { chaiDomDiff } from '@open-wc/semantic-dom-diff';
import AudioContentScript from '../../src/content/audio.js';
import { MockedPointerEvent } from './lib/MockedPointerEvent.js';
import { ChromeStub } from './lib/ChromeStub.js';

chai.use(chaiDomDiff);

/** @typedef {import('../../src/types').IContentMessage} IContentMessage */

describe('AudioContentScript', () => {
  describe('processNodeHover()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
    });

    it('ignores the body element', () => {
      instance.processNodeHover(document.body);
      assert.notInclude(Array.from(document.body.classList), 'sr-highlight');
    });

    it('ignores elements with [data-no-sr-no-text]', () => {
      const p = document.createElement('p');
      p.dataset.srNoText = 'true';
      instance.processNodeHover(p);
      assert.notInclude(Array.from(p.classList), 'sr-highlight');
    });

    it('ignores elements the highlight class already added', () => {
      const p = document.createElement('p');
      p.classList.add('sr-highlight');
      instance.processNodeHover(p);
      assert.notInclude(Object.keys(p.dataset), 'srNoText');
    });

    it('adds the data-sr-no-text attribute when no text content', () => {
      const p = document.createElement('p');
      instance.processNodeHover(p);
      assert.include(Object.keys(p.dataset), 'srNoText');
    });

    it('adds the highlight class when the node has text', () => {
      const p = document.createElement('p');
      p.innerText = 'test';
      instance.processNodeHover(p);
      assert.include(Array.from(p.classList), 'sr-highlight');
    });
  });

  describe('processNodeOut()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
    });

    it('removes the highligh class', () => {
      const p = document.createElement('p');
      p.classList.add('sr-highlight');
      instance.processNodeOut(p);
      assert.notInclude(Array.from(p.classList), 'sr-highlight');
    });

    it('does not remove other classes', () => {
      const p = document.createElement('p');
      p.classList.add('sr-highlight');
      p.classList.add('other');
      instance.processNodeOut(p);
      assert.include(Array.from(p.classList), 'other');
    });

    it('does nothing when no highlight class', () => {
      const p = document.createElement('p');
      p.classList.add('other');
      instance.processNodeOut(p);
      assert.include(Array.from(p.classList), 'other');
    });
  });

  describe('handleMouseOver()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
    });

    it('calls the processNodeHover()', () => {
      const spy = sinon.spy(instance, 'processNodeHover');
      const e = new MockedPointerEvent('hover');
      e.target = document.body;
      instance.handleMouseOver(e);
      assert.isTrue(spy.calledOnce, 'the method was called');
    });

    it('ignores non-element nodes', () => {
      const spy = sinon.spy(instance, 'processNodeHover');
      const e = new MockedPointerEvent('hover');
      const text = document.createTextNode('test');
      e.target = text;
      instance.handleMouseOver(e);
      assert.isFalse(spy.called, 'the method was not called');
    });
  });

  describe('handleMouseOut()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
    });

    it('calls the processNodeOut()', () => {
      const spy = sinon.spy(instance, 'processNodeOut');
      const e = new MockedPointerEvent('hover');
      e.target = document.body;
      instance.handleMouseOut(e);
      assert.isTrue(spy.calledOnce, 'the method was called');
    });

    it('ignores non-element nodes', () => {
      const spy = sinon.spy(instance, 'processNodeOut');
      const e = new MockedPointerEvent('hover');
      const text = document.createTextNode('test');
      e.target = text;
      instance.handleMouseOut(e);
      assert.isFalse(spy.called, 'the method was not called');
    });
  });

  describe('play()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
      ChromeStub.load();
    });

    afterEach(() => {
      ChromeStub.unload();
    });

    it('sends the message to the event page', () => {
      const { sendMessage } = ChromeStub.stubs.runtime;
      instance.play('a message');
      assert.isTrue(sendMessage.calledOnce, 'the API was called');
      const msg = /** @type IContentMessage */ (sendMessage.args[0][0]);
      assert.equal(msg.type, 'play', 'has the "play" type');
      assert.equal(msg.data, 'a message', 'has the "data" property');
    });
  });

  describe('stop()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
      ChromeStub.load();
    });

    afterEach(() => {
      ChromeStub.unload();
    });

    it('sends the message to the event page', () => {
      const { sendMessage } = ChromeStub.stubs.runtime;
      instance.stop();
      assert.isTrue(sendMessage.calledOnce, 'the API was called');
      const msg = /** @type IContentMessage */ (sendMessage.args[0][0]);
      assert.equal(msg.type, 'stop', 'has the "stop" type');
      assert.isUndefined(msg.data, 'has no "data" property');
    });
  });

  describe('getNodeText()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
    });

    it('returns an empty string', async () => {
      const element = await fixture(html`<p></p>`);
      const result = instance.getNodeText(element);
      assert.equal(result, '');
    });

    it('returns the text from a text node', async () => {
      const element = await fixture(html`<p>test</p>`);
      const result = instance.getNodeText(element);
      assert.equal(result, 'test');
    });

    it('returns the text from a text node and a child node', async () => {
      const element = await fixture(html`<p>test<span>other</span></p>`);
      const result = instance.getNodeText(element);
      assert.equal(result, 'test other');
    });

    it('returns the text from all children', async () => {
      const element = await fixture(html`
        <article>
          <b>test</b>
          <span>other</span>
          <div><p>param</p> test</div>
        </article>
      `);
      const result = instance.getNodeText(element);
      assert.equal(result, 'test other param test');
    });
  });

  describe('prepareClone()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
    });

    it('makes a copy of a node', async () => {
      const element = await fixture(html`<p>test</p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });

    it('removes scripts', async () => {
      const element = await fixture(html`<p>test<script>var a = "";</script></p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });

    it('removes style', async () => {
      const element = await fixture(html`<p>test<style>a {}</style></p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });

    it('removes images', async () => {
      const element = await fixture(html`<p>test<img alt="none"/></p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });

    it('removes objects', async () => {
      const element = await fixture(html`<p>test<object type="application/pdf" width="250" height="200"></object></p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });

    it('removes embedded objects', async () => {
      const element = await fixture(html`<p>test<embed type="video/webm" width="250" height="200" /></p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });

    it('removes audio', async () => {
      const element = await fixture(html`<p>test<audio controls></audio></p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });

    it('removes audio', async () => {
      const element = await fixture(html`<p>test<audio controls></audio></p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });

    it('removes svg', async () => {
      const element = await fixture(html`<p>test<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg></p>`);
      const result = instance.prepareClone(element);
      assert.dom.equal(result, `<p>test</p>`);
    });
  });

  describe('handleMouseClick()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
      ChromeStub.load();
    });

    afterEach(() => {
      ChromeStub.unload();
    });

    it('ignores click to non-element nodes', () => {
      const { sendMessage } = ChromeStub.stubs.runtime;
      const txt = document.createTextNode('test');
      document.body.appendChild(txt);
      const e = new MockedPointerEvent('click');
      e.target = txt;
      instance.handleMouseClick(e);
      assert.isFalse(sendMessage.called);
    });

    it('ignores non-highlighted elements', async () => {
      const { sendMessage } = ChromeStub.stubs.runtime;
      const element = await fixture(html`<p>test</p>`);
      const e = new MockedPointerEvent('click');
      e.target = element;
      instance.handleMouseClick(e);
      assert.isFalse(sendMessage.called);
    });

    it('calls play() with the text', async () => {
      const spy = sinon.spy(instance, 'play');
      const element = await fixture(html`<p class="sr-highlight">test</p>`);
      const e = new MockedPointerEvent('click');
      e.target = element;
      instance.handleMouseClick(e);
      assert.isTrue(spy.calledOnce, 'play() was called');
      assert.equal(spy.args[0][0], 'test', 'has the text');
    });

    it('ignores empty nodes', async () => {
      const spy = sinon.spy(instance, 'play');
      const element = await fixture(html`<p class="sr-highlight"></p>`);
      const e = new MockedPointerEvent('click');
      e.target = element;
      instance.handleMouseClick(e);
      assert.isFalse(spy.calledOnce, 'play() was not called');
    });

    it('cleans up the message', async () => {
      const spy = sinon.spy(instance, 'play');
      const element = await fixture(html`<p class="sr-highlight">test<script>var a = "test";</script></p>`);
      const e = new MockedPointerEvent('click');
      e.target = element;
      instance.handleMouseClick(e);
      assert.isTrue(spy.calledOnce, 'play() was called');
      assert.equal(spy.args[0][0], 'test', 'has the text');
      assert.dom.equal(element, '<p class="sr-highlight">test<script>var a = "test";</script></p>');
    });
  });

  describe('disconnect()', () => {
    /** @type {AudioContentScript} */
    let instance;
    beforeEach(() => {
      instance = new AudioContentScript();
    });

    it('restores highlighted nodes', async () => {
      const element = await fixture(html`<p class="sr-highlight">test<script>var a = "test";</script></p>`);
      instance.disconnect();
      assert.notInclude(Array.from(element.classList), `sr-highlight`);
    });

    it('restores "no-text" nodes', async () => {
      const element = /** @type HTMLElement */ (await fixture(html`<p data-sr-no-text="true">test</p>`));
      instance.disconnect();
      assert.notInclude(Object.keys(element.dataset), `srNoText`);
    });
  });
});
