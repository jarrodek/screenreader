import { DemoModel } from './models/DemoModel.js';
import { expect, test } from './fixture.js';

test.describe('Screen reader', () => {
  test.describe('Integration tests', () => {
    /** @type DemoModel */
    let model;
    test.beforeEach(async ({ page }) => {
      model = new DemoModel(page);
      await model.openDemo();
    });

    test('adds the class name to the hovered element', async () => {
      await model.shortParagraph.hover();
      const styles = await model.readStyles(model.shortParagraph);
      expect(styles).toContain('sr-highlight');
    });

    test('applies styles (loads CSS)', async () => {
      const ref = await model.getReferenceOutline();
      await model.shortParagraph.hover();
      const outline = await model.shortParagraph.evaluate(node => getComputedStyle(node).outline);
      expect(outline).toEqual(ref);
    });

    test('ignores no text elements', async () => {
      await model.noTextElement.hover();
      const styles = await model.readStyles(model.noTextElement);
      expect(styles).not.toContain('sr-highlight');
    });

    test('ignores the body element', async () => {
      const body = model.page.locator('body');
      await body.hover();
      const styles = await model.readStyles(body);
      expect(styles).not.toContain('sr-highlight');
    });
  });
});
