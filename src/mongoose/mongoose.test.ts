import { faker } from '@faker-js/faker';
import { connect, disconnect, startSession } from 'mongoose';
import { beforeAll, describe, expect, test } from 'vitest';
import { PostModel, User, UserModel } from './models.ts';

beforeAll(async () => {
  // @ts-expect-error - this is fine
  await connect(import.meta.env.VITE_DATABASE_URL!);

  return async () => {
    await disconnect();
  };
});

describe('Mongoose', () => {
  test('create a user', async () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const slug = faker.music.songName() + Date.now();
    const postTitle = faker.lorem.sentence();
    const password = faker.internet.password();

    const session = await startSession();
    await session.startTransaction();

    try {
      const user = await UserModel.create(
        [
          {
            firstName,
            lastName,
            email,
            password,
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
    expect(createdUser?.posts[0].title).toBe(postTitle);

    if (!createdUser) {
      throw new Error('No created user');
    }

    // map createdUser to User
    const user: User = createdUser.toJSON();

    if (!user) {
      throw new Error('No user');
    }

    // Type safety pitfall: Accessing a non-existent field compiles, but fails at runtime
    // @ts-expect-error This should error, but Mongoose allows it at runtime
    expect(createdUser?.notARealField).toBeUndefined();

    // Type safety pitfall: Populated fields are not type-safe
    // The type of createdUser?.posts[0] is not guaranteed to be a Post document
    expect(createdUser?.posts[0].body).toBe('Lots of really interesting stuff');

    // Type safety pitfall: Methods are not available on plain objects
    // @ts-expect-error user is a plain object, not a Mongoose document
    expect(user.fullName).toBeUndefined();

    const userInDB = await UserModel.findById(createdUser._id);

    if (!userInDB) {
      throw new Error('No user in DB');
    }

    expect(userInDB.fullName()).toBe(`${firstName} ${lastName}`);

    const postsWrittenByUser = await PostModel.find({
      author: userInDB._id,
    }).populate('author');

    expect(postsWrittenByUser).toHaveLength(1);
    expect(postsWrittenByUser[0].author.email).toBe(createdUser?.email);
  });
});
