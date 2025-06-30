import { faker } from '@faker-js/faker';
import { isDocument } from '@typegoose/typegoose';
import { connect, disconnect, startSession } from 'mongoose';
import { beforeAll, describe, expect, test } from 'vitest';
import { PostModel, UserModel } from './models.ts';

export function expectToBeDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

beforeAll(async () => {
  // @ts-expect-error - this is fine
  await connect(import.meta.env.VITE_DATABASE_URL!);

  return async () => {
    await disconnect();
  };
});

describe('Typegoose', () => {
  test('create a user', async () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const slug = faker.music.songName() + Date.now();
    const postTitle = faker.lorem.sentence();

    const session = await startSession();
    await session.startTransaction();

    try {
      const user = await UserModel.create(
        [
          {
            firstName,
            lastName,
            email,
          },
        ],
        { session },
      );
      const userId = user[0]._id;

      const post = await PostModel.create(
        [
          {
            title: postTitle,
            body: 'Lots of really interesting stuff',
            slug,
            author: userId,
            comments: [],
          },
        ],
        { session },
      );

      await UserModel.findByIdAndUpdate(
        userId,
        { $push: { posts: post[0]._id } },
        { session },
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error('Transaction aborted due to an error:', error);
      throw error;
    } finally {
      await session.endSession();
    }

    const createdUser = await UserModel.findOne({ email }).populate('posts');

    expect(createdUser).toBeDefined();
    expect(createdUser?.email).toBe(email);

    if (isDocument(createdUser?.posts[0])) {
      expect(createdUser?.posts[0].title).toBe(postTitle);
    }

    const postsWrittenByUser = await PostModel.find({
      author: createdUser?._id,
    }).populate('author');

    expect(postsWrittenByUser).toHaveLength(1);

    const author = isDocument(postsWrittenByUser[0].author)
      ? postsWrittenByUser[0].author
      : undefined;

    expectToBeDefined(author);
    expect(author.email).toBe(createdUser?.email);

    if (isDocument(postsWrittenByUser[0].author)) {
      expect(postsWrittenByUser[0].author.email).toBe(createdUser?.email);
    } else {
      expect('Author is not populated').toBeFalsy();
    }

    // Type safety pitfall: Accessing a non-existent field compiles, but fails at runtime
    // @ts-expect-error This should error, but Typegoose allows it at runtime
    expect(createdUser?.notARealField).toBeUndefined();

    // Type safety pitfall: Populated fields are not type-safe
    // The type of createdUser?.posts[0] is not guaranteed to be a Post document
    // @ts-expect-error TypeScript cannot guarantee this is a Post
    expect(createdUser?.posts[0].body).toBe('Lots of really interesting stuff');
  });
});
