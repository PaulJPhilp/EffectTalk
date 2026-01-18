# effect-xml

Type-safe, composable XML parser for TypeScript using Effect.

## Installation

```bash
bun add effect-xml
```

## Usage

This package provides a simple API for parsing XML data in an Effect-native way.

### Parsing XML

To parse an XML string, use the `parseStringDefault` function:

```typescript
import { Effect } from "effect";
import * as xml from "effect-xml";

const xmlString = `
<?xml version="1.0" encoding="UTF-8"?>
<book>
  <title>The Great Gatsby</title>
  <author>F. Scott Fitzgerald</author>
  <year>1925</year>
</book>
`;

const program = xml.parseStringDefault(xmlString).pipe(
  Effect.flatMap((doc) => Effect.log(doc.root))
);

Effect.runPromise(program);
// Output: {
//   name: 'book',
//   attributes: {},
//   children: [
//     { name: 'title', attributes: {}, children: ['The Great Gatsby'] },
//     { name: 'author', attributes: {}, children: ['F. Scott Fitzgerald'] },
//     { name: 'year', attributes: {}, children: ['1925'] }
//   ]
// }
```

### Accessing Document Elements

The parsed XML document has a strongly-typed structure with a root element containing nested children:

```typescript
import { Effect } from "effect";
import * as xml from "effect-xml";

const xmlString = `
<library>
  <book id="1">
    <title>Book One</title>
  </book>
  <book id="2">
    <title>Book Two</title>
  </book>
</library>
`;

const program = xml.parseStringDefault(xmlString).pipe(
  Effect.map((doc) => {
    const books = doc.root.children.filter(
      (child) => typeof child !== "string" && child.name === "book"
    );
    return books.map((book) => ({
      id: book.attributes["id"],
      title: book.children.find((c) => typeof c !== "string" && c.name === "title")
    }));
  }),
  Effect.flatMap((books) => Effect.log(books))
);

Effect.runPromise(program);
```

### Working with Attributes

Elements can have attributes accessed via the `attributes` property:

```typescript
import { Effect } from "effect";
import * as xml from "effect-xml";

const xmlString = `
<image src="photo.jpg" alt="A photo" width="200" height="150" />
`;

const program = xml.parseStringDefault(xmlString).pipe(
  Effect.map((doc) => doc.root.attributes),
  Effect.flatMap((attrs) => Effect.log(attrs))
);

Effect.runPromise(program);
// Output: { src: 'photo.jpg', alt: 'A photo', width: '200', height: '150' }
```

### Error Handling

The `parseString` and `parseStringDefault` functions return a custom error type (`XmlParseError`) that you can catch and handle:

```typescript
import { Effect } from "effect";
import * as xml from "effect-xml";

const program = xml.parseStringDefault("<invalid>xml content").pipe(
  Effect.catchAll((error) =>
    Effect.log(`Failed to parse XML: ${error.message}`)
  )
);

Effect.runPromise(program);
```

## API Reference

### `parseStringDefault(xml: string): Effect<XmlDocument, XmlParseError>`

Parses an XML string into a structured document using the default backend.

**Parameters:**
- `xml` - A valid XML string

**Returns:** An Effect that resolves to an `XmlDocument` or fails with `XmlParseError`

**Example:**
```typescript
const doc = await Effect.runPromise(xml.parseStringDefault(xmlString));
```

### `parseString(xml: string): Effect<XmlDocument, XmlParseError, XmlBackend>`

Parses an XML string. Requires the `XmlBackend` to be provided as a dependency.

**Parameters:**
- `xml` - A valid XML string

**Returns:** An Effect that requires `XmlBackend` and resolves to an `XmlDocument`

## Types

### `XmlDocument`

```typescript
type XmlDocument = {
  readonly root: XmlElement;
};
```

### `XmlElement`

```typescript
type XmlElement = {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: ReadonlyArray<XmlElement | XmlText>;
};
```

### `XmlText`

```typescript
type XmlText = string;
```

## Features

- ✅ **Type-safe XML parsing** - Strongly typed element and attribute access
- ✅ **Effect-native** - Full integration with Effect for composition and error handling
- ✅ **Validation** - XML is validated before parsing
- ✅ **Nested structure** - Natural representation of XML hierarchy
- ✅ **Attribute support** - Direct access to element attributes
- ✅ **Mixed content** - Support for text and elements as children

## Under the Hood

effect-xml uses [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) for robust XML parsing, with Effect integration for type-safe error handling and composability.

## License

MIT
