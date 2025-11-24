import { faker } from '@faker-js/faker';
import { ClientSession, MongoClient, ObjectId } from 'mongodb';
import { beforeAll, describe, expect, test } from 'vitest';
import {
  connectToDatabase,
  Database,
  Post,
  User,
  withId,
} from './models';

let db: Database;
let client: MongoClient;

beforeAll(async () => {
  const result = await connectToDatabase(process.env.VITE_DATABASE_URL!);
  db = result;
  client = result.client;
});

describe('Vanilla MongoDB', () => {
  test('full type safety with ObjectId refs', async () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const slug = faker.music.songName() + Date.now();
    const postTitle = faker.lorem.sentence();
    const password = faker.internet.password();

    const session: ClientSession = client.startSession();

    try {
      await session.withTransaction(async () => {
        const now = new Date();
        const userId = new ObjectId();
        const userInsert: User = {
          _id: userId,
          email,
          password,
          firstName,
          lastName,
          posts: [],
          createdAt: now,
          updatedAt: now,
        };
        const userResult = await db.users.insertOne(userInsert, { session });
        expect(userResult.insertedId.toString()).toBe(userId.toString());

        const postId = new ObjectId();
        const postInsert: Post = {
          _id: postId,
          slug,
          title: postTitle,
          body: 'Lots of really interesting stuff',
          author: userId,
          comments: [],
          createdAt: now,
          updatedAt: now,
        };
        const postResult = await db.posts.insertOne(postInsert, { session });
        expect(postResult.insertedId.toString()).toBe(postId.toString());

        await db.users.updateOne(
          { _id: userId },
          { $push: { posts: postId } },
          { session },
        );

        return { userId, postId };
      });
    } finally {
      await session.endSession();
    }

    const createdUser = await db.users.findOne({ email });
    expect(createdUser).toBeDefined();

    if (!createdUser) throw new Error('No created user');

    const fullName = `${createdUser.firstName} ${createdUser.lastName}`;
    expect(fullName).toBe(`${firstName} ${lastName}`);

    const createdUserWithId = withId(createdUser);
    expect(createdUserWithId.id).toBe(createdUser._id.toString());

    const populatedUser = await db.users.findOne({ email });
    if (!populatedUser) throw new Error('No user');

    const populatedPosts = await db.posts
      .find({ _id: { $in: populatedUser.posts } })
      .toArray();

    expect(populatedPosts).toHaveLength(1);
    expect(populatedPosts[0].title).toBe(postTitle);
    expect(populatedPosts[0].author.toString()).toBe(
      populatedUser._id.toString(),
    );
  });

  test('type safety catches invalid fields', async () => {
    const now = new Date();
    const userId = new ObjectId();
    const userInsert: User = {
      _id: userId,
      email: faker.internet.email(),
      password: faker.internet.password(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      posts: [],
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.users.insertOne(userInsert);
    expect(result.insertedId.toString()).toBe(userId.toString());

    const userInDb = await db.users.findOne({ _id: userId });
    if (!userInDb) throw new Error('No user');

    // @ts-expect-error - 'notARealField' does not exist on User
    const invalidField: string = userInDb.notARealField;

    // @ts-expect-error - ObjectId is not assignable to string
    const wrongType: string = userInDb._id;

    // This correctly types as string after converting
    const userIdString: string = userInDb._id.toString();
    expect(userIdString).toBeDefined();
  });
});
