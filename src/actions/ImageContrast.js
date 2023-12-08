/**
 * @param {HTMLImageElement} image The image to process
 * @param {number} brightness The brightness value in the range of 0...1.
 * @param {number} contrast THe contrast value in a range of 0...1.
 * @returns {string}
 */
function adjustBrightnessContrast(image, brightness, contrast) {
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
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/**
 * Creates an image element from the URL.
 * 
 * @param {string} url The URL of the image to process.
 * @returns {Promise<HTMLImageElement>}
 */
function createImage(url) {
  const img = new Image();
  img.src = url;
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
 * Changes the contrast and the brightness of the image.
 * @param {string} url The URL of the image to process.
 * @param {({ brightness?: number; contrast?: number; })} options 
 * @returns 
 */
export default async function(url, options = {}) {
  const { brightness = 0, contrast = 1.5 } = options;
  const img = await createImage(url);
  const data = adjustBrightnessContrast(img, brightness, contrast);
  return data;
}
