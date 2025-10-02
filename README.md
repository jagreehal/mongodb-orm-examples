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

> **Important:** Using `InstanceType<typeof UserModel>` improves type safety in Mongoose by catching invalid field access at compile time. However, it does **not** solve the populated relations problem - TypeScript still cannot distinguish between populated and unpopulated fields.

1. **Accessing non-existent fields**
   Without proper typing, TypeScript does not catch typos or missing fields. For instance, writing `user.notARealField` will compile but fail at runtime.

   **Using `InstanceType<typeof UserModel>` helps:** It provides proper type safety for field access and will catch invalid fields at compile time. IntelliSense autocomplete works correctly, though the type signature shown on hover is complex (e.g., `Document<unknown, {}, UserDocument, {}, {}> & UserDocument & Required<{_id: unknown}> & {__v: number}`).

2. **Populated relations**
   When using `.populate()`, the type of the populated field is not guaranteed. Developers must use runtime checks or casts, undermining static typing.

   **Even with `InstanceType`, this remains a problem:** TypeScript cannot tell whether a field like `user.posts[0]` contains an ObjectId or a populated Post document. Accessing `user.posts[0].body` compiles successfully whether or not `.populate('posts')` was called, but fails at runtime when unpopulated. Prisma solves this with its `include` system, where types change based on the query.

3. **Instance methods**
   Converting a Mongoose document to a plain object (e.g. with `.toJSON()`) causes instance methods to be lost, yet TypeScript issues no warning.

#### Mongoose example from tests

```ts
// Without InstanceType - this compiles but shouldn't:
// @ts-expect-error This should error, but Mongoose allows it at runtime
expect(createdUser?.notARealField).toBeUndefined();

// With InstanceType - this DOES get caught by TypeScript:
const userInstance: InstanceType<typeof UserModel> = createdUser;
// @ts-expect-error - Detects type error at compile time
const invalidField = userInstance.doesNotExist;

// Populated fields are not type-safe (even with InstanceType):
// This compiles but posts[0] could be ObjectId or Post depending on .populate()
expect(userInstance.posts[0].body).toBe('Lots of really interesting stuff');
```

### Prisma

**Compile-time safety**: All model fields, relations and methods are type-checked. Accessing a non-existent field or relation results in a compile-time error.

#### Prisma example from tests

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
