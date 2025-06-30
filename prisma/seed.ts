import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed User
  const user = await prisma.user.create({
    data: {
      email: 'jane.doe@example.com',
      name: 'Jane Doe',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'Anystate',
        zip: '12345',
      },
    },
  });

  // Seed Post
  const post = await prisma.post.create({
    data: {
      slug: 'my-first-post',
      title: 'My First Post',
      body: 'This is the body of my first post.',
      authorId: user.id,
    },
  });

  // Seed Comment
  await prisma.comment.create({
    data: {
      comment: 'Great post!',
      postId: post.id,
    },
  });

  console.log('Seeding finished.');
}

try {
  await main();
} catch (error) {
  console.error(error);
  throw error;
}

await prisma.$disconnect();
