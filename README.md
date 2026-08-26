# MongoDB ORM Type Safety Comparison

This repository demonstrates the differences in type safety between three popular Node.js ORMs/ODMs for MongoDB:

- **Prisma 8** (`@prisma/orm-mongo`)
- **Mongoose**
- **Typegoose**
- **Vanilla MongoDB driver**

## Purpose

The aim of this repository is to illustrate, with genuine code examples, how **Prisma 8**, **Mongoose**, and **Typegoose** differ on end-to-end type safety — especially around relations / population.

## Comparison of Type Safety

| Feature                          | Prisma 8  | Mongoose     | Typegoose 13 |
| -------------------------------- | --------- | ------------ | ------------ |
| Compile-time type checking       | ✅ Yes    | ⚠️ Partial   | ✅ Yes       |
| Type-safe relations/population   | ✅ Yes    | ❌ No        | ⚠️ Guarded   |
| Type-safe field access           | ✅ Yes    | ⚠️ With help | ✅ Yes       |
| Type-safe instance methods       | ✅ Yes    | ❌ No        | ⚠️ Partial   |
| Type errors caught by TypeScript | ✅ Always | ⚠️ Sometimes | ✅ Usually   |

## Type-Safety Pitfalls

### Mongoose

> **Important:** Using `InstanceType<typeof UserModel>` improves type safety in Mongoose by catching invalid field access at compile time. However, it does **not** solve the populated relations problem - TypeScript still cannot distinguish between populated and unpopulated fields.

1. **Accessing non-existent fields**
   Without proper typing, TypeScript does not catch typos or missing fields. For instance, writing `user.notARealField` will compile but fail at runtime.

   **Using `InstanceType<typeof UserModel>` helps:** It provides proper type safety for field access and will catch invalid fields at compile time.

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

### Typegoose 13

**Field access is type-safe** — `findOne` returns a `DocumentType`-shaped document, so invalid fields are compile errors.

**Populate is still the gap vs Prisma:** `.populate('posts')` does not refine `Ref<Post>` to `Post`. Unsafe `.body` access is rejected (good), but you must narrow with `isDocument()` at runtime. Prisma `.include('posts')` changes the result type instead.

#### Typegoose example from tests

```ts
// Invalid fields are caught:
// @ts-expect-error - Property 'notARealField' does not exist
expect(createdUser?.notARealField).toBeUndefined();

// Populate does not refine Ref<Post> — need isDocument():
if (isDocument(createdUser?.posts[0])) {
  expect(createdUser.posts[0].title).toBe(postTitle);
}

// @ts-expect-error - Property 'body' does not exist on type 'Ref<Post>'
expect(createdUser?.posts[0].body).toBe('Lots of really interesting stuff');
```

### Prisma 8

**Compile-time safety**: All model fields, relations and methods are type-checked from the emitted contract. Accessing a non-existent field or relation results in a compile-time error. Relations use `.include('posts')` / `.include('author')`, which change the result type.

#### Prisma 8 example from tests

```ts
const userWithPosts = await db.orm.users
  .where({ email })
  .include('posts')
  .first();

// The following would fail to compile:
// expect(userWithPosts?.notARealField).toBeUndefined();
```

### Usage

Install dependencies:

```sh
pnpm install
pnpm contract:emit
```

Prisma 8 uses a contract (`src/prisma/contract.prisma`) instead of `schema.prisma` + `prisma generate`. `contract emit` writes `src/prisma/contract.json` and `src/prisma/contract.d.ts`.

### Configure your MongoDB connection

Set `VITE_DATABASE_URL` in `.env` (see `.env.example`).

### Run the tests

```sh
pnpm test
```

### Summary

Prisma 8: End-to-end type safety, `.include()` refines relation types at compile time.

Typegoose 13: Strong field-level typing; populate still needs `isDocument()` because `.populate()` does not change `Ref<T>`.

Mongoose: Flexible but weaker defaults — often needs `InstanceType` / casts, and populate still does not refine types.
