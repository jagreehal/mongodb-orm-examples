import { connectDatabase, db } from './db.ts';

async function main() {
  await connectDatabase();

  const user = await db.orm.users.create({
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'Anystate',
      zip: '12345',
    },
  });

  const post = await db.orm.posts.create({
    slug: 'my-first-post',
    title: 'My First Post',
    body: 'This is the body of my first post.',
    authorId: user._id,
  });

  await db.orm.comments.create({
    comment: 'Great post!',
    postId: post._id,
  });

  console.log('Seeding finished.');
}

try {
  await main();
} catch (error) {
  console.error(error);
  throw error;
} finally {
  await db.close();
}
