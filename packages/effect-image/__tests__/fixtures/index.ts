/**
 * Test Fixtures for effect-image
 *
 * Provides helper functions and test data for image processing tests.
 */

import sharp from "sharp";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const FIXTURES_DIR = join(import.meta.dirname || __dirname, ".");

/**
 * Create a test image with specified dimensions and format
 */
async function createTestImage(
  width: number,
  height: number,
  format: "jpeg" | "png" | "webp",
  filename: string
): Promise<Buffer> {
  // Create a simple test image with a gradient pattern
  const data = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;

      // Create a simple gradient pattern
      data[i] = Math.floor((x / width) * 255); // Red gradient
      data[i + 1] = Math.floor((y / height) * 255); // Green gradient
      data[i + 2] = 128; // Blue constant
    }
  }

  // Create image with Sharp and convert to target format
  const buffer = await sharp(data, {
    raw: {
      width,
      height,
      channels: 3,
    },
  })
    .toFormat(format as any)
    .toBuffer();

  // Save to fixtures directory if filename provided
  if (filename) {
    const filepath = join(FIXTURES_DIR, filename);
    try {
      mkdirSync(FIXTURES_DIR, { recursive: true });
      writeFileSync(filepath, buffer);
    } catch (err) {
      // Silently fail if we can't write (might be in non-writable location)
    }
  }

  return buffer;
}

/**
 * Generate all test fixtures
 */
export async function generateFixtures(): Promise<void> {
  try {
    mkdirSync(FIXTURES_DIR, { recursive: true });

    // Create 100x100 test images in each format
    await createTestImage(100, 100, "jpeg", "test-100x100.jpg");
    await createTestImage(100, 100, "png", "test-100x100.png");
    await createTestImage(100, 100, "webp", "test-100x100.webp");

    // Create larger test image
    await createTestImage(256, 256, "jpeg", "test-256x256.jpg");

    // Create rectangular image (landscape)
    await createTestImage(200, 150, "jpeg", "test-landscape.jpg");

    // Create rectangular image (portrait)
    await createTestImage(150, 200, "jpeg", "test-portrait.jpg");
  } catch (err) {
    console.error("Failed to generate test fixtures:", err);
    throw err;
  }
}

/**
 * Get test image buffer by name
 */
export async function getTestImage(
  format: "jpeg" | "png" | "webp",
  width: number = 100,
  height: number = 100
): Promise<Buffer> {
  const filename = `test-${width}x${height}.${format === "jpeg" ? "jpg" : format}`;
  const filepath = join(FIXTURES_DIR, filename);

  // Try to load from disk
  if (existsSync(filepath)) {
    return readFileSync(filepath);
  }

  // Otherwise, generate on the fly
  return createTestImage(width, height, format, "");
}

/**
 * Create invalid image data for error testing
 */
export function getInvalidImageBuffer(): Buffer {
  return Buffer.from("This is not a valid image");
}

/**
 * Create an empty buffer
 */
export function getEmptyBuffer(): Buffer {
  return Buffer.alloc(0);
}

/**
 * Get a simple test image (100x100 JPEG)
 */
export async function getSimpleTestImage(): Promise<Buffer> {
  return getTestImage("jpeg", 100, 100);
}

/**
 * Get test images in all supported formats
 */
export async function getAllFormatImages(): Promise<{
  jpeg: Buffer;
  png: Buffer;
  webp: Buffer;
}> {
  return {
    jpeg: await getTestImage("jpeg"),
    png: await getTestImage("png"),
    webp: await getTestImage("webp"),
  };
}
