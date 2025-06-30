# MongoDB ORM Type Safety Comparison

This repository demonstrates the differences in type safety between three popular Node.js ORMs/ODMs for MongoDB:

- **Prisma**
- **Mongoose**
- **Typegoose**

## Purpose

The aim of this repository is to illustrate, with genuine code examples, that **Prisma** delivers true end-to-end type safety, whereas **Mongoose** and **Typegoose** exhibit notable type-safety limitations that may precipitate runtime errors and bugs undetected by TypeScript.

## Comparison of Type Safety

| Feature                          | Prisma    | Mongoose     | Typegoose    |
| -------------------------------- | --------- | ------------ | ------------ |
| Compile-time type checking       | ✅ Yes    | ⚠️ Partial   | ⚠️ Partial   |
| Type-safe relations/population   | ✅ Yes    | ❌ No        | ❌ No        |
| Type-safe field access           | ✅ Yes    | ❌ No        | ❌ No        |
| Type-safe instance methods       | ✅ Yes    | ❌ No        | ❌ No        |
| Type errors caught by TypeScript | ✅ Always | ⚠️ Sometimes | ⚠️ Sometimes |

## Type-Safety Pitfalls

### Mongoose & Typegoose

1. **Accessing non-existent fields**  
   TypeScript does not always catch typos or missing fields. For instance, writing `user.notARealField` will compile but fail at runtime.

2. **Populated relations**  
   When using `.populate()`, the type of the populated field is not guaranteed. Developers must use runtime checks or casts, undermining static typing.

3. **Instance methods**  
   Converting a Mongoose document to a plain object (e.g. with `.toJSON()`) causes instance methods to be lost, yet TypeScript issues no warning.

#### Example from tests

```ts
// These lines compile, but are unsafe and may fail at runtime:
// @ts-expect-error This should error, but Mongoose/Typegoose allows it
expect(createdUser?.notARealField).toBeUndefined();

// Populated fields are not type-safe
// @ts-expect-error TypeScript cannot guarantee this is a Post
expect(createdUser?.posts[0].body).toBe('Lots of really interesting stuff');
Prisma
Compile-time safety
All model fields, relations and methods are type-checked. Accessing a non-existent field or relation results in a compile-time error.

Example from tests
```ts
// The following would fail to compile:
// @ts-expect-error Property 'notARealField' does not exist on type 'User'
// expect(createdUser?.notARealField).toBeUndefined();
```

### Usage

Install dependencies:

```sh
pnpm install
```

### Configure your MongoDB connection

Add your connection string to the environment (see test files for usage of VITE_DATABASE_URL).

### Run the tests

Run the tests:

```sh
pnpm test
```

### Summary

Prisma: Provides genuine end-to-end type safety. All type errors are caught at compile time, making it ideal for large codebases and teams.

Mongoose/Typegoose: Offers flexibility but limited type safety. Common mistakes—especially around relations and populated fields—are not caught by TypeScript.

Recommendation: If type safety is a priority, choose Prisma for your Node.js projects.
