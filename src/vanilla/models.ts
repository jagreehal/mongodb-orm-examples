import { Collection, MongoClient, ObjectId } from 'mongodb';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Post {
  _id: ObjectId;
  slug: string;
  title: string;
  body: string;
  author: ObjectId;
  comments: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address?: Address;
  posts: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id: ObjectId;
  comment: string;
  post: ObjectId;
}


export interface Database {
  users: Collection<User>;
  posts: Collection<Post>;
  comments: Collection<Comment>;
  client: MongoClient;
}

let client: MongoClient;

export async function connectToDatabase(uri: string): Promise<Database> {
  client = new MongoClient(uri);
  await client.connect();
  const database = client.db();
  return {
    users: database.collection<User>('users'),
    posts: database.collection<Post>('posts'),
    comments: database.collection<Comment>('comments'),
    client,
  };
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
  }
}

export function withId<T extends { _id: ObjectId }>(doc: T): T & { id: string } {
  return { ...doc, id: doc._id.toString() };
}
