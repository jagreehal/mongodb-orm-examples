import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { connectDatabase, db } from './db.ts';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('Prisma 8', () => {
  test('create a user with a related post', async () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const slug = faker.music.songName() + Date.now();
    const postTitle = faker.lorem.sentence();

    const createdUser = await db.orm.users.create({
      email,
      firstName,
      lastName,
      address: null,
    });

    await db.orm.posts.create({
      slug,
      title: postTitle,
      body: 'Lots of really interesting stuff',
      authorId: createdUser._id,
    });

    const userWithPosts = await db.orm.users
      .where({ email })
      .include('posts')
      .first();

    expect(userWithPosts?.email).toBe(email);
    expect(userWithPosts?.posts).toHaveLength(1);
    expect(userWithPosts?.posts[0]?.title).toBe(postTitle);

    const postsWrittenByUser = await db.orm.posts
      .where({ authorId: createdUser._id })
      .include('author')
      .all();

    expect(postsWrittenByUser).toHaveLength(1);
    expect(postsWrittenByUser[0]?.author?.email).toBe(email);

    // Compile-time only — these properties do not exist on the user result type
    // @ts-expect-error Property 'notARealField' does not exist
    expect(userWithPosts?.notARealField).toBeUndefined();
    // @ts-expect-error Property 'body' does not exist on user (it's on Post)
    const _missingOnUser: string | undefined = userWithPosts?.body;
    expect(_missingOnUser).toBeUndefined();
  });
});
