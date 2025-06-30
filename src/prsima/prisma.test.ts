import { describe } from 'node:test';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { expect, test } from 'vitest';

const prisma = new PrismaClient();

describe('Prisma', () => {
  test('create a user', async () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const slug = faker.music.songName() + Date.now();
    const postTitle = faker.lorem.sentence();

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        posts: {
          create: {
            title: postTitle,
            body: 'Lots of really interesting stuff',
            slug,
          },
        },
      },
    });

    const createdUser = await prisma.user.findFirst({
      where: { email },
      include: {
        posts: true,
      },
    });
    expect(createdUser?.email).toBe(email);
    expect(createdUser?.posts[0].title).toBe(postTitle);

    const postsWrittenByUser = await prisma.post.findMany({
      where: { authorId: createdUser?.id },
      // try commenting out the include block and see what happens
      include: {
        author: true,
      },
    });
    expect(postsWrittenByUser).toHaveLength(1);
    expect(postsWrittenByUser[0].author?.email).toBe(createdUser?.email);

    // Prisma is fully type-safe: the following would fail to compile
    // expect(createdUser?.notARealField).toBeUndefined();
    // expect(createdUser?.body).toBe('Lots of really interesting stuff');
  });
});
