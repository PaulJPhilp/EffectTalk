# effect-image

Type-safe, Effect-native image processing library for machine learning and AI workflows.

Built on [Sharp](https://sharp.pixelplumbing.com/) for high-performance image handling with comprehensive type safety and composable error handling via Effect.

## Features

✨ **Core Features**:
- 📷 **Decode** - Load JPEG, PNG, WebP images from buffers or files
- 💾 **Encode** - Save images to JPEG, PNG, WebP with quality control
- 📏 **Resize** - Flexible resizing with multiple fit strategies (cover, contain, fill)
- ✂️ **Crop** - Precise cropping with boundary validation
- 🎨 **Transforms** - Rotate, flip, grayscale conversion
- 📊 **Metadata** - Fast metadata extraction without full decoding

🤖 **ML/AI Features**:
- 📈 **Tensor Conversion** - Convert images to Float32Array tensors (HWC format)
- 📐 **Normalization** - Statistical normalization with custom mean/std (ImageNet-ready)
- 🔄 **Denormalization** - Reverse normalization for visualization
- 🔗 **Pipelines** - Composable operation chains for complex preprocessing
- 📦 **Batch Processing** - Efficient processing of multiple images
- 🔀 **Format Conversion** - PyTorch ↔️ TensorFlow tensor reshaping

## Installation

```bash
# Using Bun
bun add effect-image

# Using npm
npm install effect-image

# Using yarn
yarn add effect-image
```

## Quick Start

### Basic Image Resize

```typescript
import {
  decode,
  resize,
  encodeToFile,
  SharpBackendLayer,
} from "effect-image";
import { Effect } from "effect";
import { NodeFileSystem } from "@effect/platform-node";

const program = Effect.gen(function* () {
  // Read and decode image
  const image = yield* decode(jpegBuffer);

  // Resize to 512x512 (cover fit)
  const resized = yield* resize(image, 512, 512, { fit: "cover" });

  // Save to file
  yield* encodeToFile(resized, "output.jpg", "jpeg", { quality: 90 });
});

// Run with required dependencies
await Effect.runPromise(
  program.pipe(
    Effect.provide(SharpBackendLayer),
    Effect.provide(NodeFileSystem.layer)
  )
);
```

### ML Image Preprocessing (ImageNet)

```typescript
import { decodeFromFile, mlPreprocess, SharpBackendLayer } from "effect-image";
import { Effect } from "effect";
import { NodeFileSystem } from "@effect/platform-node";

const preprocess = Effect.gen(function* () {
  // Load image from file
  const image = yield* decodeFromFile("cat.jpg");

  // Resize to 224x224 and apply ImageNet normalization
  const tensor = yield* mlPreprocess(image, {
    width: 224,
    height: 224,
    fit: "cover",
    normalize: {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
    },
  });

  // tensor is now ready for model input
  // shape: [224, 224, 3]
  // values: Float32Array with normalized values
  return tensor;
});

const tensor = await Effect.runPromise(
  preprocess.pipe(
    Effect.provide(SharpBackendLayer),
    Effect.provide(NodeFileSystem.layer)
  )
);
```

### Custom Processing Pipeline

```typescript
import {
  decode,
  resize,
  toGrayscale,
  toTensor,
  normalize,
  compose,
  SharpBackendLayer,
} from "effect-image";
import { Effect } from "effect";

const myPipeline = compose(
  (img) =>
    resize(img, 256, 256, { fit: "contain" }),
  (img) => toGrayscale(img),
  (img) => Effect.succeed(img) // Pass through
);

const processed = await Effect.runPromise(
  decode(imageBuffer).pipe(
    Effect.flatMap(myPipeline),
    Effect.provide(SharpBackendLayer)
  )
);
```

## API Reference

### Reading Images

- **`decode(buffer, format?)`** - Decode image from Buffer
- **`decodeFromFile(path, format?)`** - Decode image from file
- **`getMetadata(buffer)`** - Get image metadata without decoding
- **`getMetadataFromFile(path)`** - Get metadata from file

### Writing Images

- **`encode(image, format, options?)`** - Encode ImageData to Buffer
- **`encodeToFile(image, path, format, options?)`** - Encode and save to file
- **`convert(buffer, targetFormat, options?)`** - Convert between formats

### Image Transformations

- **`resize(image, width, height, options?)`** - Resize with fit strategies
- **`crop(image, options)`** - Crop to region
- **`toGrayscale(image)`** - Convert to grayscale
- **`rotate(image, angle)`** - Rotate by angle (degrees)
- **`flipHorizontal(image)`** - Mirror horizontally
- **`flipVertical(image)`** - Mirror vertically

### ML Preprocessing

- **`toTensor(image, channels?)`** - Convert to Float32Array tensor
- **`fromTensor(tensor, width, height, format?)`** - Convert tensor to image
- **`normalize(image, options)`** - Apply statistical normalization
- **`denormalize(tensor, options)`** - Reverse normalization
- **`mlPreprocess(image, config)`** - Complete ML preprocessing pipeline
- **`compose(...operations)`** - Chain operations
- **`batchProcess(images, processor)`** - Process multiple images

### Tensor Utilities

- **`imageTensorFromData(image, channels?)`** - Convert ImageData to tensor
- **`tensorToImageData(tensor, width, height, format?)`** - Convert tensor to image
- **`normalizeTensor(tensor, options)`** - Normalize tensor values
- **`denormalizeTensor(tensor, options)`** - Denormalize tensor values
- **`reshapeCHWtoHWC(tensor, height, width)`** - PyTorch to TensorFlow format
- **`reshapeHWCtoCHW(tensor, height, width)`** - TensorFlow to PyTorch format

## Type Definitions

### ImageData

```typescript
interface ImageData {
  readonly width: number;
  readonly height: number;
  readonly channels: 3 | 4; // RGB or RGBA
  readonly format: ImageFormat;
  readonly data: Buffer; // Raw pixel buffer (RGBA format)
}
```

### TensorData

```typescript
interface TensorData {
  readonly shape: readonly [height: number, width: number, channels: number];
  readonly data: Float32Array; // Normalized 0-1
}
```

### ImageFormat

```typescript
type ImageFormat = "jpeg" | "png" | "webp";
```

## Error Handling

All operations return `Effect` with comprehensive error handling:

```typescript
import { Effect } from "effect";

const process = decode(buffer).pipe(
  Effect.catchTag("ImageDecodeError", (err) => {
    console.error(`Decode failed: ${err.message}`);
    return Effect.fail(new CustomError());
  }),
  Effect.catchTag("InvalidDimensionsError", (err) => {
    console.error(`Invalid dimensions: ${err.constraint}`);
    return Effect.succeed(defaultImage);
  })
);
```

### Error Types

- **`ImageDecodeError`** - Image decoding failed
- **`ImageEncodeError`** - Image encoding failed
- **`ImageProcessError`** - Image processing operation failed
- **`InvalidDimensionsError`** - Dimensions out of valid range
- **`InvalidInputError`** - Invalid input parameters
- **`UnsupportedFormatError`** - Unsupported image format
- **`FileNotFoundError`** - File does not exist
- **`FileIOError`** - File I/O operation failed
- **`MemoryError`** - Insufficient memory

## Common Patterns

### Batch Processing

```typescript
import {
  decodeFromFile,
  mlPreprocess,
  batchProcess,
  SharpBackendLayer,
} from "effect-image";
import { Effect } from "effect";

const imageFiles = ["image1.jpg", "image2.jpg", "image3.jpg"];

const batch = Effect.gen(function* () {
  // Load all images
  const images = yield* Effect.forEach(imageFiles, (path) =>
    decodeFromFile(path)
  );

  // Preprocess all images
  return yield* batchProcess(images, (img) =>
    mlPreprocess(img, {
      width: 224,
      height: 224,
      normalize: {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
      },
    })
  );
});

const tensors = await Effect.runPromise(
  batch.pipe(Effect.provide(SharpBackendLayer))
);
```

### Format Conversion

```typescript
import { convert, SharpBackendLayer } from "effect-image";
import { Effect } from "effect";

// Convert JPEG to WebP
const webpBuffer = await Effect.runPromise(
  convert(jpegBuffer, "webp", { quality: 80 }).pipe(
    Effect.provide(SharpBackendLayer)
  )
);
```

### Image Analysis

```typescript
import { getMetadataFromFile, SharpBackendLayer } from "effect-image";
import { Effect } from "effect";

const analyze = Effect.gen(function* () {
  const metadata = yield* getMetadataFromFile("image.jpg");

  console.log(`Size: ${metadata.width}x${metadata.height}`);
  console.log(`Format: ${metadata.format}`);
  console.log(`Has Alpha: ${metadata.hasAlpha}`);
  console.log(`File Size: ${metadata.sizeBytes} bytes`);
});

await Effect.runPromise(
  analyze.pipe(Effect.provide(SharpBackendLayer))
);
```

## Performance Considerations

### Memory

- Large images consume significant memory
- Max recommended dimension: 16,384 pixels (256 MP)
- Consider streaming for batch processing

### Optimization Tips

1. **Resize Early** - Resize before other operations
2. **Use Appropriate Formats**:
   - JPEG for photos (lossy, smaller)
   - PNG for graphics with transparency
   - WebP for modern browsers (best compression)
3. **Batch Operations** - Use `batchProcess` for multiple images
4. **Quality Settings** - Balance quality vs file size
   - Quality 80-90: Good for most use cases
   - Quality 60-70: For thumbnails
   - Quality 95+: For archival

## Supported Formats

| Format | Type    | Alpha Support | Use Case                    |
| ------ | ------- | ------------- | --------------------------- |
| JPEG   | Lossy   | No            | Photos, general images      |
| PNG    | Lossless| Yes           | Graphics, transparency      |
| WebP   | Lossy   | Yes           | Modern web, ML preprocessing|

## Dependencies

- **effect** ^3.19.9 - Effect system for composable error handling
- **@effect/platform** ^0.90.10 - Platform abstractions (FileSystem)
- **sharp** ^0.33.5 - Image processing engine

## Architecture

### Backend Abstraction

The library uses a backend abstraction to enable multiple implementations:

```typescript
// Currently provided
export { SharpBackend, SharpBackendLayer } from "effect-image";

// Future backends could include:
// - WasmBackend (browser-compatible)
// - CanvasBackend (browser DOM)
// - OpenCVBackend (advanced processing)
```

### Service Pattern

All services follow Effect's modern service pattern with `accessors: true`:

```typescript
export class ImageService extends Effect.Service<ImageService>()(
  "ImageService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      // Service implementation
    }),
  }
) {}
```

## Contributing

Contributions welcome! Please follow the Hume project guidelines:

1. Use Effect patterns consistently
2. Maintain strict TypeScript typing (no implicit any)
3. Add comprehensive tests
4. Document with JSDoc
5. Follow Biome formatting

## License

MIT

## See Also

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Effect Documentation](https://effect.website/)
- [Hume Project](https://github.com/PaulJPhilp/hume)
