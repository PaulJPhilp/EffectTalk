import { Schema } from "effect";

const ProductSchema = Schema.Array(
  Schema.Struct({
    id: Schema.NumberFromString,
    name: Schema.String,
    price: Schema.NumberFromString,
    inStock: Schema.BooleanFromString,
  })
);

export default {
  valid_products: {
    schema: ProductSchema,
    raw: `id,name,price,inStock
1,Widget,19.99,true
2,Gadget,29.99,false
3,Gizmo,39.99,true`,
    data: [
      { id: 1, name: "Widget", price: 19.99, inStock: true },
      { id: 2, name: "Gadget", price: 29.99, inStock: false },
      { id: 3, name: "Gizmo", price: 39.99, inStock: true },
    ],
    __metadata: {
      description: "Valid products with numeric prices",
      should_parse: true,
      should_validate: true,
      round_trip: true,
    },
  },

  with_special_chars: {
    schema: ProductSchema,
    raw: `id,name,price,inStock
1,"Widget & Co.",19.99,true
2,"Gadget (Pro)",29.99,false`,
    data: [
      { id: 1, name: "Widget & Co.", price: 19.99, inStock: true },
      { id: 2, name: "Gadget (Pro)", price: 29.99, inStock: false },
    ],
    __metadata: {
      description: "CSV with special characters in quoted fields",
      should_parse: true,
      should_validate: true,
      round_trip: true,
    },
  },

  empty_list: {
    schema: ProductSchema,
    raw: `id,name,price,inStock`,
    data: [],
    __metadata: {
      description: "CSV with only headers, no data rows",
      should_parse: true,
      should_validate: true,
      round_trip: false, // PapaParse returns empty string for empty arrays
    },
  },
} as const;
