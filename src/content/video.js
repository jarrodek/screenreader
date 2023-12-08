/** @typedef {import('../types').IContentMessage} IContentMessage */

const PROCESSED_DATA = "srImageProcessed";
const PROCESSED_ATT = "data-sr-image-processed";
const CORS_ERROR = "data-sr-cors-error";

/**
 * The class that is responsible for managing interactions with a video element.
 */
export default class VideoContentScript {
  /**
   * Lifecycle method when the content script is unloaded
   * for whatever reason (uninstall, extension reload, etc).
   * Cleans up any previously set state and restores any changes.
   */
  disconnect() {
    const marked = document.body.querySelectorAll(`[${PROCESSED_ATT}]`);
    for (const node of Array.from(marked)) {
      this.restoreImage(/** @type HTMLImageElement */ (node));
    }
  }
  
  /**
   * Handles the mouseover event.
   *
   * @param {PointerEvent} e
   */
  handleMouseOver(e) {
    const node = /** @type HTMLElement */ (e.target);
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    if(node.nodeName !== 'IMG'){
      return;
    }
    if(node.dataset[PROCESSED_DATA] === "true" || node.hasAttribute(CORS_ERROR)) {
      return;
    }
    const image = /** @type HTMLImageElement */ (node);
    this.processImage(image);
  }

  /**
   * Handles the mouseout event.
   *
   * @param {PointerEvent} e
   */
  handleMouseOut(e) {
    const node = /** @type HTMLElement */ (e.target);
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    if(node.nodeName !== 'IMG'){
      return;
    }
    const image = /** @type HTMLImageElement */ (node);
    this.restoreImage(image);
  }

  /**
   * @param {HTMLImageElement} img 
   */
  restoreImage(img) {
    if(img.dataset[PROCESSED_DATA] !== "true") {
      return;
    }
    const src = img.dataset['src'];
    img.src = src;
    img.removeAttribute(PROCESSED_ATT);
  }

  /**
   * @param {HTMLImageElement} image The image element to process.
   * @returns {Promise<void>}
   */
  async processImage(image) {
    const { src } = image;
    if (!src) {
      return;
    }
    try {
      const img = await this.createImage(src);
      const data = this.adjustBrightnessContrast(img, 0, 1.5);
      image.dataset['src'] = src;
      image.dataset[PROCESSED_DATA] = 'true';
      image.src = data;
    } catch (e) {
      image.setAttribute(CORS_ERROR, 'true');
    }
  }

  /**
   * Creates an image element from the URL.
   * 
   * @param {string} url The URL of the image to process.
   * @returns {Promise<HTMLImageElement>}
   */
  createImage(url) {
    const img = new Image();
    try {
      img.src = url;
    } catch (e) {
      return Promise.reject(e);
    }
    if (img.complete) {
      return Promise.resolve(img);
    }
    return new Promise((resolve, reject) => {
      img.onload = () => {
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Unable to download image: ${url}`));
      };
    });
  }

  /**
   * @param {HTMLImageElement} image The image to process
   * @param {number} brightness The brightness value in the range of 0...1.
   * @param {number} contrast THe contrast value in a range of 0...1.
   * @returns {string}
   */
  adjustBrightnessContrast(image, brightness, contrast) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    // Set canvas dimensions to match the image
    canvas.width = image.width;
    canvas.height = image.height;
    // Draw the image onto the canvas
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    // Get the image data from the canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    this.processPixelData(data, brightness, contrast);
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }

  /**
   * @param {Uint8ClampedArray} data The image data to process
   * @param {number} brightness 
   * @param {number} contrast
   */
  processPixelData(data, brightness, contrast) {
    // Adjust brightness and contrast
    for (let i = 0; i < data.length; i += 4) {
      // Adjust brightness
      data[i] += brightness; // Red channel
      data[i + 1] += brightness; // Green channel
      data[i + 2] += brightness; // Blue channel

      // Adjust contrast
      data[i] = (data[i] - 128) * contrast + 128; // Red channel
      data[i + 1] = (data[i + 1] - 128) * contrast + 128; // Green channel
      data[i + 2] = (data[i + 2] - 128) * contrast + 128; // Blue channel
    }
  }
}
